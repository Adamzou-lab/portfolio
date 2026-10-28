# Publication et maintenance d’adamzou.fr

Dernière mise à jour : 28 octobre 2026. Adam a explicitement autorisé le remplacement de son ancien portfolio par Traversée. La version active est `20261028-093317` (intro avec les mains en caractères ; voir ci-dessous). Depuis `20261005-072626`, l’intro se lance à chaque arrivée sur l’accueil. Les deux versions conservent À propos et Contact en haut à droite, « adam. » à gauche et l’absence des commandes de relance et de ralenti. Les contrôles initiaux et ceux des mises à jour sont consignés ci-dessous.

## Intro avec les mains en caractères, 28 octobre

Demande d’Adam : intégrer à l’intro les mains en caractères du prototype `~/mains-ascii` (version qu’il a validée le 28/10), en local d’abord, puis publication sur son autorisation explicite après essai sur son téléphone. Commit `cecc7d9`.
- Fichiers : `js/intro-ascii/rig.js`, `ascii.js`, `gl.js` (moteur du prototype, sous l’espace de noms `IntroAscii`) et `moteur.js` (pont avec l’intro), chargés par `traversee.html` avant `js/intro.js`, et ajoutés à la liste de `scripts/build-production.py`. La maquette Atelier ne les charge pas et garde les images.
- `js/intro.js` garde son cadrage, son minutage, sa pose et sa lumière ; en caractères, la lumière suit les bouts des index animés, et le fond granuleux est atténué à 40 % sous les mains, puis rétabli sous le blanc.
- Retour automatique aux images : scripts absents, pas de WebGL, préparation de plus de 1,5 s (2 s au plus en tout), test de vitesse à plus de 28 ms par image, contexte graphique perdu ou erreur pendant l’intro. Mouvement réduit : mains en caractères immobiles. `?mains=images` force les images, `portfolioIntro.ascii()` donne l’état.
- Préparation accélérée sans changer le résultat (image préparée identique au pixel près à celle du prototype) : l’effacement des fils sous le poignet du robot passait 385 ms dans WebKit, 58 ms ensuite. Le départ de l’intro est retardé de 0,1 s dans WebKit et de 0,05 s dans Chromium ; le minutage ensuite est identique.
- Défaut signalé par Adam, corrigé : au départ, les mains apparaissaient doigts tendus, comme à la fin, puis les index se repliaient d’un coup avant de se déplier. Les articulations sont désormais placées dans la pose de départ (index repliés) avant la première image, comme dans le prototype.
- Contrôlé en local : Chromium et WebKit, 1440 × 900 et 390 × 844, mouvement réduit, sans WebGL, contexte perdu, Passer et rejouer, Atelier, tests 7/7, build `20261028-090909` (54 fichiers, aucune ressource manquante, adresses versionnées). Essai d’Adam sur son téléphone : bon.
- Mise en ligne **par le Terminal de la plateforme Chilemme**, faute d’accès SSH : l’entrée `dns.safa.chilemme.com:2008` (nouveau nom, ancien `dns.safa.hugochilemme.com`, même adresse) refusait toute connexion, depuis la box d’Adam comme depuis son téléphone, alors que `sshd` écoutait normalement sur le VPS. Dans le Terminal (root), Adam a collé : clone du dépôt public dans `/tmp/portfolio-src` (pointe `cecc7d9`), `python3 scripts/build-production.py` (version `20261028-093317`, 54 fichiers), copie de l’archive vers `/tmp/adamzou-$R.tar.gz`, puis `python3 scripts/deploy-production-remote.py $R <empreinte de l’archive> <empreinte de hub>`. Installation `/var/www/pocs-releases/20261028-093317/`, sauvegarde `/var/backups/adamzou/20261028-093317/`, précédente racine `20261024-185118`, `nginx -t` réussi, page servie au deuxième contrôle.
- Contrôle public : version `20261028-093317` servie, `js/intro.js`, `js/intro-ascii/*.js` et `css/atelier.css` identiques aux sources ; À propos, Contact et CV en 200, redirections `/traversee.html` et `/pocs/` en 301 ; intro en caractères active dans Chromium et WebKit, 1440 × 900 et 390 × 844, sans erreur. Seul `/favicon.ico` répond 404, comme avant (aucune icône déclarée).

