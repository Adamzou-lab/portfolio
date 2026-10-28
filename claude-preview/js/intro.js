/*
 * Introduction animée du portfolio : main robotique + main humaine.
 * Aucune dépendance. Les mains sont les calques extraits de l'image d'origine,
 * déplacés en bloc (translation + légère rotation rigide), jamais redessinés.
 */
(() => {
  'use strict';

  /* =========================================================================
   * RÉGLAGES (modifiables ici ou via l'URL : ?duree=6000&separation=300&ecart=20&halo=1.3)
   * Les distances sont en pixels de l'image source (1536 × 1024), donc
   * indépendantes de la taille de l'écran.
   * ========================================================================= */
  const CONFIG = {
    duration: 5600,          // durée totale de l'intro, en ms (≈ 5 à 6 s)
    initialSeparation: 240,  // écart ajouté entre les deux index au départ
    finalGap: 30,            // écart restant entre les bouts des index à l'arrêt (42 dans l'image d'origine)
    haloIntensity: 1,        // 0.5 = discret, 1 = défaut, 1.6 = très lumineux
    approachRotation: 1,     // degrés : léger arc d'approche des bras (0 = translation pure)
    reducedMotion: 'static', // si prefers-reduced-motion : 'static' (fondus seuls) ou 'skip' (portfolio direct)
    debug: false,            // ?debug=1 : affiche les ancres et le point milieu
  };

  const params = new URLSearchParams(location.search);
  const readNum = (keys, min, max) => {
    for (const k of keys) {
      if (!params.has(k)) continue;
      const v = parseFloat(params.get(k));
      if (Number.isFinite(v)) return Math.min(max, Math.max(min, v));
    }
    return undefined;
  };
  const overrides = {
    duration: readNum(['duree', 'duration'], 2000, 20000),
    initialSeparation: readNum(['separation'], 0, 900),
    finalGap: readNum(['ecart', 'gap'], 0, 200),
    haloIntensity: readNum(['halo'], 0, 3),
    approachRotation: readNum(['rotation'], 0, 6),
  };
  for (const [k, v] of Object.entries(overrides)) if (v !== undefined) CONFIG[k] = v;
  if (params.get('debug') === '1') CONFIG.debug = true;
  if (params.get('reduit') === '1') CONFIG.forceReduced = true;

  /* =========================================================================
   * GÉOMÉTRIE MESURÉE SUR L'IMAGE SOURCE (px source)
   * x, y, w, h : position et taille du calque recadré dans l'image d'origine
   * tip        : ancre au bout de l'index (point le plus avancé du masque)
   * pivot      : point de rotation, sur la coupe du bras au bord de l'image
   * out        : sens de l'éloignement (-1 vers la gauche, +1 vers la droite)
   * ========================================================================= */
  const SRC = { w: 1536, h: 1024, bgPad: 700, bgH: 2424 };
  const HANDS = {
    robot: { x: 0, y: 474, w: 727, h: 351, tip: [720, 521], pivot: [0, 650], out: -1 },
    human: { x: 756, y: 467, w: 780, h: 318, tip: [762, 525], pivot: [1536, 620], out: 1 },
  };
  const ORIGINAL_GAP = HANDS.human.tip[0] - HANDS.robot.tip[0]; // 42

  // Découpage du temps (fractions de la durée totale)
  const PHASE = {
    approachEnd: 0.60,  // les mains finissent de ralentir (≈ 3,4 s sur 5,6 s)
    bloomStart: 0.55,   // la lumière commence à envahir l'écran
    bloomEnd: 0.83,     // écran entièrement blanc
    revealStart: 0.84,  // le blanc se dissipe sur le portfolio
  };

  /* ===== Utilitaires ===== */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeInOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

  // cubic-bezier CSS, résolu par Newton + dichotomie
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 6; i++) {
        const e = sx(t) - x; const d = dx(t);
        if (Math.abs(e) < 1e-5) return sy(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1; t = x;
      for (let i = 0; i < 30; i++) { const v = sx(t); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return sy(t);
    };
  }
  // départ lent, longue décélération jusqu'à l'arrêt
  const easeApproach = bezier(0.38, 0, 0.16, 1);

  /* ===== Éléments ===== */
  const root = document.documentElement;
  const el = {
    bgWrap: document.querySelector('.grain-bg'),
    bg: document.querySelector('.grain-bg img'),
    intro: document.querySelector('.intro'),
    robot: document.querySelector('.intro__hand--robot'),
    human: document.querySelector('.intro__hand--human'),
    canvas: document.querySelector('.intro__light'),
    skip: document.querySelector('.intro__skip'),
    replay: document.querySelector('.replay'),
    portfolio: document.querySelector('.portfolio'),
    // Après « Passer », la tabulation repart du logo pour ne pas sauter la navigation.
    focusTarget: document.querySelector('.brand') || document.querySelector('#portfolio-title'),
  };
  const ctx = el.canvas.getContext('2d');
  // Le <head> active l'intro avant le premier rendu, à chaque arrivée sur Traversée.
  const introWanted = root.classList.contains('intro-running');
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => CONFIG.forceReduced || mqReduce.matches;

  /* ===== Mains en caractères (js/intro-ascii/), sinon les images =====
   * Le moteur anime les mains articulées et choisit à chaque image le caractère de chaque case. Sans ses
   * scripts (maquette Atelier), sans WebGL, ou sur un appareil trop lent, l'intro garde ses images.
   * ?mains=images force les images, pour comparer. */
  const asciiVoulu = !!(window.IntroAscii && window.IntroAscii.creer) && params.get('mains') !== 'images';
  const ascii = { moteur: null, actif: false, preparation: null, canvas: null };
  if (asciiVoulu) {
    ascii.canvas = document.createElement('canvas');
    ascii.canvas.className = 'intro__ascii';
    el.intro.append(ascii.canvas);
    ascii.canvas.addEventListener('webglcontextlost', () => desactiverAscii());
  }

  /* ===== Cadrage : source → écran ===== */
  const view = { vw: 0, vh: 0, s: 1, ox: 0, oy: 0, dpr: 1 };
  let solidWhite = false; // le canvas contient déjà un blanc plein

  function computeFrame() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // marge pour que la coupe des avant-bras reste hors champ même si les mains avancent
    const inward = Math.max(0, (ORIGINAL_GAP - CONFIG.finalGap) / 2);
    const margin = inward + 10;
    const maxVisW = SRC.w - 2 * margin;
    const minVisW = 720; // en portrait : largeur source minimale visible (index, doigts et écart restent lisibles)
    let s = vh / 780;
    if (vw / s > maxVisW) s = vw / maxVisW;
    if (vw / s < minVisW) s = vw / minVisW;
    const visW = vw / s, visH = vh / s;
    const midX = (HANDS.robot.tip[0] + HANDS.human.tip[0]) / 2;
    const tipY = (HANDS.robot.tip[1] + HANDS.human.tip[1]) / 2;
    const loX = margin + visW / 2, hiX = SRC.w - margin - visW / 2;
    const cx = loX <= hiX ? clamp(midX, loX, hiX) : SRC.w / 2;
    let cy = tipY + 0.05 * visH; // bouts des index légèrement au-dessus du centre
    const loY = -SRC.bgPad + visH / 2, hiY = SRC.h + SRC.bgPad - visH / 2;
    if (loY <= hiY) cy = clamp(cy, loY, hiY);
    Object.assign(view, { vw, vh, s, ox: vw / 2 - s * cx, oy: vh / 2 - s * cy, dpr: Math.min(2, window.devicePixelRatio || 1) });
  }

  function layout() {
    computeFrame();
    const { s, ox, oy } = view;
    Object.assign(el.bg.style, {
      width: `${SRC.w * s}px`, height: `${SRC.bgH * s}px`,
      transform: `translate3d(${ox}px, ${oy - SRC.bgPad * s}px, 0)`,
    });
    for (const key of ['robot', 'human']) {
      const h = HANDS[key], img = el[key];
      img.style.width = `${h.w * s}px`;
      img.style.height = `${h.h * s}px`;
      img.style.left = `${ox + h.x * s}px`;
      img.style.top = `${oy + h.y * s}px`;
      img.style.transformOrigin = `${(h.pivot[0] - h.x) * s}px ${(h.pivot[1] - h.y) * s}px`;
    }
    solidWhite = false;
    el.canvas.width = Math.round(view.vw * view.dpr);
    el.canvas.height = Math.round(view.vh * view.dpr);
    if (ascii.moteur) ascii.moteur.redimensionner(view);
  }

  /* ===== Pose des mains et ancres transformées ===== */
  function handPose(key, e) {
    const h = HANDS[key];
    const inward = (ORIGINAL_GAP - CONFIG.finalGap) / 2;           // décalage final vers l'intérieur
    const dxFinal = -h.out * inward;
    const dxStart = dxFinal + h.out * CONFIG.initialSeparation / 2;
    const dx = lerp(dxStart, dxFinal, e);
    // l'index part un peu plus bas puis remonte : rotation rigide autour de la coupe du bras
    const deg = lerp((key === 'robot' ? 1 : -1) * CONFIG.approachRotation, 0, e);
    return { dx, dy: 0, deg };
  }

  // point source p → position source après transformation (pivot + R·(p − pivot) + translation)
  function transformPoint(key, pose, p) {
    const h = HANDS[key], a = (pose.deg * Math.PI) / 180;
    const vx = p[0] - h.pivot[0], vy = p[1] - h.pivot[1];
    return [h.pivot[0] + vx * Math.cos(a) - vy * Math.sin(a) + pose.dx,
            h.pivot[1] + vx * Math.sin(a) + vy * Math.cos(a) + pose.dy];
  }
  const toScreen = (p) => [view.ox + p[0] * view.s, view.oy + p[1] * view.s];

  function applyPose(key, pose) {
    el[key].style.transform = `translate3d(${pose.dx * view.s}px, ${pose.dy * view.s}px, 0) rotate(${pose.deg}deg)`;
  }

  // Même transformation que l'image, en matrice source → écran [a, b, c, d, e, f] pour le moteur en caractères.
  function poseMatrix(key, pose) {
    const h = HANDS[key], r = (pose.deg * Math.PI) / 180, c = Math.cos(r), si = Math.sin(r), k = view.s;
    const tx = h.pivot[0] - c * h.pivot[0] + si * h.pivot[1] + pose.dx;
    const ty = h.pivot[1] - si * h.pivot[0] - c * h.pivot[1] + pose.dy;
    return [k * c, k * si, -k * si, k * c, view.ox + k * tx, view.oy + k * ty];
  }
  const poseMatrices = (e) => ({ robot: poseMatrix('robot', handPose('robot', e)), human: poseMatrix('human', handPose('human', e)) });
  const fromScreen = (p) => [(p[0] - view.ox) / view.s, (p[1] - view.oy) / view.s];

  function activerAscii(on) {
    ascii.actif = on && !!ascii.moteur;
    el.intro.classList.toggle('intro--ascii', ascii.actif);
    root.classList.toggle('intro-ascii', ascii.actif);
  }

  // Au moindre problème du moteur, l'intro continue avec les images.
  function desactiverAscii() {
    ascii.moteur = null;
    ascii.preparation = Promise.resolve(null);
    activerAscii(false);
  }

  // Les mains en caractères à l'avancée e ; renvoie les bouts des index à l'écran, ou null avec les images.
  function dessinerAscii(e, poses) {
    if (!ascii.actif) return null;
    try {
      return ascii.moteur.dessiner(e, { robot: poseMatrix('robot', poses.robot), human: poseMatrix('human', poses.human) });
    } catch (error) {
      desactiverAscii();
      return null;
    }
  }

  // Mouvement réduit : mains en caractères immobiles, en pose finale.
  function figerAscii() {
    if (!ascii.actif) return;
    try {
      ascii.moteur.figer(poseMatrices(1));
    } catch (error) {
      desactiverAscii();
    }
  }

  // Préparation du moteur, une fois : 2 s au plus, sinon les images.
  function preparerAscii() {
    const creation = window.IntroAscii.creer({
      canvas: ascii.canvas,
      images: { robot: el.robot, human: el.human },
      cadres: HANDS,
      vue: view,
      matricesDepart: poseMatrices(0),
    }).catch(() => null);
    const delai = new Promise((r) => setTimeout(() => r(null), 2000));
    return Promise.race([creation, delai]).then((moteur) => {
      if (!moteur) creation.then((tard) => tard && tard.liberer());
      return moteur;
    });
  }

  /* ===== Lumière ===== */
  const STOPS = 10, EDGE = Math.exp(-4.2);
  function glow(x, y, r, alpha, stretch, angle) {
    if (alpha <= 0.002 || r <= 0.5) return;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle); ctx.scale(stretch, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    for (let i = 0; i <= STOPS; i++) {
      const t = i / STOPS;
      const v = (Math.exp(-4.2 * t * t) - EDGE) / (1 - EDGE); // profil gaussien sans bord dur
      g.addColorStop(t, `rgba(255,255,255,${(alpha * v).toFixed(4)})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
  }

  /*
   * near  : proximité des index (0 → 1), dérivée de la distance réelle entre ancres
   * bloom : envahissement de l'écran (0 → 1)
   */
  const GRAIN_IN_LIGHT = 0.3; // part du grain du fond qui reste visible dans la lumière
  function drawLight(c, angle, near, bloom, gap) {
    const { dpr, s } = view;
    const W = el.canvas.width, H = el.canvas.height;
    if (bloom >= 1) {                       // écran entièrement blanc : rien à recalculer
      if (!solidWhite) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        solidWhite = true;
      }
      return;
    }
    solidWhite = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    if (near <= 0 && bloom <= 0) return;
    ctx.globalCompositeOperation = 'lighter';
    const k = CONFIG.haloIntensity;
    const x = c[0] * dpr, y = c[1] * dpr, u = s * dpr;

    // 1. étincelle et halo : rayon et éclat suivent la proximité des index.
    //    Le cœur reste dans l'espace libre entre les deux bouts (≈ 45 % de l'écart).
    const n = Math.pow(near, 1.5);
    const rCore = u * Math.min(gap * 0.45, 4 + 12 * n) * (0.85 + 0.15 * k);
    const rHalo = u * (18 + 72 * n) * (0.8 + 0.2 * k);
    let reach = rHalo * 1.35;               // rayon englobant de ce qui est dessiné
    glow(x, y, rHalo, Math.min(1, 0.5 * n * k), 1.35, angle);
    glow(x, y, rCore, Math.min(1, 1.0 * n * k), 1.7, angle);

    // 2. envahissement : le halo grandit jusqu'à couvrir tout l'écran
    if (bloom > 0) {
      const far = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) * 1.4;
      const eb = Math.pow(bloom, 2);
      const r = lerp(rHalo, far, eb);
      reach = Math.max(reach, r * lerp(1.35, 1, eb));
      glow(x, y, r, Math.min(1, 0.5 + 0.5 * eb) * smooth(0, 0.3, bloom) * Math.max(0.5, Math.min(1.3, k)), lerp(1.35, 1, eb), angle);
      const fill = smooth(0.6, 1, bloom);
      if (fill > 0) { ctx.fillStyle = `rgba(255,255,255,${fill.toFixed(4)})`; ctx.fillRect(0, 0, W, H); reach = Infinity; }
    }

    // 3. le grain du fond reste lisible à travers la lumière, jusqu'au blanc total
    const g = GRAIN_IN_LIGHT * (1 - smooth(0.35, 0.9, bloom));
    if (g > 0.01 && el.bg.naturalWidth) {
      ctx.save();
      if (Number.isFinite(reach)) { ctx.beginPath(); ctx.rect(x - reach, y - reach, 2 * reach, 2 * reach); ctx.clip(); }
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = g;
      ctx.drawImage(el.bg, view.ox * dpr, (view.oy - SRC.bgPad * s) * dpr, SRC.w * u, SRC.bgH * u);
      ctx.restore();
    }
  }

  function drawDebug(a, b, c, dist) {
    const d = view.dpr;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.5 * d;
    for (const [p, col] of [[a, '#e0115f'], [b, '#e0115f'], [c, '#0a7cff']]) {
      ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(p[0] * d, p[1] * d, 6 * d, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((p[0] - 10) * d, p[1] * d); ctx.lineTo((p[0] + 10) * d, p[1] * d);
      ctx.moveTo(p[0] * d, (p[1] - 10) * d); ctx.lineTo(p[0] * d, (p[1] + 10) * d); ctx.stroke();
    }
    ctx.fillStyle = '#0a7cff';
    ctx.font = `${12 * d}px ui-monospace, monospace`;
    ctx.fillText(`écart index : ${dist.toFixed(1)} px source`, (c[0] + 12) * d, (c[1] - 14) * d);
  }

  /* ===== Rendu d'une frame à l'instant t (0 → 1) ===== */
  const api = { onFrame: null }; // portfolioIntro.onFrame = (f) => console.log(f) pour suivre la séquence

  function renderAt(t) {
    const e = easeApproach(clamp(t / PHASE.approachEnd, 0, 1));
    const poses = { robot: handPose('robot', e), human: handPose('human', e) };
    applyPose('robot', poses.robot);
    applyPose('human', poses.human);

    // En caractères, les doigts bougent : la lumière suit les bouts des index animés.
    const bouts = dessinerAscii(e, poses);
    const a = bouts ? fromScreen(bouts.robot) : transformPoint('robot', poses.robot, HANDS.robot.tip);
    const b = bouts ? fromScreen(bouts.human) : transformPoint('human', poses.human, HANDS.human.tip);
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mid = toScreen([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);

    // la lumière naît quand l'écart a parcouru la moitié du chemin
    const dNear = CONFIG.finalGap + Math.max(1, CONFIG.initialSeparation * 0.5);
    const near = clamp((dNear - dist) / (dNear - CONFIG.finalGap), 0, 1);
    if (ascii.actif) ascii.moteur.proche = near; // l'index humain tremble juste avant le contact
    const bloom = clamp((t - PHASE.bloomStart) / (PHASE.bloomEnd - PHASE.bloomStart), 0, 1);
    const fade = clamp((t - PHASE.revealStart) / (1 - PHASE.revealStart), 0, 1);

    drawLight(mid, angle, near, bloom, dist);
    // dissipation : le voile blanc s'efface d'un bloc, le portfolio est déjà dessous
    el.canvas.style.opacity = fade > 0 ? (1 - easeInOutSine(fade)).toFixed(4) : '';
    if (CONFIG.debug && fade === 0) drawDebug(toScreen(a), toScreen(b), mid, dist);
    if (api.onFrame) api.onFrame({ t, dist, near, bloom, fade, mid });
    return { dist, mid };
  }

  /* ===== Déroulé ===== */
  const state = { mode: 'idle', elapsed: 0, last: 0, raf: 0, revealed: false, token: 0 };
  const timers = new Set();

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }

  function cancelPlayback() {
    ++state.token;
    cancelAnimationFrame(state.raf);
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
  }

  function setRunning(on) {
    root.classList.toggle('intro-running', on);
    el.skip.classList.remove('is-leaving');
    el.intro.hidden = !on;
    el.canvas.hidden = !on;
    el.skip.hidden = !on;
    if (el.replay) el.replay.hidden = on;
  }

  function revealPortfolio() {
    if (state.revealed) return;
    state.revealed = true;
    // sous le blanc total : le portfolio (déjà rendu) devient visible, les mains disparaissent
    el.portfolio.style.transition = 'none'; // déjà rendu : visible d'un coup, caché par le blanc
    if (ascii.actif) el.bg.style.transition = 'none'; // le fond, atténué sous les caractères, revient sous le blanc
    el.skip.classList.add('is-leaving');
    root.classList.remove('intro-running');
    root.classList.add('intro-revealing');
    el.intro.style.opacity = '0';
  }

  function finish() {
    cancelAnimationFrame(state.raf);
    state.mode = 'done';
    setRunning(false);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    el.intro.style.opacity = '';
    el.canvas.style.opacity = '';
    el.canvas.style.transition = '';
    el.intro.style.transition = '';
    el.portfolio.style.transition = '';
    activerAscii(false);
    el.bg.style.transition = '';
    schedule(() => root.classList.remove('intro-revealing'), 900);
  }

  function tick(now) {
    const dt = Math.min(64, now - state.last); // un onglet masqué met l'intro en pause au lieu de la faire sauter
    state.last = now;
    state.elapsed += dt;
    const t = clamp(state.elapsed / CONFIG.duration, 0, 1);
    if (t >= PHASE.revealStart) revealPortfolio();
    renderAt(t);
    if (t >= 1) { finish(); return; }
    state.raf = requestAnimationFrame(tick);
  }

  /* Version mouvement réduit : mains immobiles en pose finale, lumière en fondu, fondu enchaîné */
  function runReduced(token) {
    const D = 2600;
    const t0 = performance.now();
    const pose = { robot: handPose('robot', 1), human: handPose('human', 1) };
    applyPose('robot', pose.robot); applyPose('human', pose.human);
    const a = transformPoint('robot', pose.robot, HANDS.robot.tip);
    const b = transformPoint('human', pose.human, HANDS.human.tip);
    const mid = toScreen([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const step = (now) => {
      if (token !== state.token) return;
      const t = clamp((now - t0) / D, 0, 1);
      drawLight(mid, angle, 0.8 * smooth(0, 0.45, t), 0, Math.hypot(b[0] - a[0], b[1] - a[1]));
      if (t >= 0.62 && !state.revealed) crossfadeOut(800);
      if (t < 1 && state.mode === 'playing') state.raf = requestAnimationFrame(step);
    };
    state.raf = requestAnimationFrame(step);
  }

  // Fondu enchaîné sans flash : la scène s'efface pendant que le portfolio apparaît
  function crossfadeOut(ms) {
    if (state.mode === 'done' || state.mode === 'leaving') return;
    state.mode = 'leaving';
    cancelAnimationFrame(state.raf);
    state.revealed = true;
    el.skip.classList.add('is-leaving');
    root.classList.remove('intro-running');
    root.classList.add('intro-revealing');
    el.intro.style.transition = `opacity ${ms}ms ease`;
    el.canvas.style.transition = `opacity ${ms}ms ease`;
    el.intro.style.opacity = '0';
    el.canvas.style.opacity = '0';
    schedule(finish, ms + 30);
  }

  async function ready() {
    const imgs = [el.bg, el.robot, el.human];
    await Promise.all(imgs.map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {
      if (!img.complete || !img.naturalWidth) throw new Error('image');
    })));
    if (asciiVoulu && !ascii.preparation) ascii.preparation = preparerAscii();
    if (ascii.preparation) ascii.moteur = await ascii.preparation;
  }

  async function play({ arrival = false } = {}) {
    cancelPlayback();
    const token = state.token;
    root.classList.remove('intro-revealing', 'intro-leaving-portfolio');
    el.canvas.style.transition = '';
    el.portfolio.style.transition = '';
    if (isReduced() && CONFIG.reducedMotion === 'skip') { finish(); return; }
    // Compatibilité avec la maquette Atelier locale, encore limitée à une session.
    try { sessionStorage.setItem('az-intro-seen', '1'); } catch (e) { /* stockage indisponible */ }
    const replaying = !arrival && state.mode === 'done';
    state.revealed = false;
    state.elapsed = 0;
    if (replaying) {
      // le portfolio s'efface d'abord, puis la scène revient en pose de départ
      root.classList.add('intro-leaving-portfolio');
      await new Promise((r) => setTimeout(r, 380));
      if (token !== state.token) return;
      window.scrollTo(0, 0);
      root.classList.remove('intro-leaving-portfolio');
    }
    state.mode = 'playing';
    el.intro.style.transition = 'none';
    el.intro.style.opacity = '0';
    el.canvas.style.opacity = '';
    setRunning(true);
    activerAscii(true);
    if (ascii.actif) ascii.moteur.reinitialiser();
    layout();
    renderAt(0);
    if (isReduced()) {
      applyPose('robot', handPose('robot', 1));
      applyPose('human', handPose('human', 1));
      figerAscii();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    }
    void el.intro.offsetWidth;
    el.intro.style.transition = 'opacity 450ms ease';
    el.intro.style.opacity = '1';
    await new Promise((r) => setTimeout(r, 450));
    if (token !== state.token || state.mode !== 'playing') return;
    el.intro.style.transition = '';
    if (isReduced()) { runReduced(token); return; }
    state.elapsed = 0;
    state.last = performance.now();
    state.raf = requestAnimationFrame(tick);
  }

  function skip() {
    if (state.mode !== 'playing') return;
    if (state.revealed) { state.elapsed = Math.max(state.elapsed, CONFIG.duration * 0.97); return; }
    crossfadeOut(450);
    schedule(() => el.focusTarget && el.focusTarget.focus({ preventScroll: true }), 500);
  }

  /* ===== Événements ===== */
  el.skip.addEventListener('click', skip);
  el.replay?.addEventListener('click', () => play());
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') skip(); });
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      layout();
      if (state.mode === 'frozen') { renderAt(freezeT); return; }
      if (state.mode !== 'playing') return;
      if (isReduced()) { applyPose('robot', handPose('robot', 1)); applyPose('human', handPose('human', 1)); figerAscii(); }
      else renderAt(clamp(state.elapsed / CONFIG.duration, 0, 1));
    });
  });

  // pour régler en direct depuis la console : portfolioIntro.config.finalGap = 20; portfolioIntro.play()
  Object.assign(api, {
    config: CONFIG, play, skip, renderAt: (t) => { layout(); return renderAt(t); }, view, hands: HANDS,
    // état des mains en caractères : actives ou non, et ms par image mesurées au test de vitesse
    ascii: () => ({ voulu: asciiVoulu, actif: ascii.actif, pret: !!ascii.moteur, msParImage: ascii.moteur ? +ascii.moteur.vitesse.toFixed(1) : null }),
  });
  window.portfolioIntro = api;

  // ?t=0.4 : fige l'intro à cet instant (0 → 1), utile pour régler une image précise
  const freezeT = readNum(['t'], 0, 1);
  function freeze(t) {
    state.mode = 'frozen';
    setRunning(true);
    activerAscii(true);
    el.intro.style.opacity = '1';
    layout();
    if (t >= PHASE.revealStart) revealPortfolio();
    renderAt(t);
  }

  // Le cache de navigation restaure le document sans relancer les scripts.
  // Un changement de chapitre ou un retour à l'onglet ne déclenche pas pageshow.
  window.addEventListener('pagehide', () => cancelPlayback());
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted || !introWanted || freezeT !== undefined) return;
    start({ arrival: true });
  });

  async function start(options) {
    cancelPlayback();
    const token = state.token;
    try {
      await ready();
      if (token !== state.token) return;
      el.bgWrap.classList.add('is-loaded');
      if (freezeT !== undefined) return freeze(freezeT);
      return introWanted ? play(options) : finish();
    } catch (error) {
      if (token !== state.token) return;
      el.bgWrap.classList.add('is-loaded');
      finish();
    }
  }

  layout();
  start();
})();
