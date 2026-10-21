#!/usr/bin/env python3
"""Installation transactionnelle sur le VPS existant. À lancer via SSH, en root.

Arguments : identifiant de version, SHA-256 de l'archive, SHA-256 de la config actuelle.
L'archive doit être transférée dans /tmp/adamzou-<version>.tar.gz au préalable.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import time

release, archive_hash, expected_config_hash = sys.argv[1:]
assert re.fullmatch(r'\d{8}-\d{6}', release)
assert os.geteuid() == 0
archive = Path(f'/tmp/adamzou-{release}.tar.gz')
config = Path('/etc/nginx/sites-enabled/hub')
original = config.read_bytes()
assert hashlib.sha256(original).hexdigest() == expected_config_hash, 'Configuration modifiée depuis la préparation'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == archive_hash, 'Archive de transfert incorrecte'
original_text = original.decode()
assert 'server_name adamzou.fr www.adamzou.fr;' in original_text
roots = re.findall(r'^\s*root (/var/www/pocs(?:-releases/\d{8}-\d{6})?);', original_text, re.M)
assert len(roots) == 1, 'Racine du portfolio inattendue'
previous_root = Path(roots[0])

backup = Path('/var/backups/adamzou') / release
backup.mkdir(parents=True, mode=0o700, exist_ok=False)
backup.parent.chmod(0o700)
shutil.copy2(config, backup / 'nginx-hub.conf')
subprocess.run(['tar', '-czpf', str(backup / 'ancien-portfolio.tar.gz'), '-C', str(previous_root.parent), previous_root.name], check=True)
subprocess.run(['tar', '-tzf', str(backup / 'ancien-portfolio.tar.gz')], check=True, stdout=subprocess.DEVNULL)

destination = Path('/var/www/pocs-releases') / release
destination.mkdir(parents=True, exist_ok=False)
with tarfile.open(archive) as bundle:
    for item in bundle.getmembers():
        target = (destination / item.name).resolve()
        assert destination.resolve() in target.parents and item.isfile(), 'Entrée d’archive inattendue'
    for item in bundle.getmembers():
        target = destination / item.name
        target.parent.mkdir(parents=True, exist_ok=True)
        with bundle.extractfile(item) as source, target.open('wb') as output:
            shutil.copyfileobj(source, output)
for item in destination.rglob('*'):
    item.chmod(0o755 if item.is_dir() else 0o644)
destination.chmod(0o755)
assert (destination / 'index.html').is_file() and (destination / 'assets/documents/CV_ADAM_ZOUAOUI.pdf').is_file()

redirects = '''
    # Anciennes adresses du portfolio et liens de la maquette.
    location = /traversee.html { return 301 https://adamzou.fr/$is_args$args; }
    location = /peercheck.html { return 301 https://adamzou.fr/#peercheck; }
    location = /pocs/peercheck.html { return 301 https://adamzou.fr/#peercheck; }
    location ^~ /pocs/ { return 301 https://adamzou.fr/#chapitres; }
    location = /assets/documents/CV_ADAM_ZOUAOUI.pdf {
        add_header Content-Disposition 'inline; filename="CV_ADAM_ZOUAOUI.pdf"';
    }
    location ~* \\.html$ {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }
'''
new_config = original_text.replace(f'root {previous_root};', f'root {destination};')
if 'location = /traversee.html' not in original_text:
    new_config = new_config.replace("add_header Content-Disposition 'attachment; filename=\"Adam_Zouaoui_CV.pdf\"';",
                                    'return 301 https://adamzou.fr/assets/documents/CV_ADAM_ZOUAOUI.pdf;')
    new_config = new_config.replace('    location / {', redirects + '\n    location / {')
assert new_config.count('location ^~ /pocs/') == 1
pending = config.with_name(f'hub.pending-{release}')
pending.write_text(new_config)
shutil.copymode(config, pending)
# Remplacement atomique du fichier ; Nginx continue à servir l'ancienne configuration
# jusqu'au test réussi et au rechargement gracieux.
os.replace(pending, config)
try:
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    # Le reload gracieux rend la main avant la prise de service des nouveaux workers.
    # Attendre la nouvelle réponse, sans assimiler ce bref délai à un déploiement échoué.
    for attempt in range(12):
        body = subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--max-time', '3',
                                        '-H', 'Host: adamzou.fr', 'http://127.0.0.1/'])
        if body == (destination / 'index.html').read_bytes():
            break
        time.sleep(0.4)
    else:
        raise AssertionError('Nouvelle page absente après attente du rechargement')
except BaseException:
    rollback = config.with_name(f'hub.rollback-{release}')
    rollback.write_bytes(original)
    shutil.copymode(backup / 'nginx-hub.conf', rollback)
    os.replace(rollback, config)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    raise

record = {'release': release, 'root': str(destination), 'backup': str(backup),
          'previous_root': str(previous_root),
          'config': str(config), 'archive_sha256': archive_hash,
          'previous_config_sha256': expected_config_hash,
          'readiness_attempts': attempt + 1,
          'config_sha256': hashlib.sha256(config.read_bytes()).hexdigest()}
(backup / 'deployment.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record))
