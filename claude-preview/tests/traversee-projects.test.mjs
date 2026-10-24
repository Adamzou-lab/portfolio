import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {PROJECTS} from '../js/traversee-projects.js';

// Contrat éditorial : détecte une fiche incomplète avant son intégration.
test('chaque projet a une ancre unique et un parcours complet', () => {
  assert.ok(PROJECTS.length > 0);
  assert.equal(new Set(PROJECTS.map(p => p.id)).size, PROJECTS.length);
  for (const p of PROJECTS) {
    assert.match(p.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const field of ['name','subtitle','request','placeholder','plan','review','copy','action']) {
      assert.ok(typeof p[field] === 'string' && p[field].trim(), `${p.id}.${field} absent`);
    }
    assert.ok(Array.isArray(p.steps) && p.steps.length > 0, `${p.id}.steps absent`);
    assert.ok(p.steps.every(s => typeof s === 'string' && s.trim()));
  }
});

test('chaque dossier documente le rôle et les limites, avec des liens publics facultatifs', () => {
  for (const {id,dossier:d} of PROJECTS) {
    for (const field of ['eyebrow','type','need','role','system','limits']) {
      assert.ok(typeof d?.[field] === 'string' && d[field].trim(), `${id}.dossier.${field} absent`);
    }
    for (const field of ['title','tags']) {
      assert.ok(Array.isArray(d[field]) && d[field].length > 0, `${id}.dossier.${field} absent`);
      assert.ok(d[field].every(s => typeof s === 'string' && s.trim()));
    }
    // L’ancien champ `link` n’est plus lu : le signaler plutôt que l’ignorer.
    assert.equal(d.link, undefined, `${id}.dossier.link remplacé par links`);
    if (d.links) {
      assert.ok(Array.isArray(d.links) && d.links.length > 0, `${id}.dossier.links vide`);
      for (const link of d.links) {
        const url = new URL(link.url);
        assert.equal(url.protocol, 'https:');
        assert.equal(url.username + url.password, '');
        assert.ok(link.label?.trim());
        // `demo` rend aussi le grand titre du projet cliquable.
        assert.ok(['demo', 'code'].includes(link.kind), `${id} : kind attendu demo ou code`);
      }
      assert.ok(d.links.filter(link => link.kind === 'demo').length <= 1, `${id} : une seule démo`);
    }
  }
});

test('chaque présentation vidéo facultative pointe vers des fichiers publiés et affiche sa durée', () => {
  for (const {id,video} of PROJECTS) {
    if (video === undefined) continue;
    for (const field of ['src','poster']) {
      assert.match(video[field] ?? '', /^assets\/videos\/[a-z0-9-]+\.(mp4|webp)$/, `${id}.video.${field}`);
      assert.ok(existsSync(new URL('../' + video[field], import.meta.url)), `${id}.video.${field} introuvable`);
    }
    assert.ok(Number.isInteger(video.duration) && video.duration > 0, `${id}.video.duration en secondes`);
  }
});
