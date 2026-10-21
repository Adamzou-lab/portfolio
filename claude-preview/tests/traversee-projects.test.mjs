import test from 'node:test';
import assert from 'node:assert/strict';
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

test('chaque dossier documente le rôle et les limites, avec un lien public facultatif', () => {
  for (const {id,dossier:d} of PROJECTS) {
    for (const field of ['eyebrow','type','need','role','system','limits']) {
      assert.ok(typeof d?.[field] === 'string' && d[field].trim(), `${id}.dossier.${field} absent`);
    }
    for (const field of ['title','tags']) {
      assert.ok(Array.isArray(d[field]) && d[field].length > 0, `${id}.dossier.${field} absent`);
      assert.ok(d[field].every(s => typeof s === 'string' && s.trim()));
    }
    if (d.link) {
      const url = new URL(d.link.url);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username + url.password, '');
      assert.ok(d.link.label?.trim());
    }
  }
});
