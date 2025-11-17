/* shop-main.js
   Consolidated & improved site JS
   - jQuery inline search (if present)
   - listing filters & navigation
   - product page populate & interactions
   - cart render + actions
   - progressive server-sync: if /api endpoints present it will attempt AJAX sync (jQuery or fetch)
   - defensive, accessible, and documented
*/

/* -------------------------
   Helpers
   ------------------------- */
const App = (function () {
  'use strict';

  function qs(selector) { return document.querySelector(selector); }
  function qsa(selector) { return Array.from(document.querySelectorAll(selector)); }
  function isJQ() { return typeof window.jQuery !== 'undefined'; }
  function money(v, currencySign = '$') { return currencySign + (Number(v) || 0).toFixed(2); }
  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
  function nowIso() { return new Date().toISOString(); }

  // Basic server-sync helper: prefers jQuery.ajax if available, falls back to fetch
  async function serverRequest({ url, method = 'GET', json = null }) {
    const cfg = { method: method.toUpperCase(), headers: {} };
    if (json !== null) {
      cfg.headers['Content-Type'] = 'application/json';
      cfg.body = JSON.stringify(json);
    }

    // CSRF token support: read from window.CSRF_TOKEN if present
    if (window.CSRF_TOKEN) cfg.headers['X-CSRF-Token'] = window.CSRF_TOKEN;

    if (isJQ()) {
      // jQuery path: wrap in Promise
      return new Promise((resolve, reject) => {
        window.jQuery.ajax({
          url, method: cfg.method, data: cfg.body, contentType: cfg.headers['Content-Type'] || undefined,
          headers: cfg.headers,
          success: (res) => resolve(res),
          error: (xhr, status, err) => { reject({ xhr, status, err }); }
        });
      });
    }

    // fetch path
    try {
      const r = await fetch(url, cfg);
      const text = await r.text();
      try { return JSON.parse(text); } catch (e) { return text; }
    } catch (err) { throw err; }
  }

  /* -------------------------
     jQuery inline search (graceful)
     ------------------------- */
  function initJQuerySearch() {
    if (!isJQ()) { console.warn('jQuery not found — inline search skipped.'); return; }
    const $ = window.jQuery;
    const productsList = [
      'Gradient Graphic T-shirt','Polo with Tipping Details','Black Striped T-shirt','Checked shirt',
      'Skinny fit jeans','Courage Graphic T-shirt','Loose Fit Bermuda Shorts','Faded Skinny Jeans','Classic Polo Shirt'
    ];
    const $input = $('#search-bar');
    const $results = $('#search-results');
    if (!$input.length || !$results.length) return;

    $input.on('input', function () {
      const q = $(this).val().trim().toLowerCase();
      if (q.length < 2) { $results.hide(); return; }
      const matches = productsList.filter(p => p.toLowerCase().includes(q)).slice(0, 10);
      if (matches.length === 0) $results.html('<div class="result-empty" style="padding:8px;">No results</div>').show();
      else $results.html(matches.map(m => `<div class="result-item" role="option" tabindex="0" style="padding:8px;cursor:pointer">${m}</div>`).join('')).show();
    });

    $results.on('click', '.result-item', function () { const text = $(this).text().trim(); window.location.href = 'category.html?search=' + encodeURIComponent(text); });
    $results.on('keydown', '.result-item', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(this).trigger('click'); } });

    $input.on('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); const q = $(this).val().trim(); if (q.length >= 1) window.location.href = 'category.html?search=' + encodeURIComponent(q); } });

    $(document).on('click', function (e) { if (!$(e.target).closest('#search-bar, #search-results').length) $results.hide(); });

    // populate from query (category page scenario)
    (function populateFromQuery() { const params = new URLSearchParams(window.location.search); const q = params.get('search'); if (!q) return; if ($input && $input.length) { $input.val(q); $input.trigger('input'); } })();

    console.debug('Inline search initialized.');
  }

  /* -------------------------
     Listing page filters & listing->product navigation
     ------------------------- */
  function initListingAndNav() {
    const categoryLinks = qsa('.filter-category');
    const styleLinks = qsa('.filter-style');
    const slider = qs('#range');
    const value = qs('#value');
    const colorSwatches = qsa('.color img, .color .color-swatch, .color button, .color .color-swatch img');
    const sizeButtons = qsa('.size-btn');
    const resetBtn = qs('#resetFilters');
    const products = qsa('.tselling1');

    let selectedCategory = 'all';
    let selectedStyles = new Set();
    let selectedColors = new Set();
    let selectedSizes = new Set();
    let maxPrice = slider ? parseInt(slider.value || slider.getAttribute('value') || slider.max || 'Infinity', 10) : Infinity;
    if (value && slider) value.textContent = slider.value;

    const parseListAttr = raw => { if (!raw) return []; return String(raw).split(',').map(s => s.trim().toLowerCase()).filter(Boolean); };

    function filterProducts() {
      if (!products || products.length === 0) return;
      products.forEach(prod => {
        const price = parseInt(prod.dataset.price || (prod.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0'), 10) || 0;
        const prodCategory = (prod.dataset.category || '').toLowerCase();
        const prodStyles = parseListAttr(prod.dataset.styles || prod.dataset.style);
        const prodColors = parseListAttr(prod.dataset.colors || prod.dataset.color);
        const prodSizes = parseListAttr(prod.dataset.sizes || prod.dataset.size);

        const categoryMatch = (selectedCategory === 'all') || (prodCategory === selectedCategory);
        const priceMatch = isFinite(maxPrice) ? (price <= maxPrice) : true;

        let styleMatch = true; if (selectedStyles.size > 0) styleMatch = prodStyles.some(st => selectedStyles.has(st));
        let colorMatch = true; if (selectedColors.size > 0) colorMatch = prodColors.some(c => selectedColors.has(c));
        let sizeMatch = true; if (selectedSizes.size > 0) sizeMatch = prodSizes.some(s => selectedSizes.has(s));

        prod.style.display = (categoryMatch && priceMatch && styleMatch && colorMatch && sizeMatch) ? '' : 'none';
      });
    }

    window.filterProducts = filterProducts; // useful for debugging

    categoryLinks.forEach(link => { link.addEventListener('click', e => { e.preventDefault(); selectedCategory = (link.dataset.category || 'all').toLowerCase(); categoryLinks.forEach(l => l.classList.remove('active-category')); link.classList.add('active-category'); filterProducts(); }); });

    styleLinks.forEach(link => { link.addEventListener('click', e => { e.preventDefault(); const st = (link.dataset.style || '').toLowerCase(); if (!st) return; selectedStyles.clear(); selectedStyles.add(st); styleLinks.forEach(l => l.classList.remove('active-style')); link.classList.add('active-style'); filterProducts(); }); });

    if (slider) slider.addEventListener('input', function () { maxPrice = parseInt(this.value, 10) || Infinity; if (value) value.textContent = this.value; filterProducts(); });

    colorSwatches.forEach(swatch => {
      let col = (swatch.dataset && swatch.dataset.color) ? swatch.dataset.color : (swatch.getAttribute('alt') || swatch.getAttribute('title') || '');
      col = String(col).toLowerCase().trim();
      if (!col && swatch.closest) col = (swatch.closest('button')?.dataset?.color || '').toLowerCase();
      if (!col) return;
      if (!swatch.hasAttribute('role')) swatch.setAttribute('role', 'button');
      if (!swatch.hasAttribute('tabindex')) swatch.setAttribute('tabindex', '0');
      swatch.addEventListener('click', () => {
        if (selectedColors.has(col)) { selectedColors.delete(col); swatch.classList.remove('selected'); swatch.setAttribute('aria-pressed', 'false'); }
        else { selectedColors.add(col); swatch.classList.add('selected'); swatch.setAttribute('aria-pressed', 'true'); }
        filterProducts();
      });
      swatch.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); swatch.click(); } });
    });

    sizeButtons.forEach(btn => {
      const s = (btn.dataset.size || btn.textContent || '').toLowerCase().trim();
      btn.dataset.size = s;
      btn.addEventListener('click', () => {
        if (!s) return;
        if (selectedSizes.has(s)) { selectedSizes.delete(s); btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
        else { selectedSizes.add(s); btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
        filterProducts();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        selectedCategory = 'all'; selectedStyles.clear(); selectedColors.clear(); selectedSizes.clear();
        categoryLinks.forEach(l => l.classList.remove('active-category'));
        const all = document.querySelector('.filter-category[data-category="all"]'); if (all) all.classList.add('active-category');
        styleLinks.forEach(l => l.classList.remove('active-style'));
        colorSwatches.forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-pressed', 'false'); });
        sizeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        if (slider) { slider.value = slider.max; maxPrice = parseInt(slider.value, 10); if (value) value.textContent = slider.value; }
        filterProducts();
      });
    }

    filterProducts();

    // listing -> product navigation
    const grid = document.querySelector('.product-grid') || document.querySelector('.pages') || document.body;
    grid.addEventListener('click', (e) => {
      const clickedImg = e.target.closest('img');
      if (!clickedImg) return;
      const card = clickedImg.closest('.tselling1') || clickedImg.closest('.product') || clickedImg.closest('[data-product-name]') || clickedImg.closest('.tselling');
      if (!card) return;

      const product = {
        name: card.dataset.productName || card.dataset.title || (card.querySelector('.title')?.textContent?.trim()) || (card.querySelector('p')?.textContent?.trim()) || 'Product',
        price: card.dataset.price || (card.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || ''),
        oldPrice: card.dataset.oldPrice || card.dataset['old-price'] || '',
        image: clickedImg.src || clickedImg.getAttribute('src') || '',
        description: card.dataset.description || (card.querySelector('.lead')?.textContent?.trim()) || ''
      };

      try {
        if (window.localStorage) {
          localStorage.setItem('selectedProduct', JSON.stringify(product));
          window.location.href = 'product.html';
          return;
        }
      } catch (err) { console.warn('localStorage write failed, falling back to URL params', err); }

      const qs = new URLSearchParams();
      if (product.image) qs.set('img', product.image);
      if (product.name) qs.set('name', product.name);
      if (product.price) qs.set('price', product.price);
      if (product.oldPrice) qs.set('oldPrice', product.oldPrice);
      if (product.description) qs.set('desc', product.description);
      window.location.href = 'product.html?' + qs.toString();
    });
  }

  /* -------------------------
     Product page populate & interactions
     ------------------------- */
  function initProductPage() {
    const maybeProduct = document.querySelector('#product-main-image, #product-card, .product-page, .product-card, [data-product-page]');
    if (!maybeProduct) return; // not a product page

    // populate
    let productData = null;
    try { const raw = window.localStorage ? localStorage.getItem('selectedProduct') : null; if (raw) productData = safeParse(raw); } catch (e) { productData = null; }
    if (!productData) {
      const url = new URL(window.location.href); const qs = url.searchParams;
      const img = qs.get('img'); const name = qs.get('name'); const price = qs.get('price') || qs.get('p'); const oldPrice = qs.get('oldPrice'); const desc = qs.get('desc') || qs.get('description');
      if (img || name || price || oldPrice || desc) productData = { image: img || '', name: name || '', price: price || '', oldPrice: oldPrice || '', description: desc || '' };
    }
    if (!productData) { console.debug('[product-populate] no product data'); } else {
      function setIf(sel, val, prop = 'textContent') { if (val === undefined || val === null) return false; let el = document.getElementById(sel) || document.querySelector(sel); if (!el) return false; if (prop === 'src') el.src = val; else if (prop === 'html') el.innerHTML = val; else el.textContent = val; return true; }
      if (productData.name) setIf('#product-title', productData.name);
      if (productData.image) setIf('#product-main-image', productData.image, 'src') || setIf('.product-main-image', productData.image, 'src') || (function () { const img = document.querySelector('#product-card img, .product-card img, .product-page img'); if (img) img.src = productData.image; })();
      if (productData.price) setIf('#price', (typeof productData.price === 'number' ? ('$' + productData.price.toFixed(2)) : ('$' + productData.price)));
      if (productData.oldPrice) setIf('#old-price', productData.oldPrice);
      if (productData.description) setIf('#product-card .lead', productData.description);
    }

    // interactions: size, qty, addToCart
    const sizeBtns = qsa('.size-btn');
    const minusBtn = qs('#minus');
    const plusBtn = qs('#plus');
    const qtyEl = qs('#qty');
    const addToCartBtn = qs('#addToCart');
    const msgEl = qs('#msg');
    const titleEl = qs('#product-title');
    const mainImage = qs('#product-main-image');
    const priceEl = qs('#price');
    const oldPriceEl = qs('#old-price');
    const descEl = qs('#product-card .lead');

    let qty = parseInt(qtyEl?.textContent || '1', 10); if (!Number.isFinite(qty) || qty < 1) qty = 1;
    function updateQtyUI() { if (qtyEl) qtyEl.textContent = qty; }

    function readProductFromPage() {
      const name = (titleEl && titleEl.textContent && titleEl.textContent.trim()) || document.title || 'Product';
      const image = (mainImage && mainImage.src) || '';
      const price = parseFloat((priceEl && priceEl.textContent) ? priceEl.textContent.replace(/[^0-9.]/g, '') : 0) || 0;
      const oldPrice = (oldPriceEl && oldPriceEl.textContent) ? parseFloat(oldPriceEl.textContent.replace(/[^0-9.]/g, '')) || '' : '';
      const description = (descEl && descEl.textContent) ? descEl.textContent.trim() : '';
      return { name, image, price, oldPrice, description }; }

    sizeBtns.forEach(btn => { btn.setAttribute('role', 'radio'); btn.setAttribute('aria-checked', btn.classList.contains('active') ? 'true' : 'false'); btn.addEventListener('click', () => { sizeBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); }); btn.classList.add('active'); btn.setAttribute('aria-checked', 'true'); }); });

    minusBtn?.addEventListener('click', (e) => { e.preventDefault(); if (qty > 1) { qty -= 1; updateQtyUI(); } });
    plusBtn?.addEventListener('click', (e) => { e.preventDefault(); qty += 1; updateQtyUI(); });

    function flashMessage(show = true, text = 'Added ✓') { if (!msgEl) return; msgEl.textContent = text; if (show) { msgEl.classList.add('show'); setTimeout(() => msgEl.classList.remove('show'), 1300); } else msgEl.classList.remove('show'); }

    function addToCartStorage(item) {
      let cart = [];
      try { cart = safeParse(localStorage.getItem('cart') || '[]'); if (!Array.isArray(cart)) cart = []; } catch (err) { cart = []; }
      const existingIndex = cart.findIndex(ci => (ci.name === item.name) && (ci.size === item.size));
      if (existingIndex > -1) cart[existingIndex].qty = (cart[existingIndex].qty || 0) + item.qty; else cart.push(item);
      try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) { console.error('save cart failed', e); }
      return cart;
    }

    async function addToCartServer(item) {
      try {
        const res = await serverRequest({ url: '/api/cart/add', method: 'POST', json: item });
        return res;
      } catch (err) { console.warn('server add failed', err); return null; }
    }

    addToCartBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const activeSizeBtn = sizeBtns.find(b => b.classList.contains('active'));
      const selectedSize = activeSizeBtn ? (activeSizeBtn.dataset.size || activeSizeBtn.textContent.trim()) : null;
      if (!selectedSize) {
        if (sizeBtns.length) sizeBtns[0].focus();
        const hint = document.createElement('div'); hint.textContent = 'Please select a size'; hint.style.color = '#b00020'; hint.style.fontWeight = '700'; hint.style.marginTop = '8px'; addToCartBtn.parentElement.insertBefore(hint, addToCartBtn.nextSibling); setTimeout(() => hint.remove(), 2200); return;
      }
      const product = readProductFromPage();
      const cartItem = { id: (product.name + '|' + selectedSize).replace(/\s+/g, '_') + '|' + Date.now().toString(36), name: product.name, image: product.image, price: product.price, oldPrice: product.oldPrice, description: product.description, size: selectedSize, qty: qty };

      // write local first
      addToCartStorage(cartItem);

      // try server sync (don't block UX)
      addToCartServer(cartItem).then(res => { if (res && res.success) console.debug('server cart updated', res); }).catch(() => {});

      flashMessage(true, 'Added to cart ✓');
      setTimeout(() => { window.location.href = 'cart.html'; }, 350);
    });

    updateQtyUI();
  }

  /* -------------------------
     Cart render & actions
     - supports localStorage and optionally server endpoints
     ------------------------- */
  function initCart() {
    const cartListEl = qs('#cartList');
    const subtotalEl = qs('#subtotalVal');
    const discountEl = qs('#discountVal');
    const deliveryEl = qs('#deliveryVal');
    const totalEl = qs('#totalVal');
    const promoInput = qs('#promoInput');
    const checkoutBtn = qs('.btn-primary');

    const DELIVERY_FEE = 15;
    const PROMOS = { 'SAVE20': 0.20, 'HALFOFF': 0.50 };
    let currentPromo = null;

    // Toggle this to false if you do NOT want the script to read static DOM items
    // and repopulate localStorage from server-rendered HTML. Default: true for backward compatibility.
    const ENABLE_DOM_HYDRATE = false; // changed: don't repopulate cart from static DOM after checkout

    function readCart() { try { const raw = localStorage.getItem('cart'); const parsed = safeParse(raw) || []; return Array.isArray(parsed) ? parsed : []; } catch (e) { console.error('readCart parse error', e); return []; } }
    function saveCart(cart) { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) { console.error('saveCart error', e); } }

    function hydrateCartFromDOM() {
      const items = [];
      if (!cartListEl) return items;
      const domItems = cartListEl.querySelectorAll('.item');
      domItems.forEach((it, idx) => {
        try {
          const title = it.querySelector('.item-title')?.textContent?.trim() || `Item ${idx + 1}`;
          const img = it.querySelector('.cart-thumb')?.src || '';
          const priceRaw = it.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || '0';
          const meta = it.querySelector('.meta')?.textContent || '';
          let size = '', color = '';
          const m = meta.split('•').map(s => s.trim());
          m.forEach(part => { if (part.toLowerCase().startsWith('size')) size = part.split(':')[1]?.trim() || ''; if (part.toLowerCase().startsWith('color')) color = part.split(':')[1]?.trim() || ''; });
          const qty = Number(it.querySelector('.count')?.textContent || 1);
          items.push({ id: 'fallback-' + idx, name: title, image: img, price: parseFloat(priceRaw) || 0, size, color, qty });
        } catch (err) { /* ignore */ }
      });
      return items;
    }

    function escapeHtml(text) { if (!text) return ''; return String(text).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

    function renderCart() {
      let cart = readCart();
      // hydrate from DOM only when enabled — avoids re-populating demo/static markup after checkout
      if ((!cart || cart.length === 0) && cartListEl && ENABLE_DOM_HYDRATE) { cart = hydrateCartFromDOM(); if (cart.length) saveCart(cart); }
      if (!cartListEl) return;
      if (!cart || cart.length === 0) { 
        // show empty message and ensure all totals show zero
        cartListEl.innerHTML = '<div class="cart-empty">Your cart is empty. Add items to get started.</div>';
        if (subtotalEl) subtotalEl.textContent = money(0);
        if (discountEl) discountEl.textContent = '- ' + money(0);
        if (deliveryEl) deliveryEl.textContent = money(0);
        if (totalEl) totalEl.textContent = money(0);
        updateTotals();
        return; 
      }

      cartListEl.innerHTML = cart.map((item, idx) => {
        const priceDisplay = money(item.price);
        const count = item.qty || 1;
        const safeId = item.id ? String(item.id) : 'i' + idx;
        return `
  <div class="item" data-id="${safeId}">
    <div class="thumb">
      <img loading="lazy" src="${item.image || 'assets/images/placeholder.png'}" alt="${escapeHtml(item.name)}" class="cart-thumb">
    </div>
    <div class="item-info">
      <div class="item-title">${escapeHtml(item.name)}</div>
      <div class="meta">Size: <strong>${escapeHtml(item.size || '')}</strong> &nbsp; • &nbsp; Color: <strong>${escapeHtml(item.color || '')}</strong></div>
      <div class="price-row">
        <div class="price">${priceDisplay}</div>
        <div class="controls">
          <div class="qty" role="group" data-id="${safeId}">
            <button class="qty-decrease" title="Decrease">−</button>
            <div class="count">${count}</div>
            <button class="qty-increase" title="Increase">+</button>
          </div>
        </div>
      </div>
    </div>
    <div class="trash" title="Remove item" data-id="${safeId}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
      </svg>
    </div>
  </div>`;
      }).join('');

      attachItemHandlers();
      updateTotals();
    }

    function attachItemHandlers() {
      qsa('.qty-increase').forEach(btn => { btn.onclick = () => { const wrapper = btn.closest('.qty'); const id = wrapper?.dataset.id; changeQty(id, +1); }; });
      qsa('.qty-decrease').forEach(btn => { btn.onclick = () => { const wrapper = btn.closest('.qty'); const id = wrapper?.dataset.id; changeQty(id, -1); }; });
      qsa('.trash').forEach(tr => { tr.onclick = () => { const id = tr.dataset.id; removeItemById(id); }; });
    }

    // debounce helper for qty update server sync
    function debounce(fn, wait = 300) { let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); }; }

    const syncQtyToServerDebounced = debounce(async (id, qty) => {
      try { await serverRequest({ url: '/api/cart/update', method: 'POST', json: { product_id: id, quantity: qty } }); } catch (e) { /* silently ignore server errors */ }
    }, 400);

    function changeQty(id, delta) {
      if (!id) return;
      const cart = readCart();
      const idx = cart.findIndex(i => String(i.id) === String(id));
      if (idx === -1) return;
      cart[idx].qty = Math.max(1, (Number(cart[idx].qty) || 1) + delta);
      saveCart(cart);
      renderCart();
      // try sync
      syncQtyToServerDebounced(cart[idx].id, cart[idx].qty);
    }

    async function removeItemById(id) {
      if (!id) return;
      let cart = readCart();
      cart = cart.filter(i => String(i.id) !== String(id));
      saveCart(cart);
      renderCart();
      // try server remove
      try { await serverRequest({ url: '/api/cart/remove', method: 'POST', json: { product_id: id } }); } catch (e) { /* ignore */ }
    }

    function applyPromo() {
      const code = (promoInput?.value || '').trim().toUpperCase();
      if (!code) { alert('Please enter a promo code'); return; }
      if (!PROMOS[code]) { alert('Invalid promo code'); return; }
      currentPromo = code; updateTotals(); alert('Promo applied: ' + code);
      // try server apply
      serverRequest({ url: '/api/cart/promo', method: 'POST', json: { promo_code: code } }).catch(() => {});
    }

    function updateTotals() {
      const cart = readCart();
      const subtotal = cart.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
      const promoRate = (currentPromo && PROMOS[currentPromo]) ? PROMOS[currentPromo] : 0;
      const discountAmount = subtotal * promoRate;
      const deliveryFee = (subtotal > 0) ? DELIVERY_FEE : 0;
      const total = subtotal - discountAmount + deliveryFee;

      if (subtotalEl) subtotalEl.textContent = money(subtotal);
      if (discountEl) discountEl.textContent = (promoRate > 0) ? ('- ' + money(discountAmount)) : '- $0.00';
      if (deliveryEl) deliveryEl.textContent = money(deliveryFee);
      if (totalEl) totalEl.textContent = money(total);
    }

    // When checkout is clicked we persist the order summary, clear the cart, and navigate.
    // Clearing localStorage here guarantees that when the user returns to cart.html the cart will be empty.
    function goCheckout() {
      const cart = readCart();
      if (!cart || cart.length === 0) { alert('Your cart is empty'); return; }
      try {
        localStorage.setItem('checkoutOrder', JSON.stringify({ cart, subtotal: subtotalEl?.textContent, discount: discountEl?.textContent, delivery: deliveryEl?.textContent, total: totalEl?.textContent }));
      } catch (e) { /* ignore */ }

      // <-- NEW: clear cart so returning to cart page shows empty
      try { localStorage.removeItem('cart'); } catch (e) { console.warn('failed to clear cart on checkout', e); }

      // optionally inform server (non-blocking)
      serverRequest({ url: '/api/cart/checkout', method: 'POST', json: { cart, timestamp: nowIso() } }).catch(() => {});

      // navigate to checkout
      window.location.href = 'checkout.html';
    }

    window.removeItem = function (elOrThis) { try { const el = (elOrThis && elOrThis.dataset) ? elOrThis : document.querySelector('.trash'); const id = el?.dataset?.id; if (id) removeItemById(id); } catch (err) { console.error('removeItem fallback', err); } };

    if (promoInput) { const applyBtn = qs('.apply-btn'); if (applyBtn) applyBtn.addEventListener('click', applyPromo); }
    if (checkoutBtn) checkoutBtn.addEventListener('click', goCheckout);

    // initial render
    renderCart();
  }

  /* -------------------------
     Bootstrapping
     ------------------------- */
  function boot() {
    // jQuery search should be initialized after DOM ready if jQuery is present
    try { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { if (isJQ()) initJQuerySearch(); initListingAndNav(); initProductPage(); initCart(); }); else { if (isJQ()) initJQuerySearch(); initListingAndNav(); initProductPage(); initCart(); } } catch (e) { console.error('App boot failed', e); }
  }

  return { boot, // exposed for manual init
           serverRequest // exported for testing/debug
  };
})();

// Auto-boot
App.boot();