## Textes restants de l’audit, 24 octobre (soir)

Trois propositions validées telles quelles par Adam, publication autorisée explicitement (commit `ed68d67`) :
- Pied de page d’À propos et Contact : « Adam Zouaoui · Toulouse », comme l’accueil (l’ordre des éléments reste propre à chaque page).
- Exemples du champ raccourcis pour tenir entiers de 320 à 1920 px : « Votre intention… », « Votre question… », « github.com/toi/… », « 10 routeurs… », « Facture, promo… ».
- Dossier Hbntory, « Le fonctionnement » raccourci (la disponibilité entre magasins reste citée dans « Mon rôle ») : plus de défilement en 1470 × 860 ni 1440 × 900.

Contrôles en local puis en ligne (WebKit) : aucun exemple coupé à 320, 390, 820, 1024, 1280, 1440, 1470 et 1920 px, dossier Hbntory sans défilement sur ces deux écrans, pied de page vérifié, aucune erreur ; tests 7/7. Installation `/var/www/pocs-releases/20261024-185118/`, sauvegarde `/var/backups/adamzou/20261024-185118/`, précédente racine `20261024-183001`. Public : 45/46 fichiers non vidéo identiques (Contact : Cloudflare).

## Corrections d’alignement et d’esthétique, 24 octobre (soir)

Audit visuel demandé par Adam (WebKit, de 320 à 1920 px), lot de cinq corrections validé sur captures locales puis publié sur son autorisation explicite (commit `d1113bb`) :
- Grands titres de projet à `6vw` au lieu de `6.45vw` (et `min(52px, 15.4vw)` sous 760 px) : la flèche du titre cliquable de Pennyworth touchait ou chevauchait la première carte ; écart désormais de 19 à 36 px, et plus de débordement dans la marge à 320 px.
- Accueil : `.portfolio` en colonne d’au moins `100dvh`, l’écran Traversée occupe la hauteur restante ; sur tablette en portrait, plus de bande de texture sous le pied de page.
- Dossier et lecteur vidéo : `tabindex="-1"` et focus sur la fenêtre elle-même à l’ouverture ; l’anneau noir de la croix n’apparaît plus à la souris.
- Lecteur : fond transparent et `object-fit: cover`, plus de liseré sombre en haut et en bas des films à fond clair.
- En-tête commun : variables `--header-height` et `--brand-size` ; À propos et Contact reprennent exactement la géométrie de l’accueil (bloc final de `css/information.css`) et les liens sont centrés sur le logo. Mesuré en ligne : logo et liens à la même position sur les trois pages, à 1 px près, de 320 à 1920 px.

Faux positif écarté : la « coupure du fond » d’À propos et Contact n’apparaît que sur une capture pleine page (fond fixe) ; en défilant, le rendu est correct. Non traités, à décider par Adam : texte unique du pied de page, exemples coupés dans le champ, dossier Hbntory qui défile à 1470 × 860.

Installation `/var/www/pocs-releases/20261024-183001/`, sauvegarde `/var/backups/adamzou/20261024-183001/`, précédente racine `20261024-171802`. Public : 45/46 fichiers non vidéo identiques (Contact : Cloudflare), aucune erreur console.

## Scripts et styles versionnés, 24 octobre (soir)

Constat dans le Safari d’Adam après rechargement : nouveau `traversee.js` (libellé « Présentation vidéo ») mais ancien `traversee-projects.js` (Pennyworth sans lien, Hbntory sans film). Safari a resservi le module importé d’une version précédente malgré `Cache-Control: no-store`. Correctif dans `scripts/build-production.py` (commit `748bdb7`) : chaque `src`/`href` vers `js/` ou `css/` des trois pages reçoit `?v=<version>`, et l’import de `js/traversee.js` pointe vers `./traversee-projects.js?v=<version>` (même adresse que le `modulepreload`, donc un seul chargement). Les sources ne changent pas ; seule la copie publiée est réécrite.

