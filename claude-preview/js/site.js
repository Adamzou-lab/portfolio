/* Comportements communs : langue FR/EN, copie de l'e-mail, en-tête au défilement, sommaire des pages POC. */
(() => {
  'use strict';
  const root = document.documentElement;

  /* ----- Langue ----- */
  function setLang(lang, save) {
    root.dataset.lang = lang;
    root.lang = lang;
    const title = lang === 'en' ? root.dataset.titleEn : root.dataset.titleFr;
    if (title) document.title = title;
    document.querySelectorAll('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
    document.querySelectorAll('[data-aria-fr]').forEach((el) => el.setAttribute('aria-label', lang === 'en' ? el.dataset.ariaEn : el.dataset.ariaFr));
    if (save) { try { localStorage.setItem('az-lang', lang); } catch (e) { /* stockage indisponible */ } }
  }
  setLang(root.dataset.lang === 'en' ? 'en' : 'fr', false);
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-set-lang]');
    if (b) setLang(b.dataset.setLang, true);
  });

  /* ----- Copier l'e-mail ----- */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
      if (!ok) {
        // repli : on sélectionne l'adresse pour un Cmd/Ctrl + C manuel
        const target = document.querySelector(btn.dataset.copyTarget || '');
        if (target) {
          const r = document.createRange(); r.selectNodeContents(target);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        }
        return;
      }
      btn.classList.add('is-done');
      window.setTimeout(() => btn.classList.remove('is-done'), 1800);
    });
  });

  /* ----- En-tête : filet au défilement ----- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----- Sommaire des pages POC : section en cours ----- */
  const tocLinks = [...document.querySelectorAll('.toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.remove('is-active'));
        const a = byId.get(en.target.id); if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
})();
