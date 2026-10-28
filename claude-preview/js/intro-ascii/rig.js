// Repris du prototype ~/mains-ascii (version validée par Adam le 28/10/2026), sous l'espace de noms IntroAscii.
// Squelette articulé des deux mains. Chaque main est découpée en pièces : l'avant-bras, la paume, et les
// phalanges, chacune avec son pivot placé sur l'articulation visible de l'image d'origine (coordonnées de
// l'image source 1536 × 1024, relevées à la loupe sur une grille de 10 px). Une pièce tourne autour de son
// pivot et emporte ses enfants. Les masques disent quels pixels de l'image appartiennent à quelle pièce :
// la première pièce de la liste dont le masque contient le pixel l'emporte ; le reste va à l'avant-bras.
(function () {
  const borner = (x, a, b) => (x < a ? a : x > b ? b : x);

  // Masques : capsule [a, b, rayon], ou demi-plan { point, dir } (le côté vers lequel pointe dir).
  const capsule = (a, b, r) => ({ type: 'capsule', a, b, r });

  const RIGS = {
    robot: {
      flexion: 1, // une rotation positive replie un doigt vers le bas (main tendue vers la droite)
      pieces: [
        // Bouts des doigts d'abord : ils l'emportent sur les phalanges qu'ils recouvrent.
        { nom: 'index_3', parent: 'index_2', pivot: [645, 516], masque: capsule([645, 516], [716, 524], 20), doigt: 'index' },
        { nom: 'majeur_2', parent: 'majeur_1', pivot: [636, 600], masque: capsule([636, 600], [678, 656], 18), doigt: 'majeur' },
        { nom: 'annulaire_2', parent: 'annulaire_1', pivot: [588, 618], masque: capsule([588, 618], [598, 706], 21), doigt: 'annulaire' },
        { nom: 'auriculaire', parent: 'paume', pivot: [528, 582], masque: capsule([530, 585], [540, 660], 22), doigt: 'auriculaire' },
        { nom: 'pouce_2', parent: 'pouce_1', pivot: [470, 716], masque: capsule([470, 716], [568, 720], 24), doigt: 'pouce' },
        { nom: 'index_2', parent: 'index_1', pivot: [555, 520], masque: capsule([555, 520], [645, 516], 25), doigt: 'index' },
        { nom: 'index_1', parent: 'paume', pivot: [497, 535], masque: capsule([497, 535], [555, 520], 26), doigt: 'index' },
        { nom: 'majeur_1', parent: 'paume', pivot: [563, 553], masque: capsule([563, 553], [636, 600], 19), doigt: 'majeur' },
        { nom: 'annulaire_1', parent: 'paume', pivot: [563, 575], masque: capsule([563, 575], [588, 618], 20), doigt: 'annulaire' },
        { nom: 'pouce_1', parent: 'paume', pivot: [392, 712], masque: capsule([392, 712], [470, 716], 25), doigt: 'pouce' },
        // La paume : tout ce qui est au-delà du poignet.
        { nom: 'paume', parent: 'bras', pivot: [240, 650], masque: { type: 'demi-plan', point: [238, 650], dir: [0.97, -0.25] } },
        { nom: 'bras', parent: null, pivot: [0, 690] },
      ],
      bout: { piece: 'index_3', point: [716, 524] },
      // Le bord supérieur de l'index descend d'environ 8 px entre la jointure (x 575) et la phalange du bout
      // (x 640) : on comble ce creux (coordonnées source), avec la teinte du métal voisin à peine éclaircie.
      lissageHaut: { de: 560, a: 670, fenetre: 30, eclaircir: 0.25 },
      // Sous le poignet pendent des fils fins et deux bouts de câble détachés (x 0 à 200, y 690 à 820) : ils
      // donnaient des caractères isolés sous la main. On les efface (coordonnées source).
      nettoyageBas: { de: 0, a: 280, sous: 680 },
      // Ordre de dessin des pièces, du fond vers le devant.
      ordre: ['bras', 'paume', 'auriculaire', 'annulaire_1', 'annulaire_2', 'majeur_1', 'majeur_2', 'index_1', 'index_2', 'index_3', 'pouce_1', 'pouce_2'],
    },
    humain: {
      flexion: -1, // main tendue vers la gauche : replier vers le bas, c'est tourner dans l'autre sens
      pieces: [
        { nom: 'index_3', parent: 'index_2', pivot: [838, 521], masque: capsule([838, 521], [766, 527], 16), doigt: 'index' },
        { nom: 'pouce_2', parent: 'pouce_1', pivot: [912, 602], masque: capsule([912, 602], [873, 666], 21), doigt: 'pouce' },
        { nom: 'majeur_2', parent: 'doigts_bas', pivot: [966, 616], masque: capsule([966, 618], [965, 690], 22), doigt: 'majeur' },
        { nom: 'annulaire_2', parent: 'doigts_bas', pivot: [1036, 614], masque: capsule([1036, 616], [1034, 684], 19), doigt: 'annulaire' },
        { nom: 'index_2', parent: 'index_1', pivot: [915, 515], masque: capsule([915, 515], [838, 521], 18), doigt: 'index' },
        { nom: 'index_1', parent: 'paume', pivot: [1045, 522], masque: capsule([1045, 522], [915, 515], 19), doigt: 'index' },
        { nom: 'pouce_1', parent: 'paume', pivot: [985, 556], masque: capsule([985, 558], [912, 602], 22), doigt: 'pouce' },
        // Majeur et annulaire partent ensemble à l'horizontale avant de tomber.
        { nom: 'doigts_bas', parent: 'paume', pivot: [1110, 598], masque: capsule([1110, 598], [962, 612], 19), doigt: 'bas' },
        { nom: 'paume', parent: 'bras', pivot: [1255, 570], masque: { type: 'demi-plan', point: [1258, 572], dir: [-0.92, -0.39] } },
        { nom: 'bras', parent: null, pivot: [1536, 690] },
      ],
      bout: { piece: 'index_3', point: [766, 527] },
      ordre: ['bras', 'paume', 'doigts_bas', 'annulaire_2', 'majeur_2', 'pouce_1', 'pouce_2', 'index_1', 'index_2', 'index_3'],
      // Le détourage de l'image descend d'environ 20 px sur le dos de la main, entre la jointure de l'index
      // et le poignet, puis encore d'environ 18 px au poignet (x 1300) avec une encoche vers x 1370 :
      // on lisse le bord supérieur de la jointure jusqu'au bord de l'image (coordonnées source).
      lissageHaut: { de: 1000, a: 1536, fenetre: 70 },
    },
  };

  // Matrices affines 2D au format du canevas : [a, b, c, d, e, f] pour x' = a x + c y + e, y' = b x + d y + f.
  const Affine = {
    identite: () => [1, 0, 0, 1, 0, 0],
    produit: (m, n) => [
      m[0] * n[0] + m[2] * n[1],
      m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3],
      m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4],
      m[1] * n[4] + m[3] * n[5] + m[5],
    ],
    rotationAutour: (p, a) => {
      const c = Math.cos(a), s = Math.sin(a);
      return [c, s, -s, c, p[0] - c * p[0] + s * p[1], p[1] - s * p[0] - c * p[1]];
    },
    appliquer: (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]],
  };

  // Dans quelle pièce tombe un point de l'image source ; null pour l'avant-bras. `marge` élargit les
  // capsules des doigts (en pixels source). Avec `proche`, un point qui n'est dans aucune capsule mais à
  // moins de `proche` pixels de l'une d'elles va au doigt le plus proche plutôt qu'à la paume : le bord
  // d'un doigt suit alors le doigt.
  function pieceDe(rig, x, y, marge = 0, proche = 0) {
    let meilleur = null, ecart = proche;
    for (const p of rig.pieces) {
      const m = p.masque;
      if (!m) continue;
      if (m.type === 'demi-plan') {
        if (meilleur) return meilleur;
        if ((x - m.point[0]) * m.dir[0] + (y - m.point[1]) * m.dir[1] > 0) return p;
        continue;
      }
      const dx = m.b[0] - m.a[0], dy = m.b[1] - m.a[1];
      const t = borner(((x - m.a[0]) * dx + (y - m.a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const d = Math.hypot(x - m.a[0] - dx * t, y - m.a[1] - dy * t) - m.r - marge;
      if (d <= 0) return p;
      if (d < ecart) {
        ecart = d;
        meilleur = p;
      }
    }
    return meilleur;
  }

  // Os d'un sommet du maillage, pour une pièce donnée : la pièce et son parent, avec le poids de la pièce.
  // Autour de l'articulation, le poids passe en douceur du parent à la pièce : la peau plie au lieu de se fendre.
  function poidsOs(rig, x, y, p) {
    const indice = (nom) => rig.pieces.findIndex((q) => q.nom === nom);
    const i = indice(p.nom);
    if (!p.parent) return [i, i, 1];
    const m = p.masque;
    let u, R;
    if (m.type === 'demi-plan') {
      u = (x - m.point[0]) * m.dir[0] + (y - m.point[1]) * m.dir[1];
      R = 26;
    } else {
      const dx = m.b[0] - m.a[0], dy = m.b[1] - m.a[1], l = Math.hypot(dx, dy) || 1;
      u = ((x - p.pivot[0]) * dx + (y - p.pivot[1]) * dy) / l;
      R = Math.max(7, 0.75 * m.r);
    }
    const t = borner((u + R) / (2 * R), 0, 1);
    return [i, indice(p.parent), t * t * (3 - 2 * t)];
  }

  class MainArticulee {
    constructor(cle) {
      this.cle = cle;
      this.robot = cle === 'robot';
      this.rig = RIGS[cle];
      this.parNom = new Map(this.rig.pieces.map((p) => [p.nom, p]));
      // Angle, vitesse et consigne de chaque pièce ; on les fait évoluer par ressort amorti.
      this.etat = new Map(this.rig.pieces.map((p) => [p.nom, { angle: 0, vitesse: 0 }]));
      this.reglages = new Map();
      this.prochainReglage = 2.5;
      this.temps = 0;
      // Ordre de calcul : les parents avant les enfants.
      this.ordre = [];
      const vus = new Set();
      const visiter = (p) => {
        if (vus.has(p.nom)) return;
        if (p.parent) visiter(this.parNom.get(p.parent));
        vus.add(p.nom);
        this.ordre.push(p);
      };
      for (const p of this.rig.pieces) visiter(p);
    }

    // Consigne de chaque pièce, en radians, avant le sens de flexion de la main.
    consigne(p, e, proche) {
      const t = this.temps, depart = 1 - e;
      const n = p.nom;
      const k = this.rig.pieces.indexOf(p);
      if (n === 'bras') return 0;
      if (n === 'paume') {
        // Le poignet accompagne l'approche, puis la main respire autour de lui.
        const respiration = this.robot ? 0.008 * Math.sin(0.9 * t) : 0.022 * Math.sin(0.5 * t + 1);
        return depart * 0.03 + respiration;
      }
      if (p.doigt === 'index') {
        // L'index part replié et se déplie pendant l'approche, de la base vers le bout.
        const rang = { index_1: 0, index_2: 1, index_3: 2 }[n];
        const deplie = Math.min(1, Math.max(0, (e - 0.12 * rang) / (1 - 0.12 * rang)));
        let v = (1 - deplie * deplie * (3 - 2 * deplie)) * [0.22, 0.17, 0.12][rang];
        if (this.robot) v += this.reglages.get(n)?.v || 0;
        else {
          // L'index humain se lève un peu en respirant, puis tremble juste avant le contact.
          v += (1 - proche) * 0.035 * Math.sin(0.8 * t + rang) * e;
          if (n === 'index_3') v += 0.03 * proche * Math.sin(t * 38);
        }
        return v;
      }
      if (this.robot && p.doigt === 'pouce') {
        // Le pouce du robot ne tombe jamais : il reste à sa place pendant l'approche, et son calibrage le
        // serre un peu vers la paume (rotation vers le haut), comme une pince qui vérifie sa prise.
        return this.reglages.get(n)?.v || 0;
      }
      const base = depart * 0.1;
      if (this.robot) return base + (this.reglages.get(n)?.v || 0);
      // La main humaine respire : une vague parcourt les doigts, du pouce vers l'auriculaire.
      const vague = Math.sin(1.05 * t - 0.9 * k);
      const ampleur = p.doigt === 'pouce' ? 0.04 : 0.07;
      return base + ampleur * vague + 0.025 * Math.sin(0.43 * t + 1.7 * k);
    }

    // e : avancée de l'approche (0 à 1) ; proche : proximité des index ; dt : secondes écoulées.
    animer(e, proche, dt) {
      this.temps += dt;
      if (this.robot) {
        // Le robot calibre ses doigts l'un après l'autre : un doigt se plie d'un geste net, puis revient.
        for (const [n, r] of this.reglages) if (this.temps > r.fin) this.reglages.delete(n);
        if (this.temps > this.prochainReglage) {
          const doigts = [['majeur_1', 'majeur_2'], ['annulaire_1', 'annulaire_2'], ['auriculaire'], ['pouce_1', 'pouce_2'], ['index_2', 'index_3']];
          const choix = doigts[Math.floor(Math.random() * doigts.length)];
          const pouce = choix[0].startsWith('pouce');
          // Le pouce se serre vers le haut (signe négatif), de peu ; les autres doigts se plient vers le bas.
          const ampleur = pouce ? -(0.05 + 0.02 * Math.random()) : choix[0].startsWith('index') ? 0.08 : 0.16 + 0.08 * Math.random();
          choix.forEach((n, j) => this.reglages.set(n, { v: ampleur * (j ? (pouce ? 0.6 : 0.8) : 1), fin: this.temps + (pouce ? 0.6 : 0.45) }));
          this.prochainReglage = this.temps + 0.9 + Math.random() * 1.3;
        }
      }
      const raideur = this.robot ? 150 : 36, amorti = this.robot ? 21 : 11;
      for (const p of this.rig.pieces) {
        const s = this.etat.get(p.nom);
        const cible = this.rig.flexion * this.consigne(p, e, proche);
        s.vitesse += (raideur * (cible - s.angle) - amorti * s.vitesse) * dt;
        s.angle += s.vitesse * dt;
      }
    }

    // Transformation de chaque pièce (de sa position dans l'image source à sa position animée, en source).
    transformations() {
      const T = new Map();
      for (const p of this.ordre) {
        const local = Affine.rotationAutour(p.pivot, this.etat.get(p.nom).angle);
        T.set(p.nom, p.parent ? Affine.produit(T.get(p.parent), local) : local);
      }
      return T;
    }

    bout(T) {
      return Affine.appliquer(T.get(this.rig.bout.piece), this.rig.bout.point);
    }
  }

  Object.assign((window.IntroAscii = window.IntroAscii || {}), { MainArticulee, Affine, pieceDe, poidsOs, RIGS_MAINS: RIGS });
})();
