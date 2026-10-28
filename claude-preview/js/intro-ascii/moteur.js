// Pont entre l'intro (js/intro.js) et le moteur des mains en caractères (rig.js, ascii.js, gl.js). L'intro
// garde son cadrage, son minutage, sa pose d'approche et sa lumière ; le moteur anime les mains articulées
// et choisit à chaque image le caractère de chaque case. Si quelque chose manque (WebGL, temps de
// préparation, vitesse de l'appareil), creer() renvoie null et l'intro garde ses images.
(function () {
  const NS = window.IntroAscii;
  if (!NS || !NS.RenduGL || !NS.MainPreparee || !NS.MainArticulee) return;

  const PREPARATION_MAX = 1500; // ms : au-delà, l'appareil est trop lent, on garde les images
  const IMAGE_MAX = 28; // ms par image au test de vitesse

  class MoteurMains {
    constructor(rendu) {
      this.rendu = rendu;
      this.proche = 0;
      this.dernier = 0;
      this.taille = '';
      this.reinitialiser();
    }

    // Mains posées à l'avancée e, articulations déjà en place : la première image montre les index repliés
    // du départ (et non la pose finale de l'image d'origine, doigts tendus), puis l'approche les déplie.
    reinitialiser(e = 0) {
      this.mains = { robot: new NS.MainArticulee('robot'), human: new NS.MainArticulee('humain') };
      for (let k = 0; k < 90; k++) for (const key of ['robot', 'human']) this.mains[key].animer(e, 0, 1 / 60);
      this.proche = 0;
      this.dernier = 0;
    }

    // vue : cadrage de l'intro { vw, vh, dpr, s }. Cases d'environ vw / 290, entre 4 et 6 px.
    redimensionner(vue) {
      const cw = Math.min(6, Math.max(4, Math.round(vue.vw / 290)));
      const taille = [vue.vw, vue.vh, vue.dpr, cw, vue.s].join(':');
      if (taille === this.taille) return;
      this.taille = taille;
      this.rendu.redimensionner(vue.vw, vue.vh, vue.dpr, cw, vue.s);
    }

    // e : avancée de l'approche (0 à 1) ; matrices : { robot, human }, source vers écran, pose comprise.
    // dt : secondes écoulées (mesurées si absent). Renvoie les bouts des index à l'écran.
    dessiner(e, matrices, dt) {
      if (dt === undefined) {
        const maintenant = performance.now();
        dt = this.dernier ? Math.min(0.05, (maintenant - this.dernier) / 1000) : 0;
        this.dernier = maintenant;
      }
      const aDessiner = {}, bouts = {};
      for (const key of ['robot', 'human']) {
        const main = this.mains[key];
        main.animer(e, this.proche, dt);
        const T = main.transformations();
        bouts[key] = NS.Affine.appliquer(matrices[key], main.bout(T));
        aDessiner[key] = { os: main.rig.pieces.map((p) => T.get(p.nom)), pose: matrices[key] };
      }
      this.rendu.dessiner(aDessiner, 'ascii');
      return bouts;
    }

    // Mouvement réduit : les articulations se placent en coulisse, puis une seule image.
    figer(matrices) {
      this.reinitialiser(1);
      return this.dessiner(1, matrices, 1 / 60);
    }

    liberer() {
      this.rendu.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }

  // canvas : où dessiner ; images : { robot, human } (balises décodées) ; cadres : géométrie des calques
  // dans l'image source ; vue : cadrage ; matricesDepart : pose de départ, pour le test de vitesse.
  async function creer({ canvas, images, cadres, vue, matricesDepart }) {
    const debut = performance.now();
    let rendu;
    try {
      rendu = new NS.RenduGL(canvas);
    } catch (e) {
      return null;
    }
    // Pixels décodés une fois pour toutes : WebKit peut sinon redécoder l'image à chaque lecture.
    const [robot, human] = await Promise.all([images.robot, images.human].map((img) => createImageBitmap(img).catch(() => img)));
    const moteur = new MoteurMains(rendu);
    rendu.preparerMain('robot', new NS.MainPreparee(moteur.mains.robot, robot, cadres.robot), moteur.mains.robot);
    rendu.preparerMain('human', new NS.MainPreparee(moteur.mains.human, human, cadres.human), moteur.mains.human);
    moteur.redimensionner(vue);
    if (performance.now() - debut > PREPARATION_MAX) return abandon(moteur);

    // Test de vitesse : une image de chauffe, puis trois images attendues jusqu'au bout (lecture d'un pixel).
    const gl = rendu.gl, pixel = new Uint8Array(4);
    const image = () => {
      moteur.dessiner(0, matricesDepart, 1 / 60);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    };
    image();
    const t0 = performance.now();
    for (let k = 0; k < 3; k++) image();
    const parImage = (performance.now() - t0) / 3;
    moteur.reinitialiser();
    moteur.vitesse = parImage;
    return parImage <= IMAGE_MAX ? moteur : abandon(moteur);
  }

  function abandon(moteur) {
    moteur.liberer();
    return null;
  }

  NS.creer = creer;
})();
