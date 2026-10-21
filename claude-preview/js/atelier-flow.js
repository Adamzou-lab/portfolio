/**
 * Parcours illustratif de l’atelier — aucune action ni requête externe.
 * Usage : const flow = new AtelierFlow(document.querySelector('[data-flow]'));
 * L’instance démarre après l’intro, lorsqu’elle est visible. start() reprend,
 * valide l’étape humaine ou rejoue ; pause() arrête ; destroy() nettoie tout.
 * Chaque connecteur expose --progress (0–1). Les icônes sont fournies par
 * data-flow-{play,pause,check,replay}-icon sur le bouton de lecture.
 */
export class AtelierFlow {
  constructor(root) {
    if (!root?.ownerDocument) throw new TypeError('Un élément de parcours est nécessaire.');

    this.root = root;
    this.document = root.ownerDocument;
    this.view = this.document.defaultView;
    this.steps = [...root.querySelectorAll('[data-flow-step]')];
    this.links = [...root.querySelectorAll('[data-flow-link]')];
    this.description = root.querySelector('[data-flow-description]');
    this.status = root.querySelector('[data-flow-status]');
    this.play = root.querySelector('[data-flow-play]');
    this.playLabel = root.querySelector('[data-flow-play-label]');
    this.playImage = this.play?.querySelector('img');
    this.restart = root.querySelector('[data-flow-restart]');
    this.motion = this.view.matchMedia('(prefers-reduced-motion: reduce)');

    this._durations = [1200, 1400, 450, 1200, 0];
    this._descriptions = [
      'Un besoin exprimé : préparer un onboarding. Le périmètre reste à préciser.',
      'Le système propose un plan d’actions, avec les outils et les informations nécessaires.',
      'Vous relisez le plan et choisissez de poursuivre. Aucune action n’est exécutée ici.',
      'Dans cet exemple, le parcours illustre les actions autorisées et leur ordre d’exécution.',
      'Le journal permet de retracer les étapes, les résultats et les éventuelles erreurs.',
    ];
    this._activeStep = 0;
    this._elapsed = 0;
    this._state = 'paused';
    this._approved = false;
    this._requestedRunning = !this.motion.matches;
    this._visible = !this.view.IntersectionObserver;
    this._raf = null;
    this._destroyed = false;
    this._listeners = [];
    this._tick = this._tick.bind(this);

    this.steps.forEach((button) => {
      this._listen(button, 'click', () => this._inspect(Number(button.dataset.flowStep)));
    });
    this._listen(this.play, 'click', () => this._state === 'running' ? this.pause() : this.start());
    this._listen(this.restart, 'click', () => this._reset(!this.motion.matches));
    this._listen(this.document, 'visibilitychange', () => this._sync());
    this._onMotionChange = () => {
      // A new preference never starts motion that the visitor did not request.
      this._requestedRunning = false;
      this._sync();
    };
    if (this.motion.addEventListener) this.motion.addEventListener('change', this._onMotionChange);
    else this.motion.addListener(this._onMotionChange);

    if (this.view.IntersectionObserver) {
      this._intersection = new this.view.IntersectionObserver((entries) => {
        const entry = entries.find((item) => item.target === this.root);
        if (!entry) return;
        this._visible = entry.isIntersecting;
        this._sync();
      }, { threshold: 0, rootMargin: '0px' });
      this._intersection.observe(root);
    }
    if (this.view.MutationObserver) {
      this._introObserver = new this.view.MutationObserver(() => this._sync());
      this._introObserver.observe(this.document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    this._render();
    this._sync();
  }

  get state() { return this._state; }
  get activeStep() { return this._activeStep; }

  start() {
    if (this._destroyed) return;
    if (this._state === 'complete') {
      this._reset(!this.motion.matches);
      return;
    }
    if (this.motion.matches) {
      // Manual navigation replaces autoplay, including after human approval.
      this._inspect(Math.min(4, this._activeStep + 1));
      return;
    }
    if (this._state === 'awaiting') this._approved = true;
    this._requestedRunning = true;
    this._sync();
  }

  pause() {
    if (this._destroyed) return;
    this._requestedRunning = false;
    this._sync();
  }

  destroy() {
    if (this._destroyed) return;
    this.pause();
    this._destroyed = true;
    this._listeners.forEach(([target, event, listener]) => target.removeEventListener(event, listener));
    this._intersection?.disconnect();
    this._introObserver?.disconnect();
    if (this.motion.removeEventListener) this.motion.removeEventListener('change', this._onMotionChange);
    else this.motion.removeListener(this._onMotionChange);
  }

  _listen(target, event, listener) {
    if (!target) return;
    target.addEventListener(event, listener);
    this._listeners.push([target, event, listener]);
  }

  _reset(run) {
    this._cancelFrame();
    this._activeStep = 0;
    this._elapsed = 0;
    this._approved = false;
    this._requestedRunning = run;
    this._sync();
  }

  _inspect(step) {
    if (this._destroyed || !Number.isInteger(step) || step < 0 || step > 4) return;
    this._cancelFrame();
    this._activeStep = step;
    this._elapsed = 0;
    this._approved = false;
    this._requestedRunning = false;
    this._sync();
  }

  _canAnimate() {
    return this._visible && !this.document.hidden && !this.motion.matches
      && !this.document.documentElement.classList.contains('intro-running')
      && !this.document.documentElement.classList.contains('intro-leaving-portfolio');
  }

  _sync() {
    if (this._destroyed) return;
    const next = this._activeStep === 4 ? 'complete'
      : this._activeStep === 2 && !this._approved ? 'awaiting'
      : this._requestedRunning && this._canAnimate() ? 'running' : 'paused';
    this._state = next;
    if (next !== 'running') this._cancelFrame();
    else if (this._raf === null) {
      this._lastTime = this.view.performance.now();
      this._raf = this.view.requestAnimationFrame(this._tick);
    }
    this._render();
  }

  _cancelFrame() {
    if (this._raf !== null) this.view.cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _tick(now) {
    this._raf = null;
    if (this._destroyed || !this._canAnimate() || this._state !== 'running') {
      this._sync();
      return;
    }
    this._elapsed += Math.max(0, now - this._lastTime);
    this._lastTime = now;

    while (this._activeStep < 4 && this._elapsed >= this._durations[this._activeStep]) {
      this._elapsed -= this._durations[this._activeStep];
      this._activeStep += 1;
      if (this._activeStep === 2 || this._activeStep === 4) {
        this._elapsed = 0;
        this._requestedRunning = false;
        this._sync();
        return;
      }
      this._render();
    }
    this._renderProgress();
    this._raf = this.view.requestAnimationFrame(this._tick);
  }

  _renderProgress() {
    this.links.forEach((link, index) => {
      const progress = index < this._activeStep ? 1
        : index === this._activeStep ? Math.min(1, this._elapsed / this._durations[index]) : 0;
      link.style.setProperty('--progress', String(progress));
      link.classList.toggle('is-complete', progress === 1);
    });
  }

  _render() {
    this.root.dataset.flowState = this._state;
    this.root.dataset.activeStep = String(this._activeStep);
    this.steps.forEach((button) => {
      const step = Number(button.dataset.flowStep);
      const active = step === this._activeStep;
      button.setAttribute('aria-pressed', String(active));
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.dataset.state = active ? 'active' : step < this._activeStep ? 'complete' : 'upcoming';
      button.classList.toggle('is-active', active);
      button.classList.toggle('is-complete', step < this._activeStep);
    });
    if (this.description) this.description.textContent = this._descriptions[this._activeStep];

    const suffix = this._state === 'running' ? 'lecture'
      : this._state === 'awaiting' ? 'à vous de valider'
      : this._state === 'complete' ? 'fin du parcours'
      : this.motion.matches ? 'étape par étape' : 'en pause';
    if (this.status) this.status.textContent = `Parcours illustratif · ${suffix}`;

    const label = this._state === 'running' ? 'Mettre en pause'
      : this._state === 'awaiting' ? 'Valider la suite'
      : this._state === 'complete' ? 'Rejouer le parcours'
      : this.motion.matches ? 'Étape suivante' : this._elapsed ? 'Reprendre' : 'Lancer le parcours';
    const icon = this._state === 'running' ? 'pause'
      : this._state === 'awaiting' ? 'check'
      : this._state === 'complete' ? 'replay' : 'play';
    if (this.playLabel) this.playLabel.textContent = label;
    if (this.play) {
      this.play.setAttribute('aria-label', label);
      this.play.dataset.icon = icon;
      if (this.playImage) {
        this.playImage.dataset.icon = icon;
        const source = this.play.dataset[`flow${icon[0].toUpperCase()}${icon.slice(1)}Icon`];
        if (source && this.playImage.getAttribute('src') !== source) this.playImage.setAttribute('src', source);
        this.playImage.alt = '';
      }
    }
    this._renderProgress();
  }
}
