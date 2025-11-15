// Combined & improved multi-filter + listing -> product + product populate script
document.addEventListener('DOMContentLoaded', () => {
  /* ===========================
     FILTERING (listing page)
     =========================== */
  const categoryLinks = Array.from(document.querySelectorAll('.filter-category'));
  const styleLinks = Array.from(document.querySelectorAll('.filter-style'));
  const slider = document.getElementById('range');
  const value = document.getElementById('value');
  const colorSwatches = Array.from(document.querySelectorAll('.color img, .color .color-swatch, .color button'));
  const sizeButtons = Array.from(document.querySelectorAll('.size-btn'));
  const resetBtn = document.getElementById('resetFilters');
  const applyBtn = document.getElementById('applyFilters');
  const products = Array.from(document.querySelectorAll('.tselling1'));

  let selectedCategory = 'all';
  let selectedStyles = new Set();
  let selectedColors = new Set();
  let selectedSizes = new Set();
  let maxPrice = slider ? parseInt(slider.value || slider.getAttribute('value') || slider.max || 'Infinity') : Infinity;

  if (value && slider) value.textContent = slider.value;

  const parseListAttr = raw => {
    if (!raw) return [];
    return String(raw).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  };

  function filterProducts() {
    if (!products || products.length === 0) return;
    products.forEach(prod => {
      const price = parseInt(prod.dataset.price || (prod.querySelector('.price')?.textContent?.replace(/[^0-9.]/g,'') || '0')) || 0;
      const prodCategory = (prod.dataset.category || '').toLowerCase();
      const prodStyles = parseListAttr(prod.dataset.styles || prod.dataset.style);
      const prodColors = parseListAttr(prod.dataset.colors || prod.dataset.color);
      const prodSizes = parseListAttr(prod.dataset.sizes || prod.dataset.size);

      const categoryMatch = (selectedCategory === 'all') || (prodCategory === selectedCategory);
      const priceMatch = isFinite(maxPrice) ? (price <= maxPrice) : true;

      let styleMatch = true;
      if (selectedStyles.size > 0) styleMatch = prodStyles.some(st => selectedStyles.has(st));

      let colorMatch = true;
      if (selectedColors.size > 0) colorMatch = prodColors.some(c => selectedColors.has(c));

      let sizeMatch = true;
      if (selectedSizes.size > 0) sizeMatch = prodSizes.some(s => selectedSizes.has(s));

      prod.style.display = (categoryMatch && priceMatch && styleMatch && colorMatch && sizeMatch) ? '' : 'none';
    });
  }

  window.filterProducts = filterProducts;

  // Category handlers (single select)
  categoryLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      selectedCategory = (link.dataset.category || 'all').toLowerCase();
      categoryLinks.forEach(l => l.classList.remove('active-category'));
      link.classList.add('active-category');
      filterProducts();
    });
  });

  // Style handlers (single-like)
  styleLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const st = (link.dataset.style || '').toLowerCase();
      if (!st) return;
      selectedStyles.clear();
      selectedStyles.add(st);
      styleLinks.forEach(l => l.classList.remove('active-style'));
      link.classList.add('active-style');
      filterProducts();
    });
  });

  // Price slider
  if (slider) {
    slider.addEventListener('input', function () {
      maxPrice = parseInt(this.value) || Infinity;
      if (value) value.textContent = this.value;
      filterProducts();
    });
  }

  // Color swatches (multi-select)
  colorSwatches.forEach(swatch => {
    const col = ((swatch.dataset && swatch.dataset.color) || '').toLowerCase();
    swatch.dataset.color = col;
    // add aria-pressed for accessibility if not present
    if (!swatch.hasAttribute('role')) swatch.setAttribute('role', 'button');
    if (!swatch.hasAttribute('tabindex')) swatch.setAttribute('tabindex', '0');
    swatch.addEventListener('click', () => {
      if (!col) return;
      if (selectedColors.has(col)) {
        selectedColors.delete(col);
        swatch.classList.remove('selected');
        swatch.setAttribute('aria-pressed', 'false');
      } else {
        selectedColors.add(col);
        swatch.classList.add('selected');
        swatch.setAttribute('aria-pressed', 'true');
      }
      filterProducts();
    });
    // keyboard support
    swatch.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); swatch.click(); }
    });
  });

  // Size buttons (multi-select)
  sizeButtons.forEach(btn => {
    const s = (btn.dataset.size || '').toLowerCase();
    btn.dataset.size = s;
    btn.addEventListener('click', () => {
      if (!s) return;
      if (selectedSizes.has(s)) {
        selectedSizes.delete(s);
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        selectedSizes.add(s);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
      filterProducts();
    });
  });

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedCategory = 'all';
      selectedStyles.clear();
      selectedColors.clear();
      selectedSizes.clear();
      categoryLinks.forEach(l => l.classList.remove('active-category'));
      const all = document.querySelector('.filter-category[data-category="all"]');
      if (all) all.classList.add('active-category');
      styleLinks.forEach(l => l.classList.remove('active-style'));
      colorSwatches.forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-pressed','false'); });
      sizeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      if (slider) {
        slider.value = slider.max;
        maxPrice = parseInt(slider.value);
        if (value) value.textContent = slider.value;
      }
      filterProducts();
    });
  }

  // initial run
  filterProducts();

  /* ===========================
     LISTING -> PRODUCT navigation
     (delegated image click)
     =========================== */
  const grid = document.querySelector('.product-grid') || document.querySelector('.pages') || document.body;
  grid.addEventListener('click', (e) => {
    const clickedImg = e.target.closest('img');
    if (!clickedImg) return;

    // find product container - prefer .tselling1
    const card = clickedImg.closest('.tselling1') || clickedImg.closest('.product') || clickedImg.closest('[data-product-name]') || clickedImg.closest('.tselling');
    if (!card) return;

    // Optional: prevent if click on unrelated site images (safety)
    // Build product object
    const product = {
      name: card.dataset.productName || card.dataset.title || card.querySelector('.title')?.textContent?.trim() || card.querySelector('p')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || 'Product',
      price: card.dataset.price || (card.querySelector('.price')?.textContent?.replace(/[^0-9.]/g,'') || ''),
      oldPrice: card.dataset.oldPrice || card.dataset['old-price'] || '',
      image: clickedImg.src || clickedImg.getAttribute('src') || '',
      description: card.dataset.description || card.querySelector('.lead')?.textContent?.trim() || ''
    };

    try {
      localStorage.setItem('selectedProduct', JSON.stringify(product));
      // navigate to product page
      window.location.href = 'product.html';
    } catch (err) {
      const qs = new URLSearchParams();
      if (product.image) qs.set('img', product.image);
      if (product.name) qs.set('name', product.name);
      window.location.href = 'product.html?' + qs.toString();
    }
  });

  /* ===========================
     PRODUCT PAGE POPULATE
     =========================== */
  // Only run populate on product page elements presence
  const isProductPage = !!(document.getElementById('product-main-image') || document.getElementById('product-card'));
  if (!isProductPage) return;

  let productData = null;
  try {
    const raw = localStorage.getItem('selectedProduct');
    if (raw) productData = JSON.parse(raw);
  } catch (err) { productData = null; }

  if (!productData) {
    const urlParams = new URLSearchParams(window.location.search);
    const img = urlParams.get('img');
    const name = urlParams.get('name');
    if (img || name) productData = { image: img, name: name || 'Product' };
  }

  if (!productData) return; // nothing to populate

  // MAIN PAGE ELEMENTS (adapted to your markup)
  const mainImageEl = document.getElementById('product-main-image'); // your markup's main image
  if (mainImageEl && productData.image) {
    mainImageEl.src = productData.image;
    mainImageEl.alt = productData.name || mainImageEl.alt || 'Product image';
  }

  // Also try to fill any other img placeholders in gallery
  const firstThumb = document.querySelector('.tshirt img:not(#product-main-image)');
  if (firstThumb && productData.image) {
    firstThumb.src = productData.image;
    firstThumb.alt = productData.name || 'Thumb';
  }
  const shirtImg = document.querySelector('.shirt img');
  if (shirtImg && productData.image) {
    shirtImg.src = productData.image;
    shirtImg.alt = productData.name || 'Thumb';
  }

  // Title
  const titleEl = document.getElementById('product-title') || document.querySelector('#product-card h1');
  if (titleEl && productData.name) titleEl.textContent = productData.name;

  // Price / old price
  const priceSpan = document.getElementById('price');
  if (priceSpan && productData.price) priceSpan.textContent = productData.price;
  const oldPriceSpan = document.getElementById('old-price');
  if (oldPriceSpan && productData.oldPrice) oldPriceSpan.textContent = productData.oldPrice;

  // Description
  const descEl = document.querySelector('#product-card .lead');
  if (descEl && productData.description) descEl.textContent = productData.description;

});

