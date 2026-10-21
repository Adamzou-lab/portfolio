import { AtelierFlow } from './atelier-flow.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const body = document.body;
const portfolio = document.querySelector('.portfolio');
const flowRoot = document.querySelector('[data-flow]');
const flow = flowRoot ? new AtelierFlow(flowRoot) : null;
const projects = [...document.querySelectorAll('.project')];
const animations = new WeakMap();

// Les pages communes conservent la version du portfolio depuis laquelle on les ouvre.
if ((body.classList.contains('page-about') || body.classList.contains('page-contact'))
    && new URLSearchParams(location.search).get('vue') === 'traversee') {
  const destinations = new Map([
    ['index.html', 'traversee.html'],
    ['index.html#projets', 'traversee.html#chapitres'],
    ['about.html', 'about.html?vue=traversee'],
    ['contact.html', 'contact.html?vue=traversee'],
  ]);
  document.querySelectorAll('a[href]').forEach(link => {
    const destination = destinations.get(link.getAttribute('href'));
    if (destination) link.setAttribute('href', destination);
  });
}

// La page n'entre en scène qu'après le blanc de l'introduction.
if (body.classList.contains('atelier-home')) body.classList.add('motion-ready');
function syncIntro() {
  const hidden = root.classList.contains('intro-running') || root.classList.contains('intro-leaving-portfolio');
  if (portfolio) portfolio.inert = hidden;
  body.classList.toggle('is-revealed', !hidden);
}
syncIntro();
const introObserver = new MutationObserver(syncIntro);
introObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

// Les dossiers restent de vrais <details> : utilisables même sans JavaScript.
function animateProject(project, open) {
  project.dataset.expanded = String(open);
  const panel = project.querySelector('.project-body');
  const previous = animations.get(project);
  const from = project.open ? panel.getBoundingClientRect().height : 0;
  previous?.cancel();
  if (open) project.open = true;
  if (reduce.matches || !panel.animate) {
    project.open = open;
    panel.style.height = '';
    return;
  }
  const to = open ? panel.scrollHeight : 0;
  const animation = panel.animate(
    [{ height: from + 'px', opacity: open && from === 0 ? 0 : 1 }, { height: to + 'px', opacity: open ? 1 : 0 }],
    { duration: 460, easing: 'cubic-bezier(.22,.75,.22,1)' }
  );
  animations.set(project, animation);
  animation.onfinish = () => {
    if (animations.get(project) !== animation) return;
    project.open = open;
    animations.delete(project);
  };
}
function selectProject(project, { open = true, navigate = true, scroll = false } = {}) {
  projects.forEach(other => {
    if (other !== project && other.open) animateProject(other, false);
  });
  animateProject(project, open);
  if (navigate) {
    history.pushState(null, '', open ? '#' + project.id : '#projets');
  }
  if (scroll) project.scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth', block: 'start' });
}
projects.forEach(project => {
  const summary = project.querySelector('summary');
  summary.addEventListener('click', event => {
    event.preventDefault();
    const intendedOpen = project.dataset.expanded === undefined ? project.open : project.dataset.expanded === 'true';
    selectProject(project, { open: !intendedOpen });
  });
  project.querySelector('[data-close-project]')?.addEventListener('click', () => {
    selectProject(project, { open: false });
    summary.focus({ preventScroll: true });
    project.scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth', block: 'start' });
  });
  project.addEventListener('keydown', event => {
    if (event.key === 'Escape' && project.open) {
      selectProject(project, { open: false });
      summary.focus({ preventScroll: true });
    }
  });
});
document.querySelectorAll('[data-open-project]').forEach(link => {
  link.addEventListener('click', event => {
    const project = projects.find(p => p.id === link.dataset.openProject);
    if (!project) return;
    event.preventDefault();
    selectProject(project, { scroll: true });
    project.querySelector('summary').focus({ preventScroll: true });
  });
});
function restoreProject() {
  const current = projects.find(p => '#' + p.id === location.hash);
  projects.forEach(project => {
    animations.get(project)?.cancel();
    project.open = project === current;
    project.dataset.expanded = String(project === current);
  });
}
restoreProject();
function stopReducedAnimations() {
  if (!reduce.matches) return;
  projects.forEach(project => {
    animations.get(project)?.cancel();
    animations.delete(project);
    project.open = project.dataset.expanded === 'true';
  });
}
reduce.addEventListener('change', stopReducedAnimations);
window.addEventListener('popstate', restoreProject);
window.addEventListener('hashchange', restoreProject);
window.addEventListener('pageshow', syncIntro);
window.addEventListener('pagehide', event => {
  if (!event.persisted) {
    flow?.destroy();
    reduce.removeEventListener('change', stopReducedAnimations);
    introObserver.disconnect();
    projects.forEach(p => animations.get(p)?.cancel());
  }
});
