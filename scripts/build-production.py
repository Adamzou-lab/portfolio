#!/usr/bin/env python3
"""Prépare uniquement les fichiers publics de Traversée, sans modifier les maquettes."""
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import shutil
import tarfile
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'claude-preview'
release = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
work = ROOT / 'tmp' / 'deploy' / release
site = work / 'site'
site.mkdir(parents=True, exist_ok=False)

files = [
    'css/atelier.css', 'css/traversee.css', 'css/information.css',
    'js/intro.js', 'js/traversee.js', 'js/traversee-projects.js', 'js/information.js',
    'js/vendor/leader-line.min.js', 'js/vendor/leader-line.LICENSE',
    'assets/background.webp', 'assets/hand-robot.webp', 'assets/hand-human.webp',
    'assets/traversee-background-v2.webp',
    'assets/documents/CV_ADAM_ZOUAOUI.pdf', 'assets/documents/CV_ADAM_ZOUAOUI.webp',
]
files += [str(p.relative_to(SOURCE)) for directory in ('assets/fonts', 'assets/icons', 'assets/videos')
          for p in sorted((SOURCE / directory).iterdir()) if p.is_file() and not p.name.startswith('.')]
for name in files:
    target = site / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE / name, target)

# Safari a resservi un module importé d’une version précédente malgré `no-store` :
# chaque version charge ses scripts et styles sous une adresse qui lui est propre.
traversee_js = site / 'js/traversee.js'
module_import = "from './traversee-projects.js'"
assert module_import in traversee_js.read_text()
traversee_js.write_text(traversee_js.read_text().replace(module_import, f"from './traversee-projects.js?v={release}'"))

for original, published in [('traversee.html', 'index.html'), ('about.html', 'about.html'), ('contact.html', 'contact.html')]:
    html = (SOURCE / original).read_text()
    html = html.replace('<a href="index.html">Version Atelier</a>', '')
    html = html.replace('<script type="module" src="js/atelier.js"></script>', '')
    html = html.replace('traversee.html', '/')
    html = html.replace('index.html#projets', '/#chapitres').replace('href="index.html"', 'href="/"')
    html = html.replace('about.html?vue=traversee', '/about.html').replace('contact.html?vue=traversee', '/contact.html')
    html = html.replace('href="about.html"', 'href="/about.html"').replace('href="contact.html"', 'href="/contact.html"')
    html = html.replace('<title>adam. — Traversée</title>', '<title>Adam Zouaoui · Orchestration d’agents IA</title>')
    html = re.sub(r'((?:src|href)=")((?:js|css)/[^"?]+)(?:\?[^"]*)?"', rf'\g<1>\g<2>?v={release}"', html)
    # Les anciennes pages HTML étaient conservées longtemps dans certains navigateurs.
    # Les liens versionnés chargent la bonne version ; les URL canoniques restent propres.
    def version_page(match):
        url = urlsplit(match.group(1).replace('&amp;', '&'))
        if url.scheme or url.netloc or url.path not in ('/', '/about.html', '/contact.html'):
            return match.group(0)
        query = dict(parse_qsl(url.query))
        query['v'] = release
        destination = urlunsplit(('', '', url.path, urlencode(query), url.fragment))
        return 'href="' + destination.replace('&', '&amp;') + '"'
    html = re.sub(r'href="([^"]+)"', version_page, html)
    canonical = 'https://adamzou.fr/' + ('' if published == 'index.html' else published)
    html = html.replace('</head>', f'<link rel="canonical" href="{canonical}">\n</head>')
    assert 'Version Atelier' not in html and 'js/atelier.js' not in html
    assert 'intro__name' not in html and '?vue=' not in html
    (site / published).write_text(html)

(site / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://adamzou.fr/sitemap.xml\n')
(site / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>https://adamzou.fr/{p}</loc></url>\n' for p in ['', 'about.html', 'contact.html'])
    + '</urlset>\n')

class References(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value:
                references.append((page, value))

references = []
for page in site.glob('*.html'):
    References().feed(page.read_text())
for page in (site / 'css').glob('*.css'):
    references += [(page, url.strip('\"\'')) for url in re.findall(r'url\(([^)]+)\)', page.read_text())]
for page, value in references:
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        continue
    path = unquote(url.path)
    target = site / path.lstrip('/') if path.startswith('/') else page.parent / path
    if path == '/':
        target = site / 'index.html'
    assert target.resolve().is_relative_to(site.resolve()), f'Chemin hors publication : {value}'
    assert target.is_file(), f'Ressource manquante : {page.name} -> {value}'

manifest = {str(p.relative_to(site)): sha256(p.read_bytes()).hexdigest()
            for p in sorted(site.rglob('*')) if p.is_file()}
(work / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
with tarfile.open(work / 'site.tar.gz', 'w:gz', format=tarfile.PAX_FORMAT) as archive:
    for name in manifest:
        archive.add(site / name, arcname=name, recursive=False)
print(json.dumps({'release': release, 'directory': str(work), 'files': len(manifest),
                  'archive_bytes': (work / 'site.tar.gz').stat().st_size,
                  'archive_sha256': sha256((work / 'site.tar.gz').read_bytes()).hexdigest()}))