//product page

document.addEventListener('DOMContentLoaded', () => {
  const log = (...s) => console.log('[product.js]', ...s);

  // Elements
  const sizeBtns = Array.from(document.querySelectorAll('.size-btn'));
  const minusBtn = document.getElementById('minus');
  const plusBtn = document.getElementById('plus');
  const qtyEl = document.getElementById('qty');
  const addToCartBtn = document.getElementById('addToCart');
  const msgEl = document.getElementById('msg');

  // Product fields on page
  const titleEl = document.getElementById('product-title');
  const mainImage = document.getElementById('product-main-image');
  const priceEl = document.getElementById('price');
  const oldPriceEl = document.getElementById('old-price');
  const descEl = document.querySelector('#product-card .lead');

  // Ensure qty element exists and is numeric
  let qty = parseInt(qtyEl?.textContent || '1', 10);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;
  const updateQtyUI = () => { if (qtyEl) qtyEl.textContent = qty; };

  // Helper: read product info currently shown on product page
  function readProductFromPage() {
    const name = (titleEl && titleEl.textContent && titleEl.textContent.trim()) || document.title || 'Product';
    const image = (mainImage && mainImage.src) || '';
    const price = parseFloat((priceEl && priceEl.textContent) ? priceEl.textContent.replace(/[^0-9.]/g,'') : 0) || 0;
    const oldPrice = parseFloat((oldPriceEl && oldPriceEl.textContent) ? oldPriceEl.textContent.replace(/[^0-9.]/g,'') : '') || '';
    const description = (descEl && descEl.textContent) ? descEl.textContent.trim() : '';
    return { name, image, price, oldPrice, description };
  }

  // Size selection (single-select)
  sizeBtns.forEach(btn => {
    // ensure aria attributes for accessibility
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', btn.classList.contains('active') ? 'true' : 'false');

    btn.addEventListener('click', () => {
      // make this the only active
      sizeBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
    });
  });

  // Qty controls
  minusBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (qty > 1) { qty -= 1; updateQtyUI(); }
  });
  plusBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    qty += 1; updateQtyUI();
  });

  // Show/hide message helper
  function flashMessage(show = true, text = 'Added ✓') {
    if (!msgEl) return;
    msgEl.textContent = text;
    if (show) {
      msgEl.classList.add('show');
      // auto-hide after 1.3s
      setTimeout(() => msgEl.classList.remove('show'), 1300);
    } else {
      msgEl.classList.remove('show');
    }
  }

  // Merge logic: if same product (by name+size) exists, add qty
  function addToCartStorage(item) {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (err) {
      cart = [];
    }

    // find existing item with same name + size
    const existingIndex = cart.findIndex(ci => (ci.name === item.name) && (ci.size === item.size));
    if (existingIndex > -1) {
      cart[existingIndex].qty = (cart[existingIndex].qty || 0) + item.qty;
    } else {
      cart.push(item);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  }

  // Add to cart button handler
  addToCartBtn?.addEventListener('click', (e) => {
    e.preventDefault();

    // read selected size
    const activeSizeBtn = sizeBtns.find(b => b.classList.contains('active'));
    const selectedSize = activeSizeBtn ? (activeSizeBtn.dataset.size || activeSizeBtn.textContent.trim()) : null;

    if (!selectedSize) {
      // show inline warning and focus sizes
      log('No size selected');
      if (sizeBtns.length) {
        sizeBtns[0].focus();
      }
      // quick visual hint
      const hint = document.createElement('div');
      hint.textContent = 'Please select a size';
      hint.style.color = '#b00020';
      hint.style.fontWeight = '700';
      hint.style.marginTop = '8px';
      addToCartBtn.parentElement.insertBefore(hint, addToCartBtn.nextSibling);
      setTimeout(() => hint.remove(), 2200);
      return;
    }

    const product = readProductFromPage();
    const cartItem = {
      id: (product.name + '|' + selectedSize).replace(/\s+/g,'_') + '|' + Date.now().toString(36),
      name: product.name,
      image: product.image,
      price: product.price,
      oldPrice: product.oldPrice,
      description: product.description,
      size: selectedSize,
      qty: qty
    };

    // Add to localStorage (merge duplicates)
    try {
      addToCartStorage(cartItem);
      log('Added to cart', cartItem);
    } catch (err) {
      console.error('Failed to save cart:', err);
    }

    // Feedback to user and redirect
    flashMessage(true, 'Added to cart ✓');

    // short delay so user sees message
    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 350);
  });

  // Initialization logs and UI sync
  updateQtyUI();
  log('Product page: sizeBtns:', sizeBtns.length, 'qty control:', !!minusBtn, !!plusBtn, 'addToCartBtn:', !!addToCartBtn);

}); // DOMContentLoaded


