/* KODIWARAN — cart, menu and product rendering */
(() => {
  'use strict';

  // TODO: replace with your real WhatsApp number (country code + number, digits only)
  const WHATSAPP_NUMBER = '91XXXXXXXXXX';
  const STORE_KEY = 'kodiwaran-cart-v1';

  // TODO: replace with your real products (img can be a file path, e.g. 'images/face-pack.jpg')
  const PRODUCTS = [
    { id: 'p1', name: 'Herbal Face Pack',   price: 249, note: 'Sandalwood & turmeric', img: '' },
    { id: 'p2', name: 'Hair Growth Oil',    price: 349, note: 'Cold-pressed herbal oil', img: '' },
    { id: 'p3', name: 'Aloe Body Butter',   price: 299, note: 'Aloe & shea', img: '' },
    { id: 'p4', name: 'Rose Lip Balm',      price: 149, note: 'Beeswax & rose', img: '' }
  ];

  const $ = (s) => document.querySelector(s);
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------- Cart state ---------- */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((id) => { if (!byId(id) || !(cart[id] > 0)) delete cart[id]; });
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {} };

  const els = {
    grid: $('#featuredGrid'), count: $('#cartCount'), items: $('#cartItems'), total: $('#cartTotal'),
    drawer: $('#cartDrawer'), overlay: $('#overlay'), open: $('#cartOpenBtn'), close: $('#cartCloseBtn'),
    checkout: $('#checkoutBtn'), menuBtn: $('#menuToggleBtn'), nav: $('#navLinks')
  };

  /* ---------- Products ---------- */
  function renderProducts() {
    if (!els.grid) return;
    els.grid.innerHTML = PRODUCTS.map((p, i) => `
      <article class="product-card reveal" style="--d:${i * 90}ms">
        <div class="product-media">${p.img
          ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" width="400" height="400" loading="lazy" decoding="async" />`
          : '<i class="fa-solid fa-leaf" aria-hidden="true"></i>'}</div>
        <div class="product-body">
          <h3>${esc(p.name)}</h3>
          <p class="product-note">${esc(p.note)}</p>
          <div class="product-foot">
            <span class="price">${money(p.price)}</span>
            <button type="button" class="btn-secondary" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">Add to bag</button>
          </div>
        </div>
      </article>`).join('');
  }

  /* ---------- Cart UI ---------- */
  function renderCart() {
    const ids = Object.keys(cart);
    let total = 0, qty = 0;
    els.items.innerHTML = ids.length ? ids.map((id) => {
      const p = byId(id), q = cart[id]; total += p.price * q; qty += q;
      return `<div class="cart-item">
        <h4>${esc(p.name)}</h4><span class="line">${money(p.price * q)}</span>
        <div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}">
          <button type="button" data-act="dec" data-id="${esc(id)}" aria-label="Decrease quantity">−</button>
          <span aria-live="polite">${q}</span>
          <button type="button" data-act="inc" data-id="${esc(id)}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="remove-btn" data-act="del" data-id="${esc(id)}" aria-label="Remove ${esc(p.name)}">Remove</button>
      </div>`;
    }).join('') : '<p class="empty">Your bag is empty. Add a product to get started.</p>';
    els.total.textContent = money(total);
    els.count.textContent = qty;
    els.checkout.disabled = !ids.length;
  }

  function change(id, delta) {
    if (!byId(id)) return;
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    if (cart[id] > 99) cart[id] = 99;
    save(); renderCart();
  }

  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    els.drawer.classList.add('open'); els.overlay.classList.add('show');
    document.body.classList.add('lock'); els.open.setAttribute('aria-expanded', 'true');
    setTimeout(() => els.close.focus(), 50);
  }
  function closeCart() {
    els.drawer.classList.remove('open'); els.overlay.classList.remove('show');
    document.body.classList.remove('lock'); els.open.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  const isCartOpen = () => els.drawer.classList.contains('open');

  function checkout() {
    const ids = Object.keys(cart);
    if (!ids.length) return;
    let total = 0;
    const lines = ids.map((id) => { const p = byId(id), q = cart[id]; total += p.price * q; return `• ${p.name} × ${q} = ${money(p.price * q)}`; });
    const msg = `Hello KODIWARAN, I'd like to order:\n${lines.join('\n')}\nTotal: ${money(total)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    els.nav.classList.toggle('open', open);
    els.menuBtn.setAttribute('aria-expanded', String(open));
    els.menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    els.menuBtn.firstElementChild.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      change(add.dataset.add, 1);
      els.count.classList.remove('bump'); void els.count.offsetWidth; els.count.classList.add('bump');
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) change(act.dataset.id, act.dataset.act === 'inc' ? 1 : act.dataset.act === 'dec' ? -1 : -(cart[act.dataset.id] || 0));
  });
  els.open.addEventListener('click', openCart);
  els.close.addEventListener('click', closeCart);
  els.overlay.addEventListener('click', closeCart);
  els.checkout.addEventListener('click', checkout);
  els.menuBtn.addEventListener('click', () => setMenu(!els.nav.classList.contains('open')));
  els.nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('resize', () => { if (innerWidth >= 768) setMenu(false); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (isCartOpen()) closeCart(); else setMenu(false); }
    if (e.key === 'Tab' && isCartOpen()) {           // keep focus inside the drawer
      const f = [...els.drawer.querySelectorAll('button:not(:disabled),a[href]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('storage', (e) => {        // keep tabs in sync
    if (e.key !== STORE_KEY) return;
    try { cart = JSON.parse(e.newValue) || {}; } catch (err) { cart = {}; }
    renderCart();
  });

  renderProducts();
  renderCart();
})();