Publication autorisée explicitement par Adam. Installation `/var/www/pocs-releases/20261024-171802/`, sauvegarde `/var/backups/adamzou/20261024-171802/`, précédente racine `20261024-170552`. Contrôles : build servi en local (`portfolio-builds`, port 4175) puis public, cinq projets corrects, 45/46 fichiers non vidéo identiques (Contact : Cloudflare), aucune erreur console. Dans le Safari d’Adam, un simple rechargement affiche le titre Pennyworth cliquable.

## Dossier Hbntory recentré sur la gestion de stock, 24 octobre (soir)

Texte validé par Adam, publication autorisée explicitement. Seul `js/traversee-projects.js` change : sous-titre « Suivre. Agir. Tracer. » (chapitres du film Zaiko), parcours « Réapprovisionner » / « Mouvement de stock » / « Un stock à jour et tracé », dossier « Plusieurs magasins. Un stock sous contrôle. ». Faits repris du dépôt (`README.md`, `docs/mvp.md`, `backoffice/README.md`) : l’administrateur ne modifie pas le stock, chaque employé gère celui de son magasin. La phrase sur le démarrage Docker « à confirmer » est retirée, faute de vérification depuis le correctif du 30/07.

Contrôles : tests 7/7 ; textes de la page et du dossier vérifiés en local puis en ligne, exemple du champ entier à 1440, 820 et 390 px. Seul ce dossier défile légèrement à 1440 × 900 (37 px), la barre et la croix restant fixes. Installation `/var/www/pocs-releases/20261024-170552/`, sauvegarde `/var/backups/adamzou/20261024-170552/`, précédente racine `20261024-165707`. Public : 45/46 fichiers non vidéo identiques (Contact : Cloudflare), aucune erreur console.

## Présentations vidéo de Zaiko et Maili, Pennyworth cliquable, 24 octobre (soir)

Publication autorisée explicitement par Adam, qui a validé Zaiko v4 « stock » et Maili v1 « série ». Changements :
- Le bouton devient « Présentation vidéo · N s » (et le titre du lecteur « Présentation vidéo · Projet ») pour ne pas confondre les films avec les démos interactives.
- Films ajoutés : `assets/videos/hbntory.mp4` (Zaiko, 37 s, 2,55 Mo) et `maili.mp4` (37 s, 2,88 Mo), avec leurs miniatures WebP. PeerCheck reste sans film.
- Pennyworth : lien `demo` vers `https://pennyworth.adamzou.fr` (hébergé sur Render, plan gratuit : premier chargement lent après une mise en veille). Hbntory n’a pas de version publique ; Maili reste sans lien à la demande d’Adam.

Contrôles : tests 7/7 ; local à 1440, 390 et 320 px (à 320 px le bouton passe sous « Voir le POC », sans débordement). Installation `/var/www/pocs-releases/20261024-165707/`, sauvegarde `/var/backups/adamzou/20261024-165707/`, précédente racine `20261024-163654`. Public : 49/50 empreintes identiques (Contact : Cloudflare), nouveaux MP4 en `206` sur requête `Range` ; les quatre lecteurs, les liens des cinq dossiers et les titres cliquables (Pennyworth, Lockin, PeerCheck) vérifiés dans le navigateur public, sans erreur console.

## Démos vidéo et textes PeerCheck, 24 octobre

Publication autorisée explicitement par Adam. Changements :
- Bouton « Démo vidéo · N s » à côté de « Voir le POC » pour Pennyworth (34 s) et Lockin (36 s), champ `video` des fiches. Le lecteur s’ouvre dans un `<dialog>` au style du dossier ; la vidéo n’est créée qu’au clic et retirée à la fermeture, l’accueil ne charge donc rien de plus.
- Nouveaux fichiers : `assets/videos/pennyworth.mp4` (2,35 Mo), `lockin.mp4` (3,26 Mo) et leurs miniatures WebP. Le build publie tout le dossier `assets/videos/`.
- Textes PeerCheck alignés sur sa grille d’évaluation (commit `6b4e9d6`).

