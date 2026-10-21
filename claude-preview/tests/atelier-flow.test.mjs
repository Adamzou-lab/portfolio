import test from 'node:test';
import assert from 'node:assert/strict';
import { AtelierFlow } from '../js/atelier-flow.js';

function fixture({ reduced = false, intro = false } = {}) {
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(name, handler) {
      const listeners = this.listeners.get(name) || new Set();
      listeners.add(handler);
      this.listeners.set(name, listeners);
    }
    removeEventListener(name, handler) { this.listeners.get(name)?.delete(handler); }
    emit(name) { this.listeners.get(name)?.forEach((handler) => handler()); }
  }
  class Element extends Target {
    constructor() {
      super();
      this.dataset = {};
      this.attributes = new Map();
      const classes = new Set();
      this.classList = {
        contains: (name) => classes.has(name),
        toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); },
      };
      this.styles = new Map();
      this.style = { setProperty: (name, value) => this.styles.set(name, value) };
    }
    setAttribute(name, value) { this.attributes.set(name, value); }
    getAttribute(name) { return this.attributes.get(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    querySelector() { return null; }
  }
  const document = new Target();
  document.hidden = false;
  document.documentElement = new Element();
  document.documentElement.classList.toggle('intro-running', intro);
  const root = new Element();
  root.ownerDocument = document;
  const steps = Array.from({ length: 5 }, (_, index) => {
    const step = new Element();
    step.dataset.flowStep = String(index);
    return step;
  });
  const links = Array.from({ length: 4 }, () => new Element());
  const elements = Object.fromEntries(['description', 'status', 'play', 'play-label', 'restart'].map((name) => [name, new Element()]));
  root.querySelectorAll = (selector) => selector === '[data-flow-step]' ? steps : links;
  root.querySelector = (selector) => elements[selector.slice(11, -1)] ?? null;
  const motion = new Target();
  motion.matches = reduced;
  let clock = 0;
  let frameID = 0;
  const frames = new Map();
  let intersection;
  let mutation;
  document.defaultView = {
    performance: { now: () => clock },
    matchMedia: () => motion,
    requestAnimationFrame: (handler) => { frames.set(++frameID, handler); return frameID; },
    cancelAnimationFrame: (id) => frames.delete(id),
    IntersectionObserver: class {
      constructor(handler) { this.handler = handler; intersection = this; }
      observe() {}
      disconnect() { this.disconnected = true; }
    },
    MutationObserver: class {
      constructor(handler) { this.handler = handler; mutation = this; }
      observe() {}
      disconnect() { this.disconnected = true; }
    },
  };
  const flow = new AtelierFlow(root);
  return {
    flow, root, document, steps, links, elements, motion, frames,
    visible(on) { intersection.handler([{ target: root, isIntersecting: on }]); },
    intro(on) { document.documentElement.classList.toggle('intro-running', on); mutation.handler(); },
    leavingPortfolio(on) { document.documentElement.classList.toggle('intro-leaving-portfolio', on); mutation.handler(); },
    hidden(on) { document.hidden = on; document.emit('visibilitychange'); },
    tick(ms) {
      clock += ms;
      const current = [...frames.values()];
      frames.clear();
      current.forEach((handler) => handler(clock));
    },
    get observersDisconnected() { return intersection.disconnected && mutation.disconnected; },
  };
}

test('attend la fin de l’intro et la visibilité avant de démarrer', () => {
  const scene = fixture({ intro: true });
  assert.equal(scene.flow.state, 'paused');
  assert.equal(scene.frames.size, 0);
  scene.visible(true);
  assert.equal(scene.frames.size, 0);
  scene.intro(false);
  assert.equal(scene.flow.state, 'running');
  scene.tick(600);
  assert.equal(Number(scene.links[0].styles.get('--progress')), 0.5);
  scene.hidden(true);
  assert.equal(scene.flow.state, 'paused');
  scene.tick(60000);
  scene.hidden(false);
  scene.tick(600);
  assert.equal(scene.flow.activeStep, 1);
  scene.leavingPortfolio(true);
  assert.equal(scene.flow.state, 'paused');
  scene.tick(380);
  assert.equal(Number(scene.links[1].styles.get('--progress')), 0);
  scene.intro(true);
  scene.leavingPortfolio(false);
  assert.equal(scene.frames.size, 0);
  scene.intro(false);
  scene.tick(700);
  assert.equal(Number(scene.links[1].styles.get('--progress')), 0.5);
  scene.flow.destroy();
});

test('la validation humaine bloque le parcours même après un grand intervalle', () => {
  const scene = fixture();
  scene.visible(true);
  scene.tick(20000);
  assert.equal(scene.flow.activeStep, 2);
  assert.equal(scene.flow.state, 'awaiting');
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.elements['play-label'].textContent, 'Valider la suite');
  assert.deepEqual(scene.links.map((link) => Number(link.styles.get('--progress'))), [1, 1, 0, 0]);
  scene.elements.play.emit('click');
  assert.equal(scene.flow.state, 'running');
  scene.tick(450);
  assert.equal(scene.flow.activeStep, 3);
  scene.tick(1200);
  assert.equal(scene.flow.state, 'complete');
  assert.equal(scene.flow.activeStep, 4);
  assert.equal(scene.frames.size, 0);
  scene.elements.play.emit('click');
  assert.equal(scene.flow.activeStep, 0);
  assert.equal(scene.flow.state, 'running');
  scene.flow.destroy();
});

test('la réduction des animations conserve les étapes et la validation sans RAF', () => {
  const scene = fixture({ reduced: true });
  scene.visible(true);
  assert.equal(scene.flow.state, 'paused');
  assert.equal(scene.elements['play-label'].textContent, 'Étape suivante');
  scene.elements.play.emit('click');
  assert.equal(scene.flow.activeStep, 1);
  scene.elements.play.emit('click');
  assert.equal(scene.flow.state, 'awaiting');
  scene.elements.play.emit('click');
  assert.equal(scene.flow.activeStep, 3);
  assert.equal(scene.flow.state, 'paused');
  scene.elements.play.emit('click');
  assert.equal(scene.flow.state, 'complete');
  assert.equal(scene.frames.size, 0);
  scene.elements.restart.emit('click');
  assert.equal(scene.flow.activeStep, 0);
  assert.equal(scene.flow.state, 'paused');
  scene.flow.destroy();
});

test('une pause volontaire persiste au retour à l’écran et destroy nettoie les événements', () => {
  const scene = fixture();
  scene.visible(true);
  scene.tick(400);
  scene.flow.pause();
  scene.visible(false);
  scene.visible(true);
  assert.equal(scene.flow.state, 'paused');
  assert.equal(scene.frames.size, 0);
  scene.steps[3].emit('click');
  assert.equal(scene.flow.activeStep, 3);
  assert.equal(scene.steps[3].getAttribute('aria-pressed'), 'true');
  scene.flow.start();
  scene.flow.destroy();
  assert.equal(scene.frames.size, 0);
  assert.equal(scene.observersDisconnected, true);
  scene.steps[0].emit('click');
  assert.equal(scene.flow.activeStep, 3);
  scene.flow.start();
  assert.equal(scene.frames.size, 0);
});
