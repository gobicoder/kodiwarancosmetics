/* KODIWARAN — scroll progress, reveal-on-scroll, headline entrance */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.getElementById('scrollProgress');
  const nav = document.getElementById('navbar');

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty('--p', h > 0 ? Math.min(scrollY / h, 1) : 0);
      if (nav) nav.classList.toggle('scrolled', scrollY > 8);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!reduce) {
    document.querySelectorAll('[data-split]').forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.textContent = '';
      text.split(/\s+/).forEach((w, i) => {
        const s = document.createElement('span');
        s.className = 'word'; s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--i', i); s.textContent = w;
        el.append(s, ' ');
      });
    });
  }

  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  items.forEach((el) => io.observe(el));
})();