// CART: render + actions (works with localStorage.cart array)
(function () {
  'use strict';

  // Helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const money = v => '$' + (Number(v) || 0).toFixed(2);

  // DOM targets
  const cartListEl = document.getElementById('cartList');
  const subtotalEl = document.getElementById('subtotalVal');
  const discountEl = document.getElementById('discountVal');
  const deliveryEl = document.getElementById('deliveryVal');
  const totalEl = document.getElementById('totalVal');
  const promoInput = document.getElementById('promoInput');
  const checkoutBtn = document.querySelector('.btn-primary');

  const DELIVERY_FEE = 15;
  const PROMOS = {
    'SAVE20': 0.20, // 20% off
    'HALFOFF': 0.50
  };

  // read cart; returns array
  function readCart() {
    try {
      const raw = localStorage.getItem('cart');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error('readCart parse error', e);
      return [];
    }
  }

  // save cart array
  function saveCart(cart) {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
      console.error('saveCart error', e);
    }
  }

  // If no cart in localStorage, scan existing DOM .item elements (fallback)
  function hydrateCartFromDOM() {
    const items = [];
    if (!cartListEl) return items;
    const domItems = cartListEl.querySelectorAll('.item');
    domItems.forEach((it, idx) => {
      try {
        const title = it.querySelector('.item-title')?.textContent?.trim() || `Item ${idx+1}`;
        const img = it.querySelector('.cart-thumb')?.src || '';
        const priceRaw = it.querySelector('.price')?.textContent?.replace(/[^0-9.]/g,'') || '0';
        const meta = it.querySelector('.meta')?.textContent || '';
        // meta example: "Size: Large  •  Color: White"
        let size = '', color = '';
        const m = meta.split('•').map(s => s.trim());
        m.forEach(part => {
          if (part.toLowerCase().startsWith('size')) size = part.split(':')[1]?.trim() || '';
          if (part.toLowerCase().startsWith('color')) color = part.split(':')[1]?.trim() || '';
        });
        const qty = Number(it.querySelector('.count')?.textContent || 1);
        items.push({
          id: 'fallback-'+idx,
          name: title,
          image: img,
          price: parseFloat(priceRaw) || 0,
          size, color, qty
        });
      } catch (err) { /* ignore item */ }
    });
    return items;
  }

  // Render cart items into cartListEl
  function renderCart() {
    let cart = readCart();
    if ((!cart || cart.length === 0) && cartListEl) {
      // try to hydrate from DOM static placeholders
      cart = hydrateCartFromDOM();
      if (cart.length) saveCart(cart);
    }

    if (!cartListEl) return;

    if (!cart || cart.length === 0) {
      cartListEl.innerHTML = '<div class="cart-empty">Your cart is empty. Add items to get started.</div>';
      updateTotals();
      return;
    }

    // build HTML
    cartListEl.innerHTML = cart.map((item, idx) => {
      const priceDisplay = money(item.price);
      const count = item.qty || 1;
      const safeId = item.id ? String(item.id) : 'i'+idx;
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

    // attach handlers after rendering
    attachItemHandlers();
    updateTotals();
  }

  // escape for HTML injection safety (small helper)
  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function (m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  // attach increase/decrease/remove handlers
  function attachItemHandlers() {
    const cart = readCart();
    // qty increase
    $$('.qty-increase').forEach(btn => {
      btn.onclick = (e) => {
        const wrapper = btn.closest('.qty');
        const id = wrapper?.dataset.id;
        changeQty(id, +1);
      };
    });
    $$('.qty-decrease').forEach(btn => {
      btn.onclick = (e) => {
        const wrapper = btn.closest('.qty');
        const id = wrapper?.dataset.id;
        changeQty(id, -1);
      };
    });
    // trash remove
    $$('.trash').forEach(tr => {
      tr.onclick = () => {
        const id = tr.dataset.id;
        removeItemById(id);
      };
    });
  }

  // change qty by delta
  function changeQty(id, delta) {
    if (!id) return;
    const cart = readCart();
    const idx = cart.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return;
    cart[idx].qty = Math.max(1, (Number(cart[idx].qty) || 1) + delta);
    saveCart(cart);
    renderCart();
  }

  // remove item
  function removeItemById(id) {
    if (!id) return;
    let cart = readCart();
    cart = cart.filter(i => String(i.id) !== String(id));
    saveCart(cart);
    renderCart();
  }

  // apply promo
  let currentPromo = null;
  function applyPromo() {
    const code = (promoInput?.value || '').trim().toUpperCase();
    if (!code) { alert('Please enter a promo code'); return; }
    if (!PROMOS[code]) { alert('Invalid promo code'); return; }
    currentPromo = code;
    updateTotals();
    alert('Promo applied: ' + code);
  }

  // compute and update totals
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

  // Checkout: simple redirect - you can extend to pass order object
  function goCheckout() {
    const cart = readCart();
    if (!cart || cart.length === 0) { alert('Your cart is empty'); return; }
    // optionally pass order summary to checkout page via localStorage
    localStorage.setItem('checkoutOrder', JSON.stringify({
      cart, subtotal: subtotalEl?.textContent, discount: discountEl?.textContent, delivery: deliveryEl?.textContent, total: totalEl?.textContent
    }));
    // change location to real checkout page
    window.location.href = 'checkout.html';
  }

  // Expose removeItem for existing inline onclick handlers
  window.removeItem = function (elOrThis) {
    // if call was removeItem(this) from template, elOrThis is the element
    try {
      const el = (elOrThis && elOrThis.dataset) ? elOrThis : document.querySelector('.trash');
      const id = el?.dataset?.id;
      if (id) removeItemById(id);
    } catch (err) {
      console.error('removeItem fallback', err);
    }
  };

  // wire buttons
  if (promoInput) {
    const applyBtn = document.querySelector('.apply-btn');
    if (applyBtn) applyBtn.addEventListener('click', applyPromo);
  }
  if (checkoutBtn) checkoutBtn.addEventListener('click', goCheckout);

  // initial render
  renderCart();

})();