Contrôles : tests 7/7 ; local à 1440, 820, 390 et 320 px, Échap, croix, clic hors cadre, focus rendu au bouton, mouvements réduits sans lecture automatique. Installation `/var/www/pocs-releases/20261024-163654/`, sauvegarde `/var/backups/adamzou/20261024-163654/`, précédente racine `20261022-162330`, `nginx -t` réussi, page servie au deuxième contrôle. Public : 45/46 empreintes identiques au build (Contact : protection email de Cloudflare). Les MP4 sont servis en `video/mp4` et répondent `206` aux requêtes `Range`, ce qui permet d’avancer dans le film (Safari l’exige). Lecture, saut à 20 s et fermeture vérifiés dans le navigateur public, sans erreur console.

## Allègement des pages, 22 octobre (soir)

Publication autorisée par Adam (lot B de l’audit), sans changement de rendu voulu :
- Fond Traversée : `traversee-background-v2.png` (2,5 Mo) remplacé par `traversee-background-v2.webp` (293 Ko, `cwebp -q 90 -m 6 -sharp_yuv`), écart moyen 1,6/255 sur l’image.
- Polices : `inter.ttf` (856 Ko) et `dm-sans.ttf` (235 Ko) remplacées par `inter.woff2` (201 Ko) et `dm-sans.woff2` (83 Ko). Sous-ensemble latin étendu (`U+0000-024F`, ponctuation, monnaies, flèches, etc.), axes variables, GSUB et GPOS conservés ; les 112 caractères du site restent couverts. Un nouveau texte dans un alphabet non latin demanderait de refaire le sous-ensemble depuis la police d’origine (historique Git).
- Aperçu du CV : PNG (368 Ko) remplacé par un WebP sans perte (103 Ko), identique au pixel.
- Non modifié : `background.webp` de l’intro, déjà compressé ; le recompresser dégradait l’image pour un gain faible.
- Les originaux restent dans l’historique Git (commit `b269dc6`).
- Poids transféré sans cache, mesuré en ligne : accueil 5,3 Mo → 2,3 Mo (dont l’intro, 1,5 Mo), À propos 3,5 Mo → 0,5 Mo, Contact 3,8 Mo → 0,6 Mo.
- Installation `/var/www/pocs-releases/20261022-162330/`, sauvegarde `/var/backups/adamzou/20261022-162330/`, précédente racine `20261022-161157`. 41/42 empreintes publiques identiques au build (Contact : protection email de Cloudflare). Nginx sert les `.woff2` en `application/octet-stream` : les navigateurs les chargent quand même (Inter chargée, vérifié).

Contrôle du rendu : captures en mouvements réduits de l’accueil, du dossier, d’À propos et de Contact à 1440 et 390 px, comparées à la version en ligne précédente : écart moyen inférieur à 1/255, aucun écart notable hors pied de page modifié par le build, métriques verticales des polices identiques.

## Retours de la classe et audit front, 22 octobre (après-midi)

Publication autorisée par Adam. Changements :
- La barre de navigation reste fixe au défilement sur l’accueil, À propos et Contact ; son fond n’apparaît qu’une fois la page défilée (`--header-height` règle aussi l’arrivée des ancres sous la barre).
- Le grand titre d’un projet ouvre sa démo (`kind: 'demo'` dans `links`) : Lockin et PeerCheck. Pennyworth et Hbntory, sans démo, gardent un titre simple.
- Corrections issues d’un audit par deux agents (mobile, bureau et accessibilité) : « Découvrir » ne ramène plus à Pennyworth (`popstate`) ; champ de démo à 16 px sur mobile pour éviter le zoom d’iOS ; petits libellés portés à 11 ou 12 px ; contrastes des étapes, du texte d’exemple et des onglets inactifs relevés ; zones tactiles de 44 px sans changer le rendu ; barre et croix du dossier fixes au défilement ; lien d’évitement masqué pendant l’intro ; après « Passer », la tabulation repart du logo ; nom accessible du logo aligné sur « adam. ».
- Non traités, à arbitrer : poids des images et de la police (3,5 à 5 Mo par page), barre des projets sous la ligne de flottaison à 1920 × 1080, durée de l’intro rejouée à chaque arrivée.

