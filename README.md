# Portfolio adamzou.fr

Sources du portfolio **Traversée**, en ligne sur [adamzou.fr](https://adamzou.fr/) depuis le 4 octobre 2026. Site statique en HTML, CSS et JavaScript, sans framework ni étape de compilation côté navigateur.

## Ce que présente le site

Cinq POCs d’orchestration d’agents IA et d’automatisation. Chaque projet a son parcours illustratif et un dossier : besoin, rôle, fonctionnement, périmètre et limites.

| Projet | Parcours |
| --- | --- |
| Pennyworth | Planifier. Faire valider. Agir. |
| Lockin | Rechercher. Lire. Garder un cadre. |
| PeerCheck | Lire. Analyser. Faire progresser. |
| Hbntory | Questionner. Consulter. Répondre. |
| Maili | Synchroniser. Trier. Garder le contrôle. |

Les parcours sont des illustrations animées : ils n’appellent aucun modèle, aucune API ni aucun outil métier.

## Organisation

- [`claude-preview/`](claude-preview/README.md) : sources du site (Traversée, maquette Atelier, À propos, Contact et CV), tests et documentation.
- `scripts/build-production.py` : prépare la version publique dans `tmp/deploy/<version>/`. Traversée devient l’accueil, seule une liste explicite de fichiers est publiée et les liens sont versionnés contre le cache.
- `scripts/deploy-production-remote.py` : installe une version sur le serveur, avec contrôle des empreintes, sauvegarde, test Nginx et retour arrière automatique en cas d’échec.
- [`design/maquettes/`](design/maquettes/) : les trois directions explorées le 4 octobre 2026 et leurs prompts. Traversée a été retenue.

## Lancer en local

```sh
cd claude-preview
python3 -m http.server 4174 --bind 127.0.0.1
```

Ouvrir http://127.0.0.1:4174/traversee.html. La racine locale ouvre la maquette Atelier.

## Tests

```sh
cd claude-preview
node --test tests/atelier-flow.test.mjs tests/traversee-projects.test.mjs
```

## Ajouter un projet ou publier

- Ajouter un projet : une entrée dans `claude-preview/js/traversee-projects.js` suffit, voir [le workflow d’intégration](claude-preview/docs/ajouter-un-projet.md).
- Publier : `python3 scripts/build-production.py`, puis suivre [le guide de déploiement et de retour arrière](claude-preview/docs/deploiement.md). Les accès au serveur ne sont pas dans ce dépôt.

## Crédits

Polices DM Sans et Inter, icônes Phosphor et LeaderLine 1.0.8 sont servis localement. Leurs licences sont incluses à côté des fichiers, dans `claude-preview/assets/fonts/`, `claude-preview/assets/icons/` et `claude-preview/js/vendor/`.
