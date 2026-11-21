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
      document.documentElement.style.setProperty('--sy', scrollY);
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

  /* 3D tilt on cards and hero (mouse only) */
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.feature-card,.product-card,.hero-visual').forEach((el) => {
      const max = el.classList.contains('hero-visual') ? 7 : 9;
      el.classList.add('tilt');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - 0.5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* Add-to-bag: small dot flies to the bag icon */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]'), target = document.getElementById('cartOpenBtn');
    if (!btn || !target || reduce) return;
    const a = btn.getBoundingClientRect(), c = target.getBoundingClientRect();
    const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
    const dot = document.createElement('span');
    dot.className = 'fly-dot'; dot.style.left = sx - 8 + 'px'; dot.style.top = sy - 8 + 'px';
    document.body.append(dot);
    const dx = c.left + c.width / 2 - sx, dy = c.top + c.height / 2 - sy;
    dot.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 40}px) scale(.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0.3 }
    ], { duration: 750, easing: 'cubic-bezier(.45,0,.2,1)' }).onfinish = () => dot.remove();
  });

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