/* KODIWARAN — cart, menu and product rendering */
(() => {
  'use strict';

  // TODO: replace with your real WhatsApp number (country code + number, digits only)
  const WHATSAPP_NUMBER = '91XXXXXXXXXX';
  const STORE_KEY = 'kodiwaran-cart-v1';

  // TODO: replace with your real products (img can be a file path, e.g. 'images/face-pack.jpg')
  const PRODUCTS = [
    { id: 'p1', cat: 'Skincare', name: 'Herbal Face Pack',  price: 249, note: 'Sandalwood & turmeric', img: '' },
    { id: 'p2', cat: 'Haircare', name: 'Hair Growth Oil',   price: 349, note: 'Cold-pressed herbal oil', img: '' },
    { id: 'p3', cat: 'Skincare', name: 'Aloe Body Butter',  price: 299, note: 'Aloe & shea', img: '' },
    { id: 'p4', cat: 'Lip Care', name: 'Rose Lip Balm',     price: 149, note: 'Beeswax & rose', img: '' },
    { id: 'p5', cat: 'Serums',   name: 'Vitamin C Serum',   price: 449, note: 'Amla & orange peel', img: '' },
    { id: 'p6', cat: 'Haircare', name: 'Herbal Hair Mask',  price: 399, note: 'Hibiscus & fenugreek', img: '' }
  ];

  const $ = (s) => document.querySelector(s);
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------- Cart state ---------- */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((id) => { if (!byId(id) || !(cart[id] > 0)) delete cart[id]; });
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {} };

  const els = {
    grid: $('#featuredGrid'), all: $('#allProductsGrid'), bar: $('#filterBar'), result: $('#resultCount'), count: $('#cartCount'), items: $('#cartItems'), total: $('#cartTotal'),
    drawer: $('#cartDrawer'), overlay: $('#overlay'), open: $('#cartOpenBtn'), close: $('#cartCloseBtn'),
    checkout: $('#checkoutBtn'), menuBtn: $('#menuToggleBtn'), nav: $('#navLinks')
  };

  /* ---------- Products ---------- */
  const card = (p, i) => `
      <article class="product-card reveal" style="--d:${(i % 6) * 90}ms">
        <div class="product-media">${p.img
          ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" width="400" height="400" loading="lazy" decoding="async" />`
          : '<i class="fa-solid fa-leaf" aria-hidden="true"></i>'}</div>
        <div class="product-body">
          <span class="tag">${esc(p.cat)}</span>
          <h3>${esc(p.name)}</h3>
          <p class="product-note">${esc(p.note)}</p>
          <div class="product-foot">
            <span class="price">${money(p.price)}</span>
            <button type="button" class="btn-secondary" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">Add to bag</button>
          </div>
        </div>
      </article>`;

  function renderProducts() {
    if (els.grid) els.grid.innerHTML = PRODUCTS.slice(0, 4).map(card).join('');
  }

  let filter = 'All';
  function renderAll() {
    if (!els.all) return;
    const list = filter === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === filter);
    els.all.innerHTML = list.length ? list.map(card).join('') : '<p class="empty">No products in this category yet.</p>';
    if (els.result) els.result.textContent = `${list.length} product${list.length === 1 ? '' : 's'} shown`;
    if (window.KodiFx) window.KodiFx.refresh();
  }

  /* ---------- Cart UI ---------- */
  function renderCart() {
    const ids = Object.keys(cart);
    let total = 0, qty = 0;
    els.items.innerHTML = ids.length ? ids.map((id) => {
      const p = byId(id), q = cart[id]; total += p.price * q; qty += q;
      return `<div class="cart-item">
        <h4>${esc(p.name)}</h4><span class="line">${money(p.price * q)}</span>
        <div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}">
          <button type="button" data-act="dec" data-id="${esc(id)}" aria-label="Decrease quantity">−</button>
          <span aria-live="polite">${q}</span>
          <button type="button" data-act="inc" data-id="${esc(id)}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="remove-btn" data-act="del" data-id="${esc(id)}" aria-label="Remove ${esc(p.name)}">Remove</button>
      </div>`;
    }).join('') : '<p class="empty">Your bag is empty. Add a product to get started.</p>';
    els.total.textContent = money(total);
    els.count.textContent = qty;
    els.checkout.disabled = !ids.length;
  }

  function change(id, delta) {
    if (!byId(id)) return;
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    if (cart[id] > 99) cart[id] = 99;
    save(); renderCart();
  }

  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    els.drawer.classList.add('open'); els.overlay.classList.add('show');
    document.body.classList.add('lock'); els.open.setAttribute('aria-expanded', 'true');
    setTimeout(() => els.close.focus(), 50);
  }
  function closeCart() {
    els.drawer.classList.remove('open'); els.overlay.classList.remove('show');
    document.body.classList.remove('lock'); els.open.setAttribute('aria-expanded', 'false');
    if (lastFocus) lastFocus.focus();
  }
  const isCartOpen = () => els.drawer.classList.contains('open');

  function checkout() {
    const ids = Object.keys(cart);
    if (!ids.length) return;
    let total = 0;
    const lines = ids.map((id) => { const p = byId(id), q = cart[id]; total += p.price * q; return `• ${p.name} × ${q} = ${money(p.price * q)}`; });
    const msg = `Hello KODIWARAN, I'd like to order:\n${lines.join('\n')}\nTotal: ${money(total)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    els.nav.classList.toggle('open', open);
    els.menuBtn.setAttribute('aria-expanded', String(open));
    els.menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    els.menuBtn.firstElementChild.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      change(add.dataset.add, 1);
      els.count.classList.remove('bump'); void els.count.offsetWidth; els.count.classList.add('bump');
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) change(act.dataset.id, act.dataset.act === 'inc' ? 1 : act.dataset.act === 'dec' ? -1 : -(cart[act.dataset.id] || 0));
  });
  els.open.addEventListener('click', openCart);
  els.close.addEventListener('click', closeCart);
  els.overlay.addEventListener('click', closeCart);
  els.checkout.addEventListener('click', checkout);
  els.menuBtn.addEventListener('click', () => setMenu(!els.nav.classList.contains('open')));
  els.nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('resize', () => { if (innerWidth >= 768) setMenu(false); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (isCartOpen()) closeCart(); else setMenu(false); }
    if (e.key === 'Tab' && isCartOpen()) {           // keep focus inside the drawer
      const f = [...els.drawer.querySelectorAll('button:not(:disabled),a[href]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('storage', (e) => {        // keep tabs in sync
    if (e.key !== STORE_KEY) return;
    try { cart = JSON.parse(e.newValue) || {}; } catch (err) { cart = {}; }
    renderCart();
  });

  if (els.bar) els.bar.addEventListener('click', (e) => {
    const b = e.target.closest('.filter-btn');
    if (!b) return;
    filter = b.dataset.category;
    els.bar.querySelectorAll('.filter-btn').forEach((x) => {
      const on = x === b;
      x.classList.toggle('active', on);
      x.setAttribute('aria-pressed', String(on));
    });
    renderAll();
  });

  renderProducts();
  renderAll();
  renderCart();
})();