Contrôles : tests 6/6 ; local puis public à 320, 390, 820, 1280 et 1440 px, sans erreur console ni débordement. Installation `/var/www/pocs-releases/20261022-161157/`, sauvegarde `/var/backups/adamzou/20261022-161157/`, précédente racine `20261022-123626`. Public : 41/42 empreintes identiques au build (Contact modifié par la protection email de Cloudflare), redirections actives. Le texte d’exemple du champ, plus grand, peut être coupé dans la carte sur certains projets (Maili).

## Liens des projets, 22 octobre

Publication autorisée par Adam. Le champ `links` des fiches remplace `link` : un dossier peut afficher plusieurs liens publics (démo et code), qui prennent la place de la ligne des technologies. Pennyworth : code ; Lockin : démo simulée et code ; PeerCheck : démo ; Hbntory : code ; Maili : aucun lien, dépôt privé. `pennyworth.adamzou.fr` ne répondait pas, d’où l’absence de démo pour Pennyworth.

Contrôles locaux : tests Traversée et Atelier réussis (6/6), cinq dossiers ouverts dans le navigateur à 1440 px et sur mobile, liens et nouvel onglet vérifiés, aucune erreur console. Par rapport à `20261019-141855`, seuls `js/traversee.js`, `js/traversee-projects.js` et `css/traversee.css` changent, plus le paramètre de version des trois pages. Le CSS et les scripts sont servis en `no-store` (`cf-cache-status: BYPASS`) : aucun paramètre de cache à changer.

Installation par `deploy-production-remote.py` : racine `/var/www/pocs-releases/20261022-123626/`, sauvegarde `/var/backups/adamzou/20261022-123626/`, précédente racine `20261019-141855`, `nginx -t` réussi, nouvelle page servie au deuxième contrôle.

Contrôle public : accueil, `www`, À propos, Contact et PDF en 200, redirections `/traversee.html` et `/pocs/` actives ; 41 fichiers sur 42 identiques au build, Contact modifié seulement par la protection des adresses email de Cloudflare. Les cinq dossiers affichent les bons liens dans le navigateur public, sans erreur console.

## CV d’octobre et lien LinkedIn, 19 octobre

Publication autorisée par Adam. Changements :
- Le PDF est remplacé par le CV d’octobre, SHA-256 `0309968f5ec14d47a52d0a4a42274c7fafeccbbee7f806f1aafd1191fb86db1b`, 69 596 octets. Il est généré par `Documents/ChatGPT/alternance/sources/build_cv_octobre.py`.
- L’aperçu PNG est régénéré en 1200 × 1698.
- Sur Contact : date « 19 octobre 2026 », poids « 70 Ko », LinkedIn `https://www.linkedin.com/in/adamzouaoui/` à la place de `/in/adam-zouaoui-7392a53b2/`. Le même lien est corrigé dans trois pages POC locales non publiées.

Cloudflare garde le PDF en cache 4 h (`max-age=14400`, `cf-cache-status: HIT` constaté). Les liens de Contact vers le PDF et le PNG portent donc `?v=20261019`, ce qui change la clé de cache. **À chaque nouveau CV, changer ce paramètre.** L’adresse sans paramètre peut servir l’ancien PDF jusqu’à expiration du cache, sauf purge dans Cloudflare.

Contrôles locaux du build servi depuis une copie (le serveur Python lancé sur `tmp/` dans Documents ne répondait pas) :
- seuls `index.html`, `about.html`, `contact.html`, le PDF et le PNG diffèrent de la version précédente ; les deux premiers ne changent que par le paramètre de version ;
- Contact vérifié sur ordinateur et à 375 px, sans défilement horizontal.

Installation par `deploy-production-remote.py`, sans alias SSH (port et clé de la note VPS du vault) :
- racine `/var/www/pocs-releases/20261019-141855/` ;
- sauvegarde `/var/backups/adamzou/20261019-141855/`, précédente racine `20261005-072626` ;
- `nginx -t` réussi et nouvelle page servie au deuxième contrôle.

