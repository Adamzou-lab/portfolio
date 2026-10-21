# Portfolio adamzou.fr : Traversée et maquette Atelier

Version du 5 octobre 2026. Adam a choisi **Traversée** pour remplacer l’ancien portfolio sur [adamzou.fr](https://adamzou.fr/) et a explicitement autorisé sa publication. La maquette **01 Atelier d’orchestration** reste conservée localement pour référence. Intro de Claude conservée. Le texte « adam. » est retiré de l’intro dans Atelier et Traversée ; le logo reste en haut à gauche du portfolio.

La maquette **03 Traversée** est disponible à côté, dans `traversee.html`. Les titres restent à gauche. Adam a ensuite demandé une navigation **À propos / Contact en haut à droite**, avec « adam. » à gauche. Les commandes « Rejouer l’intro » et « Intro au ralenti » ont été retirées de Traversée.

Ajustement demandé ensuite : en-tête plus compact et grand titre réduit d’environ 22 % sur bureau, avec réduction adaptée au mobile, pour faire remonter les projets.

## Publication et maintenance

Le dossier courant conserve les deux maquettes. **Ne pas le synchroniser intégralement sur le serveur.** `../scripts/build-production.py` prépare une liste limitée de fichiers publics dans `../tmp/deploy/<version>/site/` : Traversée devient `index.html`, les liens vers Atelier sont retirés et les pages À propos et Contact retournent directement à cet accueil. Les liens internes HTML sont versionnés pour éviter de réutiliser l’ancien cache du navigateur ; les URL canoniques restent sans paramètre.

La version initiale `20261004-145013` a été vérifiée sur le domaine public et `www` : intro, cinq projets, pages communes et téléchargement du CV. La version `20261004-150030` retire les commandes d’intro et ajoute la navigation en haut à droite ; son rendu a été contrôlé à 320 px et dans le navigateur public. La version `20261005-072626` lance l’intro à chaque chargement de l’accueil et retour via l’historique, sans relance au changement de projet. « Passer », préchargement et mouvements réduits sont conservés. L’accueil et le script d’intro servis en HTTPS correspondent au build. La version active depuis le 19 octobre est `20261019-141855` (CV d’octobre et lien LinkedIn corrigé). Les fichiers de l’ancien site et les sauvegardes sont conservés. La [procédure de déploiement et de retour arrière](docs/deploiement.md) décrit la préparation, les contrôles et les chemins serveur. La documentation, les tests, le générateur historique et Atelier ne sont pas publiés.

## Traversée

En-tête validé par Adam : « Des agents à l’œuvre. / Des idées à l’épreuve. ». Description : « J’explore l’orchestration d’agents IA à travers des problèmes concrets. Chaque POC présente une approche, son fonctionnement et ses limites. »

Ouvrir http://127.0.0.1:4174/traversee.html?intro=1. Pour les contrôles internes, `?intro=1&duree=11200` ralentit l’intro ; `?reduit=1` permet de vérifier les mouvements réduits. Ces commandes ne sont plus proposées dans l’interface de Traversée. La préférence système est également respectée.

- `traversee.html` : structure de la scène interactive et du dossier.
- `js/traversee-projects.js` : source unique des cinq projets (Pennyworth, Lockin, PeerCheck, Hbntory, Maili). Génère leurs onglets, étapes et dossiers.
- `css/traversee.css` : composition mesurée sur `../design/maquettes/03-traversee.png` (1487 × 1058), puis responsive.
- `js/traversee.js` : chapitres, historique, clavier, dossiers et illustration locale de la demande. `SETTINGS` expose les durées : chapitre 820 ms, entrée 1150 ms, connexions 1100 ms, étapes 550 ms.
- `assets/traversee-background-v2.png` : fond édité avec imagegen depuis la maquette, grain affiné. V1 conservée comme essai non utilisé.
- Inter variable, Phosphor et LeaderLine 1.0.8 dans `js/vendor/` sont servis localement, licences incluses.
- En prévisualisation locale, les pages communes conservent le retour vers Traversée avec `?vue=traversee`. Sans ce paramètre, elles reviennent à Atelier. Le build de production normalise ces liens sans paramètre et retire le script de navigation Atelier des pages communes.

Pas de défilement capturé, pas de lecture automatique des projets, aucun appel API. Sur mobile, sélectionner un chapitre ramène à son début ; les onglets défilent horizontalement et l’onglet actif reste visible. La composition est fidèle ; le grain reconstruit et la police approchée ne sont pas identiques pixel pour pixel au dessin généré.

Pour les futurs ajouts : suivre [le workflow d’intégration](docs/ajouter-un-projet.md). Une fiche dans le registre suffit ; les transitions, connexions, dossiers et commandes clavier sont partagés. Maili est présenté comme une automatisation par règles, son étage IA restant à implémenter.

## À propos, Contact et CV

- `about.html?vue=traversee` : parcours personnel inspiré de l’ancien site, approche par POCs et spécialisation en orchestration d’agents. Le DWWM actuel est distingué du cursus Agentic AI FullStack visé en novembre 2026.
- `contact.html?vue=traversee` : coordonnées, disponibilité en alternance et CV. Les deux pages partagent `css/information.css` et `js/information.js`, avec le fond granuleux de Traversée, titres centrés et logo en haut à gauche.
- Animations d’apparition de 640 ms, respect de `prefers-reduced-motion` et de `?reduit=1`. Le contenu reste visible sans JavaScript.
- PDF de référence : CV général d’Adam, copié sans modification. Fichier servi et nom de téléchargement : `assets/documents/CV_ADAM_ZOUAOUI.pdf`.
- `assets/documents/CV_ADAM_ZOUAOUI.png` est un rendu complet de la page PDF à 1200 px de large. Lors du remplacement du CV, remplacer aussi cet aperçu et actualiser sa date et son poids dans Contact. Conserver le nom PDF stable et son attribut `download`.
- La singularité du cursus est qualifiée par « À ma connaissance » et « sur campus à Toulouse », sur le périmètre ingénierie agentique + titre RNCP complet de niveau 6. Sources et limites : recherche du 4 octobre, conservée hors du dépôt public. Ne pas transformer cette recherche limitée en preuve d’exclusivité absolue.

## Démarrer

Depuis ce dossier : `python3 -m http.server 4174 --bind 127.0.0.1`.
Ouvrir http://127.0.0.1:4174/traversee.html pour la version choisie ; la racine locale ouvre encore Atelier. Les paramètres `?intro=1` et `?intro=1&duree=11200` restent disponibles pour forcer et ralentir l’intro pendant les contrôles internes. Traversée n’affiche aucun bouton de relance ni lien de ralenti ; `js/intro.js` tolère l’absence du bouton de relance. Le bouton « Passer » pendant l’intro est conservé.

## Sources locales communes et Atelier

- `index.html` : maquette Atelier locale et trois dossiers accessibles via les ancres `#pennyworth`, `#lockin`, `#peercheck`. Cet index n’est pas publié : le build utilise `traversee.html` à sa place.
- `about.html`, `contact.html` : pages françaises avec la même navigation et le même style.
- `css/atelier.css` : tokens, grille, responsive, états et intro.
- `js/atelier.js` : arrivée du contenu après l’intro, dossiers animés, ancres et historique.
- `js/atelier-flow.js` : parcours illustratif. Aucun appel à un modèle, à une API ou à un outil métier.
- `js/intro.js` : intro de Claude ; géométrie, timings et lumière inchangés.
- `assets/background.webp`, `hand-robot.webp`, `hand-human.webp` : assets originaux de l’intro.

Les anciens dossiers complets `pocs/*.html`, `css/site.css` et `js/site.js` restent disponibles comme références, mais leur habillage n’est pas encore migré. L’accueil utilise ses nouveaux dossiers intégrés.

**Le générateur `outils/build_site.py` est historique : ne pas le lancer sur cette version. Il écraserait les pages avec l’ancien design.** Pour la version publique, modifier `traversee.html`, `about.html`, `contact.html` et leurs dépendances, puis préparer une nouvelle version avec `../scripts/build-production.py`.

## Réglages du mouvement d’Atelier

- Parcours : `_durations` dans `atelier-flow.js` (1 200 / 1 400 / 450 / 1 200 ms). La troisième étape attend le clic « Valider la suite ».
- Les étapes sont inspectables individuellement. Pause volontaire, onglet masqué, sortie du champ et intro suspendent le parcours.
- Ouverture/fermeture des dossiers : 460 ms, courbe définie dans `atelier.js`. Les clics peuvent inverser une transition en cours.
- Réduction des mouvements : pas de lecture automatique du parcours, navigation étape par étape, pas d’animation des dossiers. L’intro conserve sa version en fondus.
- L’entrée des titres utilise uniquement opacité et translation ; le grain reste stationnaire.

## Vérification

`node --test tests/atelier-flow.test.mjs`

`node --test tests/traversee-projects.test.mjs`

Les rapports de contrôle visuel de Traversée et d’Atelier sont conservés hors du dépôt public. Interactions vérifiées dans le navigateur intégré, sur bureau et mobile.

## Typographie et icônes

DM Sans variable et Phosphor Regular sont hébergés localement pour éviter les apparitions tardives. Licences conservées à côté des fichiers.

- Police : https://github.com/google/fonts/tree/main/ofl/dmsans
- Icônes : https://phosphoricons.com/ et paquet `@phosphor-icons/core@2.1.1`.

## Limites des démonstrations

Les contenus de dossiers viennent de l’étude documentaire locale ; les produits sous-jacents n’ont pas été réévalués ici. Les animations du parcours illustrent le fonctionnement et ne réalisent aucune action réelle. Les preuves vidéo et captures réelles pourront enrichir les dossiers ensuite.
