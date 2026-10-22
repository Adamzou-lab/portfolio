// Le contenu reste visible et utilisable si JavaScript ou les animations sont absents.
const page = document.querySelector('.information-page');

if (page) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forcedReduction = new URLSearchParams(location.search).get('reduit') === '1';
  const animations = new Set();
  const reduced = () => forcedReduction || preference.matches;
  let observer;

  function settle() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }

  function syncPreference() {
    page.classList.toggle('information-reduced-motion', reduced());
    if (reduced()) {
      observer?.disconnect();
      settle();
    }
  }

  syncPreference();

  if (!reduced() && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
    observer = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reduced() || document.hidden) continue;

        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], {
          duration: 640,
          delay: Math.min(order++, 3) * 55,
          easing: 'cubic-bezier(.22,.75,.22,1)',
          fill: 'backwards',
        });
        animations.add(animation);
        animation.finished.catch(() => {}).finally(() => animations.delete(animation));
      }
    }, { threshold: 0.08 });

    page.querySelectorAll('[data-reveal]').forEach(element => {
      // Une section déjà animée emporte ses enfants avec elle.
      if (!element.parentElement.closest('[data-reveal]')) observer.observe(element);
    });
  }

  preference.addEventListener('change', syncPreference);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) settle();
  });
  window.addEventListener('pagehide', () => {
    observer?.disconnect();
    settle();
  });

  // La barre de navigation reste fixe ; son fond n’apparaît qu’une fois la page défilée.
  const header = page.querySelector('.site-header');
  if (header) {
    const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
    window.addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
  }
}
