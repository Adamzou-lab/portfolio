// Repris du prototype ~/mains-ascii (version validée par Adam le 28/10/2026), sous l'espace de noms IntroAscii.
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

  // Maillage dans l'image source : un carré tous les `pas` pixels là où la main se trouve. Chaque carré
  // appartient à la pièce qui contient son centre, et ses sommets suivent cette pièce et son parent (poids
  // qui passe en douceur de l'un à l'autre autour de l'articulation). Triangles rangés du fond vers le devant.
  function maillage(canvas, cadre, rig, pas = 8) {
    const W = canvas.width, H = canvas.height;
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const nx = Math.ceil(W / pas) + 1, ny = Math.ceil(H / pas) + 1;
    const plein = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[4 * (y * W + x) + 3] > 8;
    const bras = rig.pieces.find((q) => q.nom === 'bras');
    const sommets = [], uv = [], os = [], poids = [], deja = new Map();
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
      deja.set(cle, sommets.length / 2 - 1);
      return sommets.length / 2 - 1;
    };
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let utile = false;
        for (let y = j * pas - 2; y <= (j + 1) * pas + 2 && !utile; y += 2)
          for (let x = i * pas - 2; x <= (i + 1) * pas + 2 && !utile; x += 2) if (plein(x, y)) utile = true;
        if (!utile) continue;
        const cx = cadre.x + (i + 0.5) * pas, cy = cadre.y + (j + 0.5) * pas;
        const p = window.IntroAscii.pieceDe(rig, cx, cy, 6, 16) || bras;
        const a = sommet(i, j, p), b = sommet(i + 1, j, p), c = sommet(i, j + 1, p), e = sommet(i + 1, j + 1, p);
        (parPiece.get(p.nom) || parPiece.get('bras')).push(a, b, c, b, e, c);
      }
    return {
      sommets: new Float32Array(sommets),
      uv: new Float32Array(uv),
      os: new Float32Array(os),
      poids: new Float32Array(poids),
      triangles: new Uint16Array([...parPiece.values()].flat()),
    };
  }

  class MainPreparee {
    constructor(main, img, cadre) {
      this.main = main;
      this.cadre = cadre;
      this.image = imageMain(img, cadre, main.rig);
      this.contraste = contraste(this.image);
      this.maillage = maillage(this.image, cadre, main.rig);
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
