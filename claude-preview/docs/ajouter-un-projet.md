# Ajouter un projet dans Traversée

Chaque projet conserve le même parcours animé : intention → étapes → résultat, puis un dossier détaillé. Les données sont dans **`js/traversee-projects.js`** ; ajouter une entrée au tableau `PROJECTS` suffit. Aucun onglet, compteur, lien d’ancre, dossier HTML ou scénario d’animation supplémentaire à coder.

## Procédure

1. Lire les sources du projet : README, code, notes récentes. Distinguer le fonctionnement réel, les fonctionnalités prévues et le rôle d’Adam.
2. Décrire un cas concret en trois panneaux. Garder des titres courts et environ trois étapes lisibles ; les étapes sont rendues depuis le tableau `steps`.
3. Copier une fiche existante dans `PROJECTS`, choisir un `id` unique et stable (minuscules, chiffres, tirets). L’ordre du tableau détermine les numéros et la navigation. Un lien direct devient `traversee.html#mon-projet`.
4. Remplir le dossier : besoin, rôle, fonctionnement, périmètre, technologies. `links` liste la démo publique vérifiée (`kind: 'demo'`, une au plus) et le dépôt public (`kind: 'code'`), s’ils existent ; ils remplacent les technologies en bas du dossier. La démo rend aussi le grand titre du projet cliquable. Omettre `links` pour un projet privé ou sans lien public vérifié. Ne mettre aucun secret, courrier réel ou donnée personnelle dans les exemples.
5. Facultatif, si le projet a un film validé par Adam : copier le MP4 (H.264, `moov` en tête) et sa miniature convertie en WebP dans `assets/videos/` sous le nom de l’`id`, puis renseigner `video` avec la durée en secondes. Le bouton « Démo vidéo · N s » apparaît à côté de « Voir le POC » ; le film n’est chargé qu’à l’ouverture du lecteur. Le script de mise en ligne publie tout le dossier `assets/videos/`.
6. Exécuter `node --test claude-preview/tests/traversee-projects.test.mjs` depuis la racine du prototype.
7. Vérifier dans le navigateur : entrée depuis l’intro, changement rapide de projet, animation du parcours, dossier, lien direct et retour arrière. Tester aussi à 820 et 390 px, ainsi qu’avec `?reduit=1`. Le clavier utilise les flèches, Début et Fin. L’onglet sélectionné doit rester visible dans le rail mobile.

## Fiche à copier

```js
{
  id: 'mon-projet', name: 'Mon projet',
  subtitle: 'Une signature courte.',
  request: 'Le point de départ', placeholder: 'Un exemple de demande…',
  plan: 'Ce que fait le système',
  steps: ['Première étape', 'Deuxième étape', 'Troisième étape'],
  review: 'Le résultat', copy: 'Ce que le visiteur obtient ou contrôle.',
  action: 'Voir le fonctionnement',
  // Seulement pour un film validé :
  // video: {src: 'assets/videos/mon-projet.mp4', poster: 'assets/videos/mon-projet.webp', duration: 34},
  dossier: {
    eyebrow: 'Domaine · Particularité', type: 'Projet personnel',
    title: ['Une première ligne.', 'Une seconde ligne.'],
    need: 'Le problème traité.',
    role: 'La contribution réelle d’Adam et celle de ses coéquipiers.',
    system: 'Les étapes et les outils effectivement utilisés.',
    limits: 'Le périmètre testé et les limites actuelles.',
    tags: ['Outil', 'Compétence'],
    // Seulement pour une démo ou un dépôt publics vérifiés :
    // links: [
    //   {kind: 'demo', url: 'https://…', label: 'Ouvrir la démo'},
    //   {kind: 'code', url: 'https://github.com/…', label: 'Voir le code'},
    // ],
  },
},
```

Les textes sont insérés comme du texte, sans HTML. Les parcours restent des illustrations locales ; la saisie n’est ni transmise ni stockée. `SETTINGS` dans `js/traversee.js` règle les durées communes. Les trois cartes persistantes permettent de réutiliser leurs connexions ; la navigation annule les animations et minuteurs du projet précédent.

## Sources des ajouts du 4 octobre 2026

- **Hbntory / Zaiko** : dépôt local `holbertonschool-hbntory`, `README.md`, `docs/decisions.md`, `ai_service/src/agents.py`, `client_web/README.md`. Projet collectif : Adam intervient notamment sur le client et l’intégration ; l’architecture des agents et le serveur MCP sont attribués à Erwan. Le stock est consulté en lecture seule. Le chat reçoit sa réponse avant d’en animer le texte.
- **Maili** : dépôt local `maili`, `README.md`, `src/classify/index.js`, `src/actions/index.js`, `src/serve.js`, note de session du 24 août 2026. Worker embarqué confirmé par le code, malgré un README ancien. Classement par règles : l’étage IA n’est pas implémenté. Application privée, sans lien public.

Ces sources décrivent les produits ; les services métier n’ont pas été démarrés ni réévalués pendant l’intégration au portfolio.
