// Repris du prototype ~/mains-ascii (version validée par Adam le 28/10/2026), sous l'espace de noms IntroAscii.
// Rendu en WebGL, en trois passes à chaque image, sur le principe des koïs : la grille de caractères est fixe
// à l'écran et chaque case choisit son caractère d'après ce qui passe dessous.
//   1. Les mains : chaque maillage, déformé par ses os, est dessiné dans une texture de 4 × 6 échantillons
//      par case (noirceur, couverture, main).
//   2. Les cases : pour chaque case, on compare l'encre attendue à celle de chaque caractère du jeu de la
//      main (robot ou humain) et on garde le plus proche ; au bord de la silhouette, un trait dans le sens
//      du bord. Le caractère de l'image précédente reste tant qu'il est presque aussi juste (inertie) : une
//      case à la limite entre deux caractères ne clignote plus quand la main respire.
//   3. L'écran : papier sous la main, caractère par-dessus.
(function () {
  const MAX_OS = 16;
  const MAX_GLYPHES = 48;
  const PAPIER = [244 / 255, 244 / 255, 242 / 255];
  const ENCRE = [11 / 255, 11 / 255, 11 / 255];

  const SOMMETS_MAIN = `
    attribute vec2 a_src;
    attribute vec2 a_uv;
    attribute vec2 a_os;
    attribute float a_poids;
    uniform mat3 u_os[${MAX_OS}];
    uniform mat3 u_pose;
    uniform vec2 u_taille;
    uniform float u_sens;
    varying vec2 v_uv;
    void main() {
      mat3 m = u_os[int(a_os.x)] * a_poids + u_os[int(a_os.y)] * (1.0 - a_poids);
      vec3 p = u_pose * (m * vec3(a_src, 1.0));
      vec2 clip = p.xy / u_taille * 2.0 - 1.0;
      gl_Position = vec4(clip.x, clip.y * u_sens, 0.0, 1.0);
      v_uv = a_uv;
    }`;

  // Passe 1 : noirceur et couverture (prémultipliées), main dans le bleu. En vue de réglage, l'image telle quelle.
  const FRAGMENTS_MAIN = `
    precision mediump float;
    uniform sampler2D u_tex;
    uniform float u_main;
    uniform float u_direct;
    varying vec2 v_uv;
    void main() {
      vec4 c = texture2D(u_tex, v_uv);
      if (u_direct > 0.5) { gl_FragColor = c; return; }
      float a = c.a;
      float lum = a > 0.001 ? dot(c.rgb / a, vec3(0.299, 0.587, 0.114)) : 1.0;
      gl_FragColor = vec4((1.0 - lum) * a, a, u_main * a, a);
    }`;

  const SOMMETS_ECRAN = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

  // Passe 2 : un fragment par case.
  const FRAGMENTS_CASES = `
    precision highp float;
    uniform sampler2D u_mains;
    uniform vec2 u_mainsTaille;
    uniform sampler2D u_glyphes;
    uniform float u_nGlyphes;
    uniform vec4 u_jeux;
    uniform vec4 u_contraste;
    uniform vec2 u_encre;
    uniform float u_bords;
    uniform float u_rapport;
    uniform sampler2D u_avant;
    uniform vec2 u_grille;
    uniform float u_inertie;

    vec4 lire(vec2 texel) { return texture2D(u_mains, texel / u_mainsTaille); }

    void main() {
      vec2 cell = floor(gl_FragCoord.xy);
      vec2 origine = cell * vec2(4.0, 6.0);
      // Le caractère de cette case à l'image précédente (-1 : vide), et son trait s'il était un bord (0 à 4).
      vec4 prec = texture2D(u_avant, (cell + 0.5) / u_grille);
      float iAvant = prec.b > 0.5 ? floor(prec.r * 255.0 + 0.5) : -1.0;
      float kAvant = iAvant >= u_bords && iAvant < u_bords + 4.5 ? iAvant - u_bords : -1.0;
      bool bordAvant = kAvant >= 0.0;
      float cov[24];
      float sombre[24];
      float covSomme = 0.0, mainSomme = 0.0;
      for (int j = 0; j < 6; j++)
        for (int i = 0; i < 4; i++) {
          vec4 t = lire(origine + vec2(float(i), float(j)) + 0.5);
          cov[j * 4 + i] = t.g;
          sombre[j * 4 + i] = t.r;
          covSomme += t.g;
          mainSomme += t.b;
        }
      float c = covSomme / 24.0;
      // Chaque seuil s'écarte en faveur de l'état précédent de la case.
      if (c < (iAvant < 0.0 ? 0.038 : 0.022)) { gl_FragColor = vec4(0.0); return; }
      bool robot = mainSomme > 0.5 * covSomme;
      float bas = robot ? u_contraste.x : u_contraste.z;
      float haut = robot ? u_contraste.y : u_contraste.w;
      float encreMax = robot ? u_encre.x : u_encre.y;

      // Contour : la couverture des cases voisines donne le sens du bord.
      float cL = lire(origine + vec2(-2.0, 3.0)).g, cR = lire(origine + vec2(6.0, 3.0)).g;
      float cU = lire(origine + vec2(2.0, -3.0)).g, cD = lire(origine + vec2(2.0, 9.0)).g;
      float gx = cR - cL, gy = (cD - cU) * u_rapport;
      float sc = bordAvant ? 0.06 : 0.11;
      if (c > sc && c < 1.0 - sc && abs(gx) + abs(gy) > (bordAvant ? 0.035 : 0.055)) {
        float ax = abs(gx), ay = abs(gy), k;
        float sH = kAvant == 0.0 || kAvant == 4.0 ? 0.65 : bordAvant ? 0.25 : 0.414;
        float sV = kAvant == 1.0 ? 0.65 : bordAvant ? 0.25 : 0.414;
        float sB = kAvant == 4.0 ? 0.52 : kAvant == 0.0 ? 0.72 : 0.62;
        if (ax < sH * ay) k = (gy > 0.0 ? 1.0 - c : c) > sB ? 4.0 : 0.0;
        else if (ay < sV * ax) k = 1.0;
        else k = gx * gy > 0.0 ? 2.0 : 3.0;
        gl_FragColor = vec4((u_bords + k) / 255.0, 0.92, 1.0, 1.0);
        return;
      }

      // Ton moyen alentour (3 × 3 cases) : le détail est ce qui s'en écarte.
      float mc = 0.0, md = 0.0;
      for (int dy = -1; dy <= 1; dy++)
        for (int dx = -1; dx <= 1; dx++) {
          vec4 m = lire(origine + vec2(float(dx) * 4.0 + 2.0, float(dy) * 6.0 + 3.0));
          mc += m.g;
          md += m.r;
        }
      float moyen = mc > 0.02 ? clamp((md / mc - bas) / (haut - bas), 0.0, 1.0) : 0.0;
      float base = 0.18 + 0.55 * pow(moyen, 1.4);

      // Encre attendue dans chacun des 24 sous-carrés, et par zone de 2 × 2.
      float cible[24];
      float zone[6];
      float e0 = 0.0;
      for (int b = 0; b < 24; b++) {
        float ton = cov[b] > 0.02 ? clamp((sombre[b] / cov[b] - bas) / (haut - bas), 0.0, 1.0) : 0.0;
        cible[b] = encreMax * 1.3 * clamp(base + 1.5 * (ton - moyen), 0.0, 1.0) * cov[b];
        e0 += 0.5 * cible[b] * cible[b];
      }
      for (int zy = 0; zy < 3; zy++)
        for (int zx = 0; zx < 2; zx++) {
          float z = 0.25 * (cible[zy * 8 + zx * 2] + cible[zy * 8 + zx * 2 + 1] + cible[zy * 8 + zx * 2 + 4] + cible[zy * 8 + zx * 2 + 5]);
          zone[zy * 2 + zx] = z;
          e0 += 40.0 * z * z;
        }

      // Le caractère le plus proche dans le jeu de la main.
      float debut = robot ? u_jeux.x : u_jeux.z;
      float nombre = robot ? u_jeux.y : u_jeux.w;
      float meilleur = e0, choix = -1.0, alpha = 0.0;
      float errAvant = iAvant < 0.0 ? e0 : 1e9, aAvant = 0.0;
      for (int k = 0; k < ${MAX_GLYPHES}; k++) {
        if (float(k) >= nombre) break;
        float v = (debut + float(k) + 0.5) / u_nGlyphes;
        float num = 0.0, den = 0.0;
        vec4 r[6];
        for (int q = 0; q < 6; q++) r[q] = texture2D(u_glyphes, vec2((float(q) + 0.5) / 6.0, v));
        for (int q = 0; q < 6; q++) {
          num += 0.5 * dot(r[q], vec4(cible[q * 4], cible[q * 4 + 1], cible[q * 4 + 2], cible[q * 4 + 3]));
          den += 0.5 * dot(r[q], r[q]);
        }
        for (int zy = 0; zy < 3; zy++) {
          vec4 h = r[zy * 2], l = r[zy * 2 + 1];
          float gz0 = 0.25 * (h.x + h.y + l.x + l.y), gz1 = 0.25 * (h.z + h.w + l.z + l.w);
          num += 40.0 * (gz0 * zone[zy * 2] + gz1 * zone[zy * 2 + 1]);
          den += 40.0 * (gz0 * gz0 + gz1 * gz1);
        }
        float a = clamp(num / max(den, 1e-5), 0.82, 1.0);
        float err = e0 - 2.0 * a * num + a * a * den;
        if (err < meilleur) { meilleur = err; choix = debut + float(k); alpha = a; }
        if (abs(debut + float(k) - iAvant) < 0.5) { errAvant = err; aAvant = a; }
      }
      // Inertie : le caractère précédent (ou la case vide) reste tant que son écart au meilleur est faible.
      if (errAvant - meilleur <= u_inertie * e0) { choix = iAvant; alpha = aAvant; }
      if (choix < 0.0) { gl_FragColor = vec4(0.0); return; }
      gl_FragColor = vec4(choix / 255.0, alpha, 1.0, 1.0);
    }`;

  // Passe 3 : papier sous la main, caractère par-dessus.
  const FRAGMENTS_ECRAN = `
    precision highp float;
    uniform sampler2D u_cases;
    uniform vec2 u_grille;
    uniform sampler2D u_mains;
    uniform vec2 u_tailleCss;
    uniform sampler2D u_atlas;
    uniform float u_nAtlas;
    uniform vec2 u_case;
    uniform float u_dpr;
    uniform float u_hauteurPx;
    uniform vec3 u_papier;
    uniform vec3 u_encreRvb;
    void main() {
      vec2 css = vec2(gl_FragCoord.x, u_hauteurPx - gl_FragCoord.y) / u_dpr;
      vec2 cf = css / u_case;
      vec2 cell = floor(cf);
      vec2 loc = cf - cell;
      vec4 info = texture2D(u_cases, (cell + 0.5) / u_grille);
      float papier = 0.92 * texture2D(u_mains, css / u_tailleCss).g;
      float encre = 0.0;
      if (info.b > 0.5) {
        float idx = floor(info.r * 255.0 + 0.5);
        encre = texture2D(u_atlas, vec2((idx + loc.x) / u_nAtlas, loc.y)).a * info.g;
      }
      float a = encre + papier * (1.0 - encre);
      gl_FragColor = vec4(u_papier * papier * (1.0 - encre) + u_encreRvb * encre, a);
    }`;

  // Matrice affine [a, b, c, d, e, f] (format du canevas) vers une mat3 WebGL, rangée par colonnes.
  const versMat3 = (m, sortie, k = 0) => {
    sortie.set([m[0], m[1], 0, m[2], m[3], 0, m[4], m[5], 1], k);
    return sortie;
  };

  class RenduGL {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) throw new Error('WebGL indisponible');
      this.gl = gl;
      this.progMain = this.programme(SOMMETS_MAIN, FRAGMENTS_MAIN);
      this.progCases = this.programme(SOMMETS_ECRAN, FRAGMENTS_CASES);
      this.progEcran = this.programme(SOMMETS_ECRAN, FRAGMENTS_ECRAN);
      this.ecran = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ecran);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      this.mains = new Map();
      this.tamponOs = new Float32Array(9 * MAX_OS);
      this.tamponPose = new Float32Array(9);
      // Écart d'erreur toléré pour garder le caractère précédent, en part de l'encre attendue dans la case.
      this.inertie = 0.1;
    }

    programme(vs, fs) {
      const gl = this.gl;
      const shader = (type, source) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, source);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        return sh;
      };
      const p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, a = {};
      for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
        const nom = gl.getActiveUniform(p, i).name.replace('[0]', '');
        u[nom] = gl.getUniformLocation(p, nom);
      }
      for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i++) {
        const nom = gl.getActiveAttrib(p, i).name;
        a[nom] = gl.getAttribLocation(p, nom);
      }
      return { p, u, a };
    }

    texture(source, filtre, w, h) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      if (source) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtre);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtre);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    cible(w, h, filtre) {
      const gl = this.gl;
      const tex = this.texture(null, filtre, w, h);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fb, w, h };
    }

    liberer(c) {
      if (!c) return;
      this.gl.deleteTexture(c.tex);
      this.gl.deleteFramebuffer(c.fb);
    }

    // Envoie une fois le maillage d'une main.
    preparerMain(cle, prep, main) {
      const gl = this.gl, m = prep.maillage;
      const tampon = (donnees, cible = gl.ARRAY_BUFFER) => {
        const b = gl.createBuffer();
        gl.bindBuffer(cible, b);
        gl.bufferData(cible, donnees, gl.STATIC_DRAW);
        return b;
      };
      this.mains.set(cle, {
        prep,
        id: main.robot ? 1 : 0,
        src: tampon(m.sommets),
        uv: tampon(m.uv),
        os: tampon(m.os),
        poids: tampon(m.poids),
        triangles: tampon(m.triangles, gl.ELEMENT_ARRAY_BUFFER),
        n: m.triangles.length,
        tex: null,
      });
    }

    // Tailles d'écran et de case : textures des passes, tables de caractères, images des mains à la bonne
    // résolution (réduites d'avance quand elles sont beaucoup plus petites à l'écran, pour éviter le crénelage).
    redimensionner(largeur, hauteur, dpr, cw, s) {
      const gl = this.gl;
      const ch = Math.round(cw * 1.45);
      this.canvas.width = Math.round(largeur * dpr);
      this.canvas.height = Math.round(hauteur * dpr);
      Object.assign(this, { largeur, hauteur, dpr, cw, ch });
      this.cols = Math.ceil(largeur / cw);
      this.rows = Math.ceil(hauteur / ch);
      this.liberer(this.fboMains);
      for (const c of this.grilles || []) this.liberer(c);
      this.fboMains = this.cible(this.cols * 4, this.rows * 6, gl.LINEAR);
      // Deux grilles de cases en alternance : chaque image lit la précédente et écrit dans l'autre.
      this.grilles = [this.cible(this.cols, this.rows, gl.NEAREST), this.cible(this.cols, this.rows, gl.NEAREST)];
      this.fboCases = this.grilles[0];

      const t = window.IntroAscii.tablesGlyphes(cw, ch, dpr);
      this.tables = t;
      if (this.atlas) gl.deleteTexture(this.atlas);
      if (this.glyphes) gl.deleteTexture(this.glyphes);
      this.atlas = this.texture(t.atlas, gl.LINEAR);
      this.glyphes = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.glyphes);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 6, t.n, 0, gl.RGBA, gl.UNSIGNED_BYTE, t.donnees);
      for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const echelle = Math.min(1, (s * 4) / cw);
      for (const r of this.mains.values()) {
        if (r.tex) gl.deleteTexture(r.tex);
        let source = r.prep.image;
        if (echelle < 0.8) {
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(source.width * echelle));
          c.height = Math.max(1, Math.round(source.height * echelle));
          const x = c.getContext('2d');
          x.imageSmoothingQuality = 'high';
          x.drawImage(source, 0, 0, c.width, c.height);
          source = c;
        }
        r.tex = this.texture(source, gl.LINEAR);
      }
    }

    dessinerMaillage(cle, os, pose, direct, taille, sens) {
      const gl = this.gl, r = this.mains.get(cle), P = this.progMain;
      gl.useProgram(P.p);
      os.forEach((m, k) => versMat3(m, this.tamponOs, 9 * k));
      gl.uniformMatrix3fv(P.u.u_os, false, this.tamponOs);
      gl.uniformMatrix3fv(P.u.u_pose, false, versMat3(pose, this.tamponPose));
      gl.uniform2f(P.u.u_taille, taille[0], taille[1]);
      gl.uniform1f(P.u.u_sens, sens);
      gl.uniform1f(P.u.u_main, r.id);
      gl.uniform1f(P.u.u_direct, direct ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, r.tex);
      gl.uniform1i(P.u.u_tex, 0);
      for (const [nom, b, n] of [['a_src', r.src, 2], ['a_uv', r.uv, 2], ['a_os', r.os, 2], ['a_poids', r.poids, 1]]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.enableVertexAttribArray(P.a[nom]);
        gl.vertexAttribPointer(P.a[nom], n, gl.FLOAT, false, 0, 0);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.triangles);
      gl.drawElements(gl.TRIANGLES, r.n, gl.UNSIGNED_SHORT, 0);
      for (const nom of ['a_src', 'a_uv', 'a_os', 'a_poids']) gl.disableVertexAttribArray(P.a[nom]);
    }

    pleinEcran(P) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ecran);
      gl.enableVertexAttribArray(P.a.a_pos);
      gl.vertexAttribPointer(P.a.a_pos, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(P.a.a_pos);
    }

    // mains : { cle: { os, pose } } ; quoi : 'ascii' ou 'image' (vue de réglage, image déformée telle quelle).
    dessiner(mains, quoi) {
      const gl = this.gl;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      if (quoi === 'image') {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (const [cle, m] of Object.entries(mains)) this.dessinerMaillage(cle, m.os, m.pose, true, [this.largeur, this.hauteur], -1);
        return;
      }

      // 1. Les mains, dans la texture d'échantillons (même repère que l'écran, sans retournement).
      const F = this.fboMains, tailleCss = [this.cols * this.cw, this.rows * this.ch];
      gl.bindFramebuffer(gl.FRAMEBUFFER, F.fb);
      gl.viewport(0, 0, F.w, F.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (const [cle, m] of Object.entries(mains)) this.dessinerMaillage(cle, m.os, m.pose, false, tailleCss, 1);

      // 2. Les cases.
      gl.disable(gl.BLEND);
      const avant = this.fboCases, C = this.grilles[avant === this.grilles[0] ? 1 : 0];
      this.fboCases = C;
      const P2 = this.progCases, t = this.tables;
      const contraste = (cle) => this.mains.get(cle).prep.contraste;
      gl.bindFramebuffer(gl.FRAMEBUFFER, C.fb);
      gl.viewport(0, 0, C.w, C.h);
      gl.useProgram(P2.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, F.tex);
      gl.uniform1i(P2.u.u_mains, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.glyphes);
      gl.uniform1i(P2.u.u_glyphes, 1);
      gl.uniform2f(P2.u.u_mainsTaille, F.w, F.h);
      gl.uniform1f(P2.u.u_nGlyphes, t.n);
      gl.uniform4f(P2.u.u_jeux, ...t.jeux.robot, ...t.jeux.humain);
      gl.uniform4f(P2.u.u_contraste, ...contraste('robot'), ...contraste('human'));
      gl.uniform2f(P2.u.u_encre, t.encreMax.robot, t.encreMax.humain);
      gl.uniform1f(P2.u.u_bords, t.bords);
      gl.uniform1f(P2.u.u_rapport, this.cw / this.ch);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, avant.tex);
      gl.uniform1i(P2.u.u_avant, 2);
      gl.uniform2f(P2.u.u_grille, this.cols, this.rows);
      gl.uniform1f(P2.u.u_inertie, this.inertie);
      this.pleinEcran(P2);

      // 3. L'écran.
      const P3 = this.progEcran;
      gl.enable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(P3.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, C.tex);
      gl.uniform1i(P3.u.u_cases, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, F.tex);
      gl.uniform1i(P3.u.u_mains, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
      gl.uniform1i(P3.u.u_atlas, 2);
      gl.uniform2f(P3.u.u_grille, this.cols, this.rows);
      gl.uniform2f(P3.u.u_tailleCss, ...tailleCss);
      gl.uniform1f(P3.u.u_nAtlas, t.n);
      gl.uniform2f(P3.u.u_case, this.cw, this.ch);
      gl.uniform1f(P3.u.u_dpr, this.canvas.width / this.largeur);
      gl.uniform1f(P3.u.u_hauteurPx, this.canvas.height);
      gl.uniform3f(P3.u.u_papier, ...PAPIER);
      gl.uniform3f(P3.u.u_encreRvb, ...ENCRE);
      this.pleinEcran(P3);
    }
  }

  (window.IntroAscii = window.IntroAscii || {}).RenduGL = RenduGL;
})();