Contrôle public :
- accueil, À propos et Contact répondent en 200, et les redirections `/traversee.html` et `/pocs/` restent actives ;
- PDF versionné identique (`cf-cache-status: MISS`, `inline`), PNG identique ;
- LinkedIn correct dans le navigateur, sans erreur console.

## Intro à chaque arrivée, 5 octobre

La classe `intro-running` est activée sans consulter `sessionStorage` dans le head de Traversée. Les retours via le cache de navigation sont pris en charge par `pageshow.persisted`. Les anciens callbacks de fondu et de focus sont annulés à la sortie et avant une nouvelle lecture, et le préchargement utilise un jeton d’annulation. La maquette Atelier conserve sa règle historique d’une lecture par session.

Contrôles locaux : deux actualisations successives, retour historique depuis À propos, bouton Passer, changement de projet sans relance, version réduite puis retour depuis Contact. Révélation terminée et absence d’erreur console confirmées. L’accueil et `js/intro.js` publics ont des empreintes identiques au build. Version installée dans `/var/www/pocs-releases/20261005-072626/`, sauvegarde de la précédente dans `/var/backups/adamzou/20261005-072626/`. Test Nginx réussi et nouvelle version confirmée au deuxième contrôle après reload gracieux.

## Contrôles de la première version publiée

- Racine de cette première version : `/var/www/pocs-releases/20261004-145013/`. Le deuxième contrôle HTTP après le rechargement Nginx a confirmé cette version. Les racines suivantes sont identifiées par leur propre dossier daté.
- `https://adamzou.fr/` et `https://www.adamzou.fr/` répondent correctement. L’empreinte de l’accueil public correspond exactement au build.
- Les 42 ressources publiées ont été contrôlées : 41 empreintes sont identiques. Contact est transformé par la protection des adresses email de Cloudflare ; le différentiel a été inspecté, et l’adresse ainsi que le lien `mailto:` sont correctement restaurés dans le navigateur.
- L’intro et sa révélation, les cinq onglets, le dossier Hbntory, les liens versionnés vers les pages communes, le RNCP 5 actuel et le RNCP 6 visé ont été contrôlés dans le navigateur public. Aucune erreur console relevée sur Contact.
- Le clic public sur le CV a téléchargé un PDF de 69 060 octets, identique à la source : SHA-256 `50fdb2348a2170d21c7d8211bfd147f39e7ca569402c9df2dc38dfc2d16de728`. Le navigateur a ajouté `(1)` au fichier local parce que le même nom existait déjà ; le nom demandé par le site reste `CV_ADAM_ZOUAOUI.pdf`.

## Ajustement de la navigation et de l’intro

Adam a demandé de retirer « Rejouer l’intro » et « Intro au ralenti » de Traversée, puis d’ajouter À propos et Contact en haut à droite, à côté du logo placé à gauche. Les deux commandes ont été supprimées du pied de page ; `intro.js` accepte l’absence du bouton de relance sans bloquer le lancement automatique, la révélation ou « Passer ». Le rendu local de cette navigation a été contrôlé à 320 px.

Les paramètres `?intro=1` et `duree` restent utilisables pour les contrôles internes, sans lien ou bouton dédié dans l’interface publique. La version ayant publié l’ensemble de ces ajustements est `/var/www/pocs-releases/20261004-150030/`. L’accueil, `js/intro.js` et `css/traversee.css` reçus en HTTPS avaient des empreintes identiques au build. La capture du navigateur public confirmait les deux liens en haut à droite et l’absence des commandes d’intro dans le pied de page ; aucune erreur console n’avait été relevée.

## Sources et périmètre public

Les sources sont dans `claude-preview/`. Modifier `traversee.html`, `about.html`, `contact.html` et leurs CSS/JS directement. Ajouter les projets dans `js/traversee-projects.js` en suivant [le workflow dédié](ajouter-un-projet.md). Lors d’un changement de CV, remplacer le PDF et son aperçu ensemble (rendu PNG de la page à 1200 px, converti sans perte avec `cwebp -lossless -z 9 aperçu.png -o assets/documents/CV_ADAM_ZOUAOUI.webp`), actualiser les métadonnées de Contact et changer le paramètre `?v=` de leurs liens, pour contourner le cache Cloudflare de 4 h.

