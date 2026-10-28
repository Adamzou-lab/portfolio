// Repris du prototype ~/mains-ascii (version validée par Adam le 28/10/2026 : mosaïque, coloriage et squelette dessinés par lui), sous l'espace de noms IntroAscii.
// Préparation, faite une fois : l'image de chaque main (avec son bord supérieur lissé), son maillage
// articulé, et les tables de caractères. Les caractères eux-mêmes sont choisis à chaque image, dans la carte
// graphique (js/gl.js), à partir de la main en mouvement : comme pour les koïs, la grille reste fixe à
// l'écran et ce sont les caractères qui changent quand la main bouge.
(function () {
  const POLICE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  // Le robot en caractères de machine (traits, crochets, chiffres) ; l'humain en caractères ronds.
  // Les traits `| / \ - _` du contour sont ajoutés à part.
  const JEUX = {
    robot: ".,'`-_:;=+*!|/\\()[]<>{}1ilIjtrfLT7EFHKXN0B8#%",
    humain: ".,'`-_:;~=+*()cosaeuvnmrOQ0@",
  };
  const BORDS = '-|/\\_';
  // Échantillons par case dans la carte graphique : 4 colonnes × 6 rangées.
  const FX = 4, FY = 6;

  // L'image de la main, à sa taille d'origine, avec le creux du bord supérieur comblé et le dessous nettoyé.
  function imageMain(img, cadre, rig) {
    const c = document.createElement('canvas');
    c.width = cadre.w;
    c.height = cadre.h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cadre.w, cadre.h);
    if (!rig.lissageHaut && !rig.nettoyageBas) return c;
    const W = cadre.w, H = cadre.h;
    const im = ctx.getImageData(0, 0, W, H), d = im.data;
    for (const l of [].concat(rig.lissageHaut || [])) lisserHaut(d, W, H, cadre, l);
    if (rig.nettoyageBas) nettoyerBas(d, W, H, cadre, rig.nettoyageBas);
    ctx.putImageData(im, 0, 0);
    return c;
  }

  // Efface ce qui pend sous la main entre `z.de` et `z.a`, plus bas que `z.sous` (coordonnées source) : fils
  // fins et bouts de câble détachés. L'image est érodée (ce qui fait moins de treize pixels d'épaisseur disparaît), on
  // garde le plus grand morceau d'un seul tenant, la main, et on efface le reste de la zone, sauf à un pixel
  // près du bord de la main pour garder son bord fondu intact. Le calcul se limite à la zone et à une bande de
  // 40 px autour, où la main est d'un seul tenant : cinq fois moins de pixels (WebKit y passait 100 ms).
  function nettoyerBas(d, W, H, cadre, z) {
    const R = 6, MARGE = R + 1;
    const x0 = Math.max(0, z.de - cadre.x), x1 = Math.min(W - 1, z.a - cadre.x), y0 = Math.max(0, z.sous - cadre.y);
    const bx0 = Math.max(0, x0 - 40), by0 = Math.max(0, y0 - 40), L = Math.min(W - 1, x1 + 40) - bx0 + 1, B = H - by0;
    const plein = new Uint8Array(L * B);
    for (let y = 0; y < B; y++) for (let x = 0; x < L; x++) plein[y * L + x] = d[4 * ((y + by0) * W + x + bx0) + 3] > 25 ? 1 : 0;
    const coeur = etendre(plein, L, B, R, false);
    // Morceaux d'un seul tenant (voisins par les côtés et les coins) ; le plus grand est la main. Pile en
    // tableau typé : chaque pixel n'y entre qu'une fois.
    const morceau = new Int32Array(L * B).fill(-1), pile = new Int32Array(L * B);
    let main = -1, plusGrand = 0, haut = 0;
    for (let i = 0, n = 0; i < L * B; i++) {
      if (!coeur[i] || morceau[i] >= 0) continue;
      let taille = 0;
      morceau[i] = n;
      pile[haut++] = i;
      while (haut) {
        const p = pile[--haut], px = p % L, py = (p - px) / L;
        taille++;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const qx = px + dx, qy = py + dy;
            if (qx < 0 || qy < 0 || qx >= L || qy >= B) continue;
            const q = qy * L + qx;
            if (coeur[q] && morceau[q] < 0) {
              morceau[q] = n;
              pile[haut++] = q;
            }
          }
      }
      if (taille > plusGrand) (plusGrand = taille), (main = n);
      n++;
    }
    const garde = new Uint8Array(L * B);
    for (let i = 0; i < L * B; i++) garde[i] = morceau[i] === main ? 1 : 0;
    const autour = etendre(garde, L, B, MARGE, true);
    for (let y = y0; y < H; y++)
      for (let x = x0; x <= x1; x++) if (!autour[(y - by0) * L + x - bx0]) d[4 * (y * W + x) + 3] = 0;
  }

  // Dilatation (un pixel devient plein si un voisin l'est) ou érosion (il ne le reste que si tous ses voisins
  // le sont), sur un carré de côté 2r + 1, en deux passes : lignes puis colonnes. Chaque passe tient une somme
  // glissante sur la fenêtre (bornée aux bords) : même résultat qu'en relisant la fenêtre, sans en dépendre de r.
  function etendre(m, W, H, r, dilater) {
    const a = new Uint8Array(W * H), b = new Uint8Array(W * H);
    const passe = (src, dst, n, l, pas, ligne) => {
      for (let j = 0; j < n; j++) {
        const o = j * ligne;
        let somme = 0;
        for (let i = 0; i <= Math.min(l - 1, r); i++) somme += src[o + i * pas];
        for (let i = 0; i < l; i++) {
          const plein = dilater ? somme > 0 : somme === Math.min(l - 1, i + r) - Math.max(0, i - r) + 1;
          dst[o + i * pas] = plein ? 1 : 0;
          if (i + r + 1 < l) somme += src[o + (i + r + 1) * pas];
          if (i - r >= 0) somme -= src[o + (i - r) * pas];
        }
      }
    };
    passe(m, a, H, W, 1, W);
    passe(a, b, W, H, W, 1);
    return b;
  }

  // Comble les creux du bord supérieur entre `l.de` et `l.a` (x source). `l.eclaircir` (0 à 1) rapproche la
  // teinte de remplissage du blanc : 0,7 pour un reflet en pleine lumière, moins pour du métal.
  function lisserHaut(d, W, H, cadre, l) {
    // Bord supérieur de chaque colonne de la plage, puis son enveloppe convexe vue d'en haut : le dos de la
    // main et l'avant-bras sont bombés, donc tout creux ou toute marche sous cette enveloppe est un défaut du
    // détourage. L'enveloppe est ensuite adoucie (moyenne glissante) pour une courbe sans angle.
    const x0 = Math.max(0, l.de - cadre.x), x1 = Math.min(W - 1, l.a - cadre.x), f = l.fenetre;
    const haut = new Float32Array(W).fill(H);
    for (let x = x0; x <= x1; x++)
      for (let y = 0; y < H; y++)
        if (d[4 * (y * W + x) + 3] > 128) {
          haut[x] = y;
          break;
        }
    const enveloppe = [];
    const audessous = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <= 0;
    for (let x = x0; x <= x1; x++) {
      if (haut[x] >= H) continue;
      const p = [x, haut[x]];
      while (enveloppe.length >= 2 && audessous(enveloppe[enveloppe.length - 2], enveloppe[enveloppe.length - 1], p)) enveloppe.pop();
      enveloppe.push(p);
    }
    const ouvert = new Float32Array(W).fill(H);
    for (let k = 0; k < enveloppe.length - 1; k++) {
      const [xa, ya] = enveloppe[k], [xb, yb] = enveloppe[k + 1];
      for (let x = xa; x <= xb; x++) ouvert[x] = ya + ((yb - ya) * (x - xa)) / (xb - xa || 1);
    }
    const lisse = new Float32Array(W).fill(H), r = Math.round(f / 2);
    for (let x = x0; x <= x1; x++) {
      let somme = 0, n = 0;
      for (let k = Math.max(x0, x - r); k <= Math.min(x1, x + r); k++) {
        if (ouvert[k] >= H) continue;
        somme += ouvert[k];
        n++;
      }
      if (!n || haut[x] >= H) continue;
      // Aux deux bouts de la plage, le comblement s'efface en douceur : pas de marche.
      const bout = Math.min(x - x0, x1 - x) / 40, w = bout >= 1 ? 1 : bout * bout * (3 - 2 * bout);
      lisse[x] = haut[x] - (haut[x] - Math.min(haut[x], somme / n)) * w;
    }
    // Teinte de la peau juste sous le bord d'origine, moyennée sur quelques colonnes : pas de rayures.
    const teinte = new Float32Array(W * 3);
    for (let x = x0; x <= x1; x++) {
      let rr = 0, gg = 0, bb = 0, n = 0;
      for (let k = Math.max(x0, x - 10); k <= Math.min(x1, x + 10); k++)
        for (let y = haut[k] + 1; y < Math.min(H, haut[k] + 12); y++) {
          const q = 4 * (y * W + k);
          if (d[q + 3] < 200) continue;
          rr += d[q];
          gg += d[q + 1];
          bb += d[q + 2];
          n++;
        }
      if (n) teinte.set([rr / n, gg / n, bb / n], 3 * x);
    }
    for (let x = x0; x <= x1; x++) {
      const y1 = haut[x];
      if (y1 >= H) continue;
      const debut = lisse[x];
      for (let y = Math.max(0, Math.floor(debut)); y < y1; y++) {
        const k = 4 * (y * W + x);
        // Bord supérieur fondu sur trois pixels.
        const a = Math.min(1, (y + 1 - debut) / 3);
        // Teinte de la matière voisine, éclaircie selon le réglage (le dos de la main droite est un reflet).
        const e = l.eclaircir ?? 0.7;
        d[k] = (1 - e) * teinte[3 * x] + e * 240;
        d[k + 1] = (1 - e) * teinte[3 * x + 1] + e * 240;
        d[k + 2] = (1 - e) * teinte[3 * x + 2] + e * 238;
        d[k + 3] = Math.max(d[k + 3], 255 * a);
      }
    }
  }

  // Contraste propre à chaque main : ses tons clairs (10 %) et sombres (98,5 %).
  function contraste(canvas) {
    const W = canvas.width, H = canvas.height;
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const histo = new Uint32Array(100);
    let total = 0;
    for (let i = 0; i < W * H; i += 3)
      if (d[4 * i + 3] > 180) {
        const n = 1 - (0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]) / 255;
        histo[Math.min(99, Math.floor(n * 100))]++;
        total++;
      }
    let cumul = 0, bas = 0, haut = 1;
    for (let k = 0; k < 100; k++) {
      cumul += histo[k];
      if (cumul < 0.1 * total) bas = (k + 1) / 100;
      if (cumul < 0.985 * total) haut = (k + 1) / 100;
    }
    return [bas, Math.max(haut, bas + 0.1)];
  }

  // Étiquettes du coloriage (outils/doigts.html) : une couleur pleine par doigt, dans cet ordre (1 à 7).
  const DOIGTS_COLORIES = {
    '230,25,75': 'pouce', '60,180,75': 'index', '67,99,216': 'majeur', '245,130,49': 'annulaire',
    '145,30,180': 'auriculaire', '70,200,220': 'paume', '128,128,0': 'poignet',
  };
  const NOMS_ETIQUETTES = ['', 'pouce', 'index', 'majeur', 'annulaire', 'auriculaire', 'paume', 'poignet'];
  const etiquetteDe = (p) => p.etiquette || p.doigt;

  // Le doigt de chaque pixel de l'image (0 : aucun), d'après le coloriage. Les pixels de la main restés sans
  // couleur (reflets trop clairs, bord comblé) prennent le doigt peint le plus proche, de proche en proche.
  function lireEtiquettes(coloriage, image) {
    const W = image.width, H = image.height;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(coloriage, 0, 0, W, H);
    const col = x.getImageData(0, 0, W, H).data;
    const alpha = image.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const e = new Uint8Array(W * H), file = new Int32Array(W * H);
    let debut = 0, fin = 0;
    // Couleur (entier 0xRRGGBB) vers numéro de doigt : pas de texte par pixel, WebKit y passait 200 ms.
    const parCouleur = new Map(Object.entries(DOIGTS_COLORIES).map(([k, nom]) => {
      const [r, g, b2] = k.split(',').map(Number);
      return [(r << 16) | (g << 8) | b2, NOMS_ETIQUETTES.indexOf(nom)];
    }));
    for (let i = 0; i < W * H; i++) {
      if (col[4 * i + 3] < 128) continue;
      const k = parCouleur.get((col[4 * i] << 16) | (col[4 * i + 1] << 8) | col[4 * i + 2]);
      if (!k) continue;
      e[i] = k;
      file[fin++] = i;
    }
    const etendreA = (i, q) => {
      if (e[q] || alpha[4 * q + 3] <= 8) return;
      e[q] = e[i];
      file[fin++] = q;
    };
    while (debut < fin) {
      const i = file[debut++], px = i % W;
      if (px + 1 < W) etendreA(i, i + 1);
      if (px > 0) etendreA(i, i - 1);
      if (i + W < W * H) etendreA(i, i + W);
      if (i >= W) etendreA(i, i - W);
    }
    // Le doigt voisin le plus proche à moins de DEBORD pixels : chaque doigt déborde d'autant sous ses
    // voisins. Quand un doigt s'écarte de celui de derrière, le débord comble le vide que l'image ne montre pas
    // (elle ne contient rien sous un doigt).
    const DEBORD = 6, voisin = new Uint8Array(W * H);
    // Les doigts présents dans le carré de 13 × 13 pixels autour de chaque pixel, un bit par doigt : deux
    // passes de fenêtre glissante (un compte par doigt), puis seuls les pixels qui ont un autre doigt dans ce
    // carré cherchent leur voisin, du plus près au plus loin, et s'arrêtent au premier trouvé. Même résultat
    // qu'une recherche complète ; WebKit y passait plus d'une demi-seconde.
    const NB = NOMS_ETIQUETTES.length, compte = new Int32Array(NB);
    const glisser = (src, dst, n, l, pas, ligne) => {
      for (let j = 0; j < n; j++) {
        const o = j * ligne;
        compte.fill(0);
        let masque = 0;
        const ajouter = (v, s) => {
          if (!v) return;
          compte[v] += s;
          if (compte[v]) masque |= 1 << v;
          else masque &= ~(1 << v);
        };
        for (let k = 0; k <= Math.min(l - 1, DEBORD); k++) ajouter(src(o + k * pas), 1);
        for (let k = 0; k < l; k++) {
          dst[o + k * pas] = masque;
          if (k + DEBORD + 1 < l) ajouter(src(o + (k + DEBORD + 1) * pas), 1);
          if (k - DEBORD >= 0) ajouter(src(o + (k - DEBORD) * pas), -1);
        }
      }
    };
    // Première passe sur les numéros de doigt (un seul par pixel), seconde sur les masques des lignes.
    const lignes = new Uint8Array(W * H), autour = new Uint8Array(W * H);
    glisser((i) => e[i], lignes, H, W, 1, W);
    for (let x0 = 0; x0 < W; x0++) {
      let masque = 0;
      const somme = new Int32Array(NB);
      const ajouterM = (m, s) => {
        for (let v = 1; v < NB; v++) if (m & (1 << v)) {
          somme[v] += s;
          if (somme[v]) masque |= 1 << v;
          else masque &= ~(1 << v);
        }
      };
      for (let k = 0; k <= Math.min(H - 1, DEBORD); k++) ajouterM(lignes[k * W + x0], 1);
      for (let y = 0; y < H; y++) {
        autour[y * W + x0] = masque;
        if (y + DEBORD + 1 < H) ajouterM(lignes[(y + DEBORD + 1) * W + x0], 1);
        if (y - DEBORD >= 0) ajouterM(lignes[(y - DEBORD) * W + x0], -1);
      }
    }
    // Décalages du disque de rayon DEBORD, du plus près au plus loin (à distance égale, dans l'ordre de lecture).
    const decalages = [];
    for (let dy = -DEBORD; dy <= DEBORD; dy++)
      for (let dx = -DEBORD; dx <= DEBORD; dx++) if (dx * dx + dy * dy <= DEBORD * DEBORD) decalages.push([dx, dy, dx * dx + dy * dy]);
    decalages.sort((a, b) => a[2] - b[2]);
    for (let y = 0; y < H; y++)
      for (let x0 = 0; x0 < W; x0++) {
        const i = y * W + x0;
        if (!e[i] || !(autour[i] & ~(1 << e[i]))) continue;
        for (const [dx, dy] of decalages) {
          const qx = x0 + dx, qy = y + dy;
          if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
          const v = e[qy * W + qx];
          if (v && v !== e[i]) {
            voisin[i] = v;
            break;
          }
        }
      }
    // Texture pour la carte graphique : le doigt dans le rouge, le doigt voisin dans le vert.
    const im = x.createImageData(W, H);
    for (let i = 0; i < W * H; i++) (im.data[4 * i] = e[i]), (im.data[4 * i + 1] = voisin[i]), (im.data[4 * i + 3] = 255);
    x.putImageData(im, 0, 0);
    return { e, voisin, texture: c };
  }

  // Maillage dans l'image source : un carré tous les `pas` pixels là où la main se trouve. Sans coloriage,
  // chaque carré appartient à la pièce qui contient son centre. Avec le coloriage, un carré est émis une fois
  // pour chaque doigt présent sous lui, et la carte graphique n'en dessine que les pixels de ce doigt : un
  // carré à cheval sur deux doigts ne peut plus emporter un morceau du voisin. Les sommets suivent la pièce et
  // son parent (poids qui passe en douceur de l'un à l'autre autour de l'articulation). Triangles rangés du
  // fond vers le devant.
  function maillage(canvas, cadre, rig, pas = 8, etiquettes = null, voisins = null) {
    const W = canvas.width, H = canvas.height;
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const nx = Math.ceil(W / pas) + 1, ny = Math.ceil(H / pas) + 1;
    const plein = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[4 * (y * W + x) + 3] > 8;
    const bras = rig.pieces.find((q) => q.nom === 'bras');
    const sommets = [], uv = [], os = [], poids = [], etiq = [], deja = new Map();
    const parPiece = new Map(rig.ordre.map((n) => [n, []]));
    const sommet = (i, j, p) => {
      const cle = (j * nx + i) * 32 + rig.pieces.indexOf(p);
      if (deja.has(cle)) return deja.get(cle);
      const lx = i * pas, ly = j * pas, sx = cadre.x + lx, sy = cadre.y + ly;
      sommets.push(sx, sy);
      uv.push(lx / W, ly / H);
      const [b1, b2, w1] = window.IntroAscii.poidsOs(rig, sx, sy, p);
      os.push(b1, b2);
      poids.push(w1);
      etiq.push(etiquettes ? NOMS_ETIQUETTES.indexOf(etiquetteDe(p)) : 0);
      deja.set(cle, sommets.length / 2 - 1);
      return sommets.length / 2 - 1;
    };
    // Dans un même doigt, la phalange : la même règle que sans coloriage (la première de la liste dont la
    // capsule, élargie de 6 px, contient le centre du carré : le bout avant la phalange qu'il recouvre), sinon la
    // plus proche. La phalange enfant garde ainsi les carrés de part et d'autre de son articulation, et le pli
    // reste continu.
    const phalange = (nom, cx, cy) => {
      const choix = rig.pieces.filter((p) => etiquetteDe(p) === nom);
      if (choix.length <= 1) return choix[0];
      let mieux = choix[0], ecart = Infinity;
      for (const p of choix) {
        const m = p.masque;
        if (!m || m.type !== 'capsule') continue;
        const dx = m.b[0] - m.a[0], dy = m.b[1] - m.a[1];
        const t = Math.max(0, Math.min(1, ((cx - m.a[0]) * dx + (cy - m.a[1]) * dy) / (dx * dx + dy * dy || 1)));
        const dist = Math.hypot(cx - m.a[0] - dx * t, cy - m.a[1] - dy * t) - m.r - 6;
        if (dist <= 0) return p;
        if (dist < ecart) (ecart = dist), (mieux = p);
      }
      return mieux;
    };
    const emettre = (i, j, p) => {
      const a = sommet(i, j, p), b = sommet(i + 1, j, p), c = sommet(i, j + 1, p), e = sommet(i + 1, j + 1, p);
      (parPiece.get(p.nom) || parPiece.get('bras')).push(a, b, c, b, e, c);
    };
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let utile = false;
        // Les doigts présents sous le carré, un bit par doigt.
        let presents = 0;
        for (let y = j * pas - 2; y <= (j + 1) * pas + 2; y++)
          for (let x = i * pas - 2; x <= (i + 1) * pas + 2; x++) {
            if (!plein(x, y)) continue;
            utile = true;
            if (!etiquettes) break;
            presents |= (1 << etiquettes[y * W + x]) | (voisins ? 1 << voisins[y * W + x] : 0);
          }
        presents &= ~1; // le bit 0 : pas de doigt
        if (!utile) continue;
        const cx = cadre.x + (i + 0.5) * pas, cy = cadre.y + (j + 0.5) * pas;
        if (!etiquettes || !presents) {
          emettre(i, j, window.IntroAscii.pieceDe(rig, cx, cy, 6, 16) || bras);
          continue;
        }
        for (let k = 1; k < NOMS_ETIQUETTES.length; k++) if (presents & (1 << k)) emettre(i, j, phalange(NOMS_ETIQUETTES[k], cx, cy) || bras);
      }
    return {
      sommets: new Float32Array(sommets),
      uv: new Float32Array(uv),
      os: new Float32Array(os),
      poids: new Float32Array(poids),
      etiq: new Float32Array(etiq),
      triangles: new Uint16Array([...parPiece.values()].flat()),
    };
  }

  class MainPreparee {
    // coloriage : l'image du coloriage des doigts (facultatif).
    constructor(main, img, cadre, coloriage = null) {
      this.main = main;
      this.cadre = cadre;
      this.image = imageMain(img, cadre, main.rig);
      this.contraste = contraste(this.image);
      const etiq = coloriage ? lireEtiquettes(coloriage, this.image) : null;
      this.etiquettes = etiq ? etiq.texture : null;
      this.maillage = maillage(this.image, cadre, main.rig, 8, etiq ? etiq.e : null, etiq ? etiq.voisin : null);
    }
  }

  // Tables de caractères pour une taille de case : l'atlas (chaque caractère dessiné une fois, à la
  // résolution de l'appareil) et, pour chaque caractère, son encre dans chacun des 4 × 6 sous-carrés de la
  // case, rangée par paquets de quatre (6 pixels RGBA par caractère).
  function tablesGlyphes(cw, ch, dpr) {
    const gw = Math.max(4, Math.round(cw * dpr)), gh = Math.max(6, Math.round(ch * dpr));
    const tous = JEUX.robot + JEUX.humain + BORDS;
    const atlas = document.createElement('canvas');
    atlas.width = gw * tous.length;
    atlas.height = gh;
    const ctx = atlas.getContext('2d', { willReadFrequently: true });
    ctx.font = `600 ${Math.round(gh * 0.86)}px ${POLICE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    [...tous].forEach((car, k) => ctx.fillText(car, k * gw + gw / 2, gh / 2 + gh * 0.04));
    const px = ctx.getImageData(0, 0, atlas.width, gh).data;
    const donnees = new Uint8Array(tous.length * 6 * 4);
    const encre = [];
    [...tous].forEach((_, k) => {
      const somme = new Float32Array(FX * FY), n = new Float32Array(FX * FY);
      let total = 0;
      for (let y = 0; y < gh; y++)
        for (let x = 0; x < gw; x++) {
          const v = px[4 * (y * atlas.width + k * gw + x) + 3] / 255;
          const b = Math.min(FY - 1, Math.floor((y * FY) / gh)) * FX + Math.min(FX - 1, Math.floor((x * FX) / gw));
          somme[b] += v;
          n[b]++;
          total += v;
        }
      encre.push(total / (gw * gh));
      for (let b = 0; b < FX * FY; b++) donnees[k * 24 + b] = Math.round((255 * somme[b]) / n[b]);
    });
    const nr = JEUX.robot.length, nh = JEUX.humain.length;
    const max = (de, a) => Math.max(...encre.slice(de, a));
    return {
      atlas,
      donnees,
      n: tous.length,
      jeux: { robot: [0, nr], humain: [nr, nh] },
      bords: nr + nh,
      encreMax: { robot: Math.min(1, max(0, nr)), humain: Math.min(1, max(nr, nr + nh)) },
      gw,
      gh,
    };
  }

  Object.assign((window.IntroAscii = window.IntroAscii || {}), { MainPreparee, tablesGlyphes, ECHANTILLONS: { FX, FY } });
})();
