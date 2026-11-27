/* KODIWARAN — cart, menu and product rendering */
(() => {
  'use strict';

  // TODO: replace with your real WhatsApp number (country code + number, digits only)
  const WHATSAPP_NUMBER = '91XXXXXXXXXX';
  const STORE_KEY = 'kodiwaran-cart-v2';

  // TODO: replace sample items with your real products. Use one of these categories:
  // Skincare, Haircare, Serums, Lip Care. `href` (optional) links to a product detail page.
  const PRODUCTS = [
    { id: '101', cat: 'Skincare', name: 'Cold-Process Almond Milk Soap', price: 249, note: 'Handcrafted bath bar • 100g',
      img: 'https://images.unsplash.com/photo-1607006307137-b765446059d6?auto=format&fit=crop&w=700&q=80', href: 'products/almond-milk-soap.html' },
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

  /* ---------- Cart state: { id: { q: quantity, n: name, p: price } } ---------- */
  let cart = {};
  try { const raw = JSON.parse(localStorage.getItem(STORE_KEY)); if (raw && typeof raw === 'object') cart = raw; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((id) => {
    const it = cart[id];
    if (!it || !(it.q > 0) || typeof it.n !== 'string' || !isFinite(it.p)) delete cart[id];
  });
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {} };

  const els = {
    grid: $('#featuredGrid'), all: $('#allProductsGrid'), bar: $('#filterBar'), result: $('#resultCount'),
    count: $('#cartCount'), items: $('#cartItems'), total: $('#cartTotal'),
    drawer: $('#cartDrawer'), overlay: $('#overlay'), open: $('#cartOpenBtn'), close: $('#cartCloseBtn'),
    checkout: $('#checkoutBtn'), menuBtn: $('#menuToggleBtn'), nav: $('#navLinks')
  };

  /* ---------- Products ---------- */
  const card = (p, i) => {
    const link = (inner, cls) => p.href ? `<a ${cls ? `class="${cls}" ` : ''}href="${esc(p.href)}">${inner}</a>` : inner;
    const media = p.img
      ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" width="400" height="400" loading="lazy" decoding="async" />`
      : '<i class="fa-solid fa-leaf" aria-hidden="true"></i>';
    return `
      <article class="product-card reveal" style="--d:${(i % 6) * 90}ms">
        <div class="product-media">${link(media, 'media-link')}</div>
        <div class="product-body">
          <span class="tag">${esc(p.cat)}</span>
          <h3>${link(esc(p.name), 'card-link')}</h3>
          <p class="product-note">${esc(p.note)}</p>
          <div class="product-foot">
            <span class="price">${money(p.price)}</span>
            <button type="button" class="btn-secondary" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to bag">Add to bag</button>
          </div>
        </div>
      </article>`;
  };

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
      const it = cart[id]; total += it.p * it.q; qty += it.q;
      return `<div class="cart-item">
        <h4>${esc(it.n)}</h4><span class="line">${money(it.p * it.q)}</span>
        <div class="qty" role="group" aria-label="Quantity for ${esc(it.n)}">
          <button type="button" data-act="dec" data-id="${esc(id)}" aria-label="Decrease quantity">−</button>
          <span aria-live="polite">${it.q}</span>
          <button type="button" data-act="inc" data-id="${esc(id)}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="remove-btn" data-act="del" data-id="${esc(id)}" aria-label="Remove ${esc(it.n)}">Remove</button>
      </div>`;
    }).join('') : '<p class="empty">Your bag is empty. Add a product to get started.</p>';
    els.total.textContent = money(total);
    els.count.textContent = qty;
    els.checkout.disabled = !ids.length;
  }

  function change(id, delta) {
    const it = cart[id];
    if (!it) return;
    it.q = Math.min(99, it.q + delta);
    if (it.q <= 0) delete cart[id];
    save(); renderCart();
  }

  /* Add any product: { id, name, price } — also available to other pages as window.addToCart */
  function addItem(item) {
    const id = String(item && item.id || '');
    const name = String(item && item.name || '').slice(0, 120);
    const price = Number(item && item.price);
    if (!id || !name || !isFinite(price) || price < 0) return false;
    if (!cart[id]) cart[id] = { q: 0, n: name, p: price };
    cart[id].q = Math.min(99, cart[id].q + 1);
    save(); renderCart();
    els.count.classList.remove('bump'); void els.count.offsetWidth; els.count.classList.add('bump');
    return true;
  }
  window.addToCart = addItem;

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
    const lines = ids.map((id) => { const it = cart[id]; total += it.p * it.q; return `• ${it.n} × ${it.q} = ${money(it.p * it.q)}`; });
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
    if (add) { const p = PRODUCTS.find((x) => x.id === add.dataset.add); if (p) addItem(p); return; }
    const one = e.target.closest('[data-item-id]');   // detail pages: data-item-id / -name / -price
    if (one) { addItem({ id: one.dataset.itemId, name: one.dataset.itemName, price: one.dataset.itemPrice }); return; }
    const act = e.target.closest('[data-act]');
    if (act) change(act.dataset.id, act.dataset.act === 'inc' ? 1 : act.dataset.act === 'dec' ? -1 : -99);
  });
  els.open.addEventListener('click', openCart);
  els.close.addEventListener('click', closeCart);
  els.overlay.addEventListener('click', closeCart);
  els.checkout.addEventListener('click', checkout);
  els.menuBtn.addEventListener('click', () => setMenu(!els.nav.classList.contains('open')));
  els.nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('resize', () => { if (innerWidth >= 768) setMenu(false); });

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (isCartOpen()) closeCart(); else setMenu(false); }
    if (e.key === 'Tab' && isCartOpen()) {
      const f = [...els.drawer.querySelectorAll('button:not(:disabled),a[href]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('storage', (e) => {
    if (e.key !== STORE_KEY) return;
    try { cart = JSON.parse(e.newValue) || {}; } catch (err) { cart = {}; }
    renderCart();
  });

  renderProducts();
  renderAll();
  renderCart();
})();