Depuis la racine du dépôt, `scripts/build-production.py` prépare une nouvelle version datée en UTC dans `tmp/deploy/<version>/`. Il ne modifie pas les maquettes sources.

- `site/` contient les fichiers publics : 42 fichiers dans la version préparée le 4 octobre.
- `site.tar.gz` contient uniquement ces fichiers.
- `manifest.json` contient leurs empreintes SHA-256 et reste hors du dossier public.
- La sortie JSON donne l’identifiant de version et l’empreinte de l’archive.

Le build publie Traversée sous `index.html`, normalise les liens vers `/`, `/about.html` et `/contact.html`, retire le lien Atelier et son script des pages communes, ajoute les URL canoniques, `robots.txt` et `sitemap.xml`. Un paramètre `v=<version>` sur les liens internes vers les pages évite le cache de l’ancien HTML ; il n’est pas ajouté aux URL canoniques.

Les images de l’intro, le fond Traversée v2, les polices, icônes et licences, les scripts nécessaires, ainsi que `CV_ADAM_ZOUAOUI.pdf` et son aperçu WebP sont inclus. Atelier, les anciens dossiers POC, `docs/`, `tests/`, `outils/`, le README et les fichiers de travail restent locaux. **Ne pas lancer `claude-preview/outils/build_site.py` : ce générateur historique écraserait les pages actuelles. Ne pas publier tout le dépôt.**

## Hébergement et sauvegardes

Le serveur Nginx utilise `/etc/nginx/sites-enabled/hub`, fichier normal qui sert `adamzou.fr` et `www.adamzou.fr`. Le HTTP local est servi directement sur le port 80 ; le HTTPS public est terminé chez Cloudflare. L’include `lockin.conf` doit rester intact. La publication ne modifie ni DNS, ni les autres services du VPS.

Chaque version est installée dans `/var/www/pocs-releases/<version>/`. L’ancienne racine `/var/www/pocs` est conservée, de même que les racines des versions suivantes. Le script sauvegarde la racine en service et la configuration avant chaque bascule, hors de la racine web :

```text
/var/backups/adamzou/<version>/
  ancien-portfolio.tar.gz
  nginx-hub.conf
  deployment.json         # écrit après succès
```

La sauvegarde de l’ancien portfolio d’origine est :

```text
/var/backups/adamzou/20261004-144529/ancien-portfolio.tar.gz
/var/backups/adamzou/20261004-144529/nginx-hub.conf
```

Les accès SSH sont définis dans la configuration et les notes de référence du vault. Ne pas recopier de clé, mot de passe ou autre secret dans ce document, le dépôt ou l’archive de publication.

## Préparer une mise à jour

Depuis la racine du dépôt :

```sh
python3 scripts/build-production.py
```

Conserver l’identifiant et le SHA-256 affichés. Inspecter les trois HTML produits, les liens, le nom de téléchargement du CV et le contenu du manifeste. Pour vérifier le résultat exact avant publication, servir le dossier `site/` de cette version avec un serveur local et examiner : intro forcée par `?intro=1`, cinq projets et dossiers, retours vers l’accueil, navigation À propos / Contact en haut à droite, PDF, affichage mobile et mouvements réduits. Vérifier aussi l’absence des commandes de relance et de ralenti dans le pied de page. Les tests pertinents au changement peuvent être lancés depuis `claude-preview/` ; aucun test Atelier n’est nécessaire pour une simple modification de texte sur Traversée.

## Transférer et activer

La séquence suivante est à utiliser uniquement pour une publication autorisée. Renseigner `RELEASE` avec l’identifiant effectivement créé et `ADAMZOU_SSH_TARGET` avec la destination SSH existante du vault, disposant des droits root attendus par le script. Les valeurs ci-dessous sont des exemples à remplacer, pas des identifiants d’accès.

```sh
RELEASE='YYYYMMDD-HHMMSS'
ADAMZOU_SSH_TARGET='alias-ssh-du-vault'
DEPLOY_DIR="tmp/deploy/$RELEASE"
ARCHIVE_SHA=$(shasum -a 256 "$DEPLOY_DIR/site.tar.gz" | cut -d ' ' -f 1)
CONFIG_SHA=$(ssh "$ADAMZOU_SSH_TARGET" 'sha256sum /etc/nginx/sites-enabled/hub' | cut -d ' ' -f 1)
scp "$DEPLOY_DIR/site.tar.gz" "$ADAMZOU_SSH_TARGET:/tmp/adamzou-$RELEASE.tar.gz"
ssh "$ADAMZOU_SSH_TARGET" python3 - "$RELEASE" "$ARCHIVE_SHA" "$CONFIG_SHA" < scripts/deploy-production-remote.py
```

Le script vérifie les empreintes de l’archive et de la configuration, crée les sauvegardes, extrait uniquement les fichiers dans la nouvelle racine, puis remplace atomiquement la configuration. Il conserve les autres directives du vhost et l’include Lockin. Les redirections des anciennes adresses sont ajoutées lors de la première bascule, sans les dupliquer aux suivantes.

Après `nginx -t` et le rechargement gracieux, le script compare la réponse HTTP locale à l’`index.html` installé, jusqu’à 12 contrôles espacés de 0,4 seconde. L’échec du test Nginx, du rechargement ou du contrôle déclenche la restauration de la configuration précédente, suivie d’un test et d’un rechargement. Les fichiers des versions restent disponibles.

Le premier essai avait contrôlé la réponse avant que les nouveaux workers Nginx ne prennent le relais : il a correctement effectué un retour arrière. Cette attente a été corrigée ; la tentative suivante a réussi. Ne pas supprimer la boucle de vérification sous prétexte que `reload` a déjà rendu la main.

La sortie JSON et `deployment.json` consignent la nouvelle racine, la précédente, les empreintes et le nombre de contrôles nécessaires. Un succès local ne remplace pas le contrôle public : ouvrir `https://adamzou.fr/?intro=1&v=<version>`, puis À propos, Contact, le PDF et les redirections, et vérifier les erreurs réseau ou JavaScript. Les liens versionnés permettent d’éviter les anciennes pages conservées dans un navigateur ; ne pas confondre cet ancien cache avec un échec du serveur.

## Revenir à la version précédente

Sur le VPS en root, sélectionner le dossier de sauvegarde de la bascule à annuler. Son `nginx-hub.conf` pointe déjà vers la racine précédemment en service, laissée intacte. Pour restaurer le portfolio d’origine, sélectionner `20261004-144529`. Pour annuler une mise à jour ultérieure, sélectionner sa propre sauvegarde, et vérifier la directive `root` avant l’action.

```sh
set -e
BACKUP_VERSION='YYYYMMDD-HHMMSS'
BACKUP_DIR="/var/backups/adamzou/$BACKUP_VERSION"
test -f "$BACKUP_DIR/nginx-hub.conf"
cp -p /etc/nginx/sites-enabled/hub "$BACKUP_DIR/nginx-hub-avant-retour.conf"
cp -p "$BACKUP_DIR/nginx-hub.conf" /etc/nginx/.adamzou-hub-rollback
mv /etc/nginx/.adamzou-hub-rollback /etc/nginx/sites-enabled/hub
nginx -t && systemctl reload nginx
```

La copie temporaire est placée hors de `sites-enabled`, puis déplacée atomiquement vers `hub`. Après succès, contrôler la réponse du vhost local et le site public. Si `nginx -t` échoue, ne pas recharger : la configuration en mémoire continue de servir, et la copie `nginx-hub-avant-retour.conf` permet de rétablir le fichier antérieur au retour arrière. L’extraction de l’archive n’est normalement pas nécessaire puisque les racines sont conservées ; ne pas supprimer une ancienne racine ou sauvegarde pendant une publication.
