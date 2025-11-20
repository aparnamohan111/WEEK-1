/* ====================
   GLOBAL HELPERS
   ==================== */
const App = (function () {
  'use strict';

  // --- Query helpers (robust) ---
  function qs(selector) {
    if (!selector && selector !== '') return null;
    try {
      if (selector instanceof Element) return selector;
      if (selector instanceof Node) return selector;
      if (selector && (selector instanceof NodeList || Array.isArray(selector))) return selector[0] || null;
      if (typeof selector === 'string') {
        const s = selector.trim();
        if (!s) return null;
        return document.querySelector(s);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // qsa: accepts selector string, Element, NodeList or Array; returns array of Elements (may be empty)
  function qsa(selector) {
    try {
      if (!selector && selector !== '') return [];
      if (selector instanceof Element) return [selector];
      if (selector instanceof NodeList) return Array.from(selector);
      if (Array.isArray(selector)) return selector.filter(it => it instanceof Element);
      if (typeof selector === 'string') {
        const s = selector.trim();
        if (!s) return [];
        return Array.from(document.querySelectorAll(s));
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // --- jQuery detection ---
  function isJQ() { return typeof window.jQuery !== 'undefined'; }

  // --- Money formatter ---
  function money(v, currencySign = '$') { return currencySign + (Number(v) || 0).toFixed(2); }

  // --- JSON safe parse ---
  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }

  // --- Time helper ---
  function nowIso() { return new Date().toISOString(); }


/* =========================================================
   SERVER REQUEST  (jQuery Ajax or Fetch)
   ========================================================= */
  async function serverRequest({ url, method = 'GET', json = null }) {
    const cfg = { method: method.toUpperCase(), headers: {} };
    if (json !== null) {
      cfg.headers['Content-Type'] = 'application/json';
      cfg.body = JSON.stringify(json);
    }

    // CSRF token support
    if (window.CSRF_TOKEN) cfg.headers['X-CSRF-Token'] = window.CSRF_TOKEN;

    // jQuery Ajax path
    if (isJQ()) {
      return new Promise((resolve, reject) => {
        window.jQuery.ajax({
          url, method: cfg.method, data: cfg.body,
          contentType: cfg.headers['Content-Type'] || undefined,
          headers: cfg.headers,
          success: resolve,
          error: (xhr, status, err) => reject({ xhr, status, err })
        });
      });
    }

    // fetch path
    try {
      const r = await fetch(url, cfg);
      const text = await r.text();
      try { return JSON.parse(text); } catch { return text; }
    } catch (err) { throw err; }
  }

  /* =========================================================
     INLINE SEARCH (jQuery OR native fallback)
     ========================================================= */

  function initJQuerySearch() {
    if (!isJQ()) { console.warn('jQuery not found — inline search skipped.'); return; }

    const $ = window.jQuery;
    const productsList = [
      'Gradient Graphic T-shirt','Polo with Tipping Details','Black Striped T-shirt',
      'Checked shirt','Skinny fit jeans','Courage Graphic T-shirt',
      'Loose Fit Bermuda Shorts','Faded Skinny Jeans','Classic Polo Shirt'
    ];

    const $input = $('#search-bar');
    const $results = $('#search-results');
    if (!$input.length || !$results.length) return;

    // On typing
    $input.on('input', function () {
      const q = $(this).val().trim().toLowerCase();
      if (q.length < 2) { $results.hide(); return; }

      const matches = productsList.filter(p => p.toLowerCase().includes(q)).slice(0, 10);
      if (matches.length === 0) {
        $results.html('<div class="result-empty" style="padding:8px;">No results</div>').show();
      } else {
        $results.html(matches.map(m =>
          `<div class="result-item" role="option" tabindex="0" style="padding:8px;cursor:pointer">${m}</div>`
        ).join('')).show();
      }
    });

    // Click search result
    $results.on('click', '.result-item', function () {
      const text = $(this).text().trim();
      window.location.href = 'category.html?search=' + encodeURIComponent(text);
    });

    // Enter key support
    $results.on('keydown', '.result-item', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(this).trigger('click');
      }
    });

    // Enter in search bar
    $input.on('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = $(this).val().trim();
        if (q.length >= 1) {
          window.location.href = 'category.html?search=' + encodeURIComponent(q);
        }
      }
    });

    // Click outside
    $(document).on('click', function (e) {
      if (!$(e.target).closest('#search-bar, #search-results').length) {
        $results.hide();
      }
    });

    // Populate if search=... exists
    (function populateFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (!q) return;
      $input.val(q).trigger('input');
    })();

    /* ===============================
       Attach Clear button + "All" handlers
       (safe: create clear button if missing)
       =============================== */
    (function attachClearAndAllHandlers() {
      if (!$input.length) return;

      // create clear button if missing (keeps markup simple)
      let $clearBtn = $('#search-clear');
      if (!$clearBtn.length) {
        $clearBtn = $('<button id="search-clear" type="button" aria-label="Clear search" ' +
                      'style="display:none; position:absolute; right:6px; top:6px; border:none; background:transparent; font-size:18px; cursor:pointer;">&times;</button>');
        // insert after input (adjust wrapper if necessary)
        $input.after($clearBtn);
      }

      // show/hide clear button while typing
      $input.on('input', function () {
        if ($(this).val().trim().length) $clearBtn.show();
        else $clearBtn.hide();
      });

      // clicking clear reloads the page without querystring (shows all)
      $clearBtn.on('click', function () {
        try { localStorage.removeItem('siteSearchQuery'); } catch (e) {}
        window.location.href = window.location.pathname;
      });

      // make the "All" filter reload the page (if you have an "All" link with data-category="all")
      $(document).on('click', '.filter-category[data-category="all"]', function (e) {
        e.preventDefault();
        try { localStorage.removeItem('siteSearchQuery'); } catch (err) {}
        window.location.href = window.location.pathname;
      });

      // Escape key while search has text reloads page (optional)
      $(document).on('keydown', function (e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && $input.val().trim().length) {
          try { localStorage.removeItem('siteSearchQuery'); } catch (err) {}
          window.location.href = window.location.pathname;
        }
      });
    })();

    console.debug('Inline search (jQuery) initialized.');
  }

  // Native inline search fallback (guards against missing elements)
  function initNativeSearch() {
    const productsList = [
      'Gradient Graphic T-shirt','Polo with Tipping Details','Black Striped T-shirt',
      'Checked shirt','Skinny fit jeans','Courage Graphic T-shirt',
      'Loose Fit Bermuda Shorts','Faded Skinny Jeans','Classic Polo Shirt'
    ];

    const input = qs('#search-bar');
    const results = qs('#search-results');

    if (!input || !results) {
      // nothing to init — safe exit
      return;
    }

    input.addEventListener('input', function () {
      const q = (this.value || '').trim().toLowerCase();
      if (q.length < 2) { results.style.display = 'none'; return; }

      const matches = productsList.filter(p => p.toLowerCase().includes(q)).slice(0, 10);
      if (matches.length === 0) {
        results.innerHTML = '<div class="result-empty" style="padding:8px;">No results</div>';
        results.style.display = '';
      } else {
        results.innerHTML = matches.map(m =>
          `<div class="result-item" role="option" tabindex="0" style="padding:8px;cursor:pointer">${m}</div>`
        ).join('');
        results.style.display = '';
      }
    });

    results.addEventListener('click', function (ev) {
      const item = ev.target.closest('.result-item');
      if (!item) return;
      const text = item.textContent.trim();
      window.location.href = 'category.html?search=' + encodeURIComponent(text);
    });

    results.addEventListener('keydown', function (e) {
      const ri = e.target.closest('.result-item');
      if (!ri) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ri.click();
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = (this.value || '').trim();
        if (q.length >= 1) {
          window.location.href = 'category.html?search=' + encodeURIComponent(q);
        }
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#search-bar, #search-results')) {
        results.style.display = 'none';
      }
    });

    (function populateFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (!q) return;
      input.value = q;
      input.dispatchEvent(new Event('input'));
    })();

    console.debug('Inline search (native) initialized.');
  }


  /* =========================================================
     CATEGORY LISTING PAGE — FILTERS & NAVIGATION
     ========================================================= */

  function initListingAndNav() {
    const categoryLinks = qsa('.filter-category');
    const styleLinks = qsa('.filter-style');
    const slider = qs('#range');
    const value = qs('#value');
    const colorSwatches = qsa('.color img, .color .color-swatch, .color button, .color .color-swatch img');
    const sizeButtons = qsa('.size-btn');
    const resetBtn = qs('#resetFilters');
    // ensure we only keep actual Elements
    let products = qsa('.tselling1').filter(it => it instanceof Element);

    let selectedCategory = 'all';
    let selectedStyles = new Set();
    let selectedColors = new Set();
    let selectedSizes = new Set();
    let maxPrice = slider ? parseInt(slider.value || slider.getAttribute('value') || slider.max || 'Infinity', 10) : Infinity;

    // CONTAINER WHERE PRODUCTS ARE SHOWN
    const listingContainer =
      document.querySelector('.casual') ||
      document.querySelector('.product-grid') ||
      document.body;

    // "NO RESULTS" MESSAGE (create once)
    let noResultsEl = null;
    if (listingContainer) {
      // Avoid duplicate creation if initListingAndNav runs more than once
      noResultsEl = listingContainer.querySelector('.no-results-message');
      if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = 'no-results-message';
        noResultsEl.style.padding = '20px';
        noResultsEl.style.textAlign = 'center';
        noResultsEl.style.fontSize = '18px';
        noResultsEl.style.color = '#555';
        noResultsEl.style.display = 'none';
        noResultsEl.textContent = 'No items found matching your filters.';
        listingContainer.appendChild(noResultsEl);
      }
    }

    // -------------------------------------
    // READ SEARCH QUERY FROM URL
    // -------------------------------------
    const params = new URLSearchParams(window.location.search);
    const searchQuery = (params.get('search') || '').trim().toLowerCase();

    // auto-fill search bar if it exists
    const searchBarEl = qs('#search-bar');
    if (searchQuery && searchBarEl) searchBarEl.value = params.get('search');

    if (value && slider) value.textContent = slider.value;

    const parseListAttr = raw => {
      if (!raw) return [];
      return String(raw).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    };

    function filterProducts() {
      // ensure products points to current live elements in case DOM changed
      products = qsa('.tselling1').filter(it => it instanceof Element);
      if (!products || products.length === 0) {
        // nothing to show — show 'no results' maybe
        if (noResultsEl) noResultsEl.style.display = 'block';
        return;
      }

      products.forEach(prod => {
        // guard — skip non-elements or removed nodes
        if (!prod || !(prod instanceof Element)) return;

        const price = parseInt(prod.dataset.price || (prod.querySelector('.price')?.textContent?.replace(/[^0-9.]/g,'') || '0'), 10) || 0;
        const prodCategory = (prod.dataset.category || '').toLowerCase();
        const prodStyles = (prod.dataset.styles || '').toLowerCase();
        const prodColors = (prod.dataset.colors || '').toLowerCase();
        const prodSizes = (prod.dataset.sizes || '').toLowerCase();

        const categoryMatch = (selectedCategory === 'all') || (prodCategory === selectedCategory);
        const priceMatch = isFinite(maxPrice) ? (price <= maxPrice) : true;
        const styleMatch = selectedStyles.size === 0 || [...selectedStyles].some(st => prodStyles.includes(st));
        const colorMatch = selectedColors.size === 0 || [...selectedColors].some(c => prodColors.includes(c));
        const sizeMatch  = selectedSizes.size === 0 || [...selectedSizes].some(s => prodSizes.includes(s));

        const nameText = (
          (prod.dataset.productName || '') + ' ' +
          (prod.dataset.title || '') + ' ' +
          (prod.querySelector('.title')?.textContent || '') + ' ' +
          (prod.querySelector('.item-title')?.textContent || '') + ' ' +
          (prod.querySelector('p')?.textContent || '')
        ).toLowerCase();

        const searchMatch = !searchQuery || nameText.includes(searchQuery);

        const shouldShow = searchQuery
          ? searchMatch
          : (categoryMatch && priceMatch && styleMatch && colorMatch && sizeMatch);

        try {
          if (prod && prod.style) prod.style.display = shouldShow ? '' : 'none';
        } catch (err) {
          console.warn('filterProducts: skipped product due to error', err);
        }
      });

      // ---- NO RESULTS CHECK ----
      let visibleCount = 0;
      products.forEach(p => {
        try {
          if (p instanceof Element && p.style && p.style.display !== 'none') visibleCount++;
        } catch (e) { /* ignore */ }
      });

      if (noResultsEl) {
        noResultsEl.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }

    window.filterProducts = filterProducts;

    /* ---------- Category Filter ---------- */
    categoryLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        selectedCategory = (link.dataset.category || 'all').toLowerCase();
        categoryLinks.forEach(l => l.classList.remove('active-category'));
        link.classList.add('active-category');
        filterProducts();
      });
    });

    /* ---------- Style Filter ---------- */
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

    /* ---------- Price Slider ---------- */
    if (slider)
      slider.addEventListener('input', function () {
        maxPrice = parseInt(this.value, 10) || Infinity;
        if (value) value.textContent = this.value;
        filterProducts();
      });

    /* ---------- Color Filter ---------- */
    colorSwatches.forEach(swatch => {
      let col = (swatch.dataset?.color) || swatch.getAttribute('alt') || swatch.getAttribute('title') || '';
      col = col.toLowerCase().trim();

      if (!col && swatch.closest)
        col = (swatch.closest('button')?.dataset?.color || '').toLowerCase();

      if (!col) return;

      if (!swatch.hasAttribute('role')) swatch.setAttribute('role', 'button');
      if (!swatch.hasAttribute('tabindex')) swatch.setAttribute('tabindex', '0');

      swatch.addEventListener('click', () => {
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

      swatch.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          swatch.click();
        }
      });
    });

    /* ---------- Size Filter ---------- */
    sizeButtons.forEach(btn => {
      const s = (btn.dataset.size || btn.textContent || '').toLowerCase().trim();
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

    /* ---------- Reset Filter ---------- */
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
        colorSwatches.forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-pressed', 'false'); });
        sizeButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });

        if (slider) {
          slider.value = slider.max;
          maxPrice = parseInt(slider.value, 10);
          if (value) value.textContent = slider.value;
        }

        filterProducts();
      });
    }

    // initial run
    filterProducts();

    /* ---------- Product Card Click → Product Page ---------- */
    const grid = document.querySelector('.product-grid') ||
                 document.querySelector('.pages') ||
                 document.body;

    if (grid && grid.addEventListener) {
      grid.addEventListener('click', e => {
        const clickedImg = e.target && e.target.closest ? e.target.closest('img') : null;
        if (!clickedImg) return;

        const card = clickedImg.closest('.tselling1') ||
                     clickedImg.closest('.product') ||
                     clickedImg.closest('[data-product-name]') ||
                     clickedImg.closest('.tselling');
        if (!card) return;

        const product = {
          name: card.dataset.productName ||
                card.dataset.title ||
                (card.querySelector('.title')?.textContent?.trim()) ||
                (card.querySelector('p')?.textContent?.trim()) ||
                'Product',
          price: card.dataset.price ||
                 (card.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || ''),
          oldPrice: card.dataset.oldPrice || card.dataset['old-price'] || '',
          image: clickedImg.src || clickedImg.getAttribute('src') || '',
          description: card.dataset.description ||
                       (card.querySelector('.lead')?.textContent?.trim()) ||
                       ''
        };

        // store in localStorage
        try {
          localStorage.setItem('selectedProduct', JSON.stringify(product));
          window.location.href = 'product.html';
          return;
        } catch {}

        // fallback via query string
        const qs = new URLSearchParams();
        if (product.image) qs.set('img', product.image);
        if (product.name) qs.set('name', product.name);
        if (product.price) qs.set('price', product.price);
        if (product.oldPrice) qs.set('oldPrice', product.oldPrice);
        if (product.description) qs.set('desc', product.description);

        window.location.href = 'product.html?' + qs.toString();
      });
    }
  }


  /* =========================================================
     PRODUCT PAGE — POPULATE + SIZE/QTY + ADD TO CART
     ========================================================= */
  function initProductPage() {
    const maybeProduct = document.querySelector(
      '#product-main-image, #product-card, .product-page, .product-card, [data-product-page]'
    );
    if (!maybeProduct) return;

    /* ---------- Populate Product Data ---------- */
    let productData = null;
    try { productData = safeParse(localStorage.getItem('selectedProduct')); } catch {}

    if (!productData) {
      const qs = new URLSearchParams(window.location.search);
      const img = qs.get('img');
      const name = qs.get('name');
      const price = qs.get('price') || qs.get('p');
      const oldPrice = qs.get('oldPrice');
      const desc = qs.get('desc') || qs.get('description');

      if (img || name || price || oldPrice || desc) {
        productData = { image: img || '', name: name || '', price, oldPrice, description: desc || '' };
      }
    }

    // Set to UI if exists
    if (productData) {
      function setIf(sel, val, prop = 'textContent') {
        const el = document.querySelector(sel);
        if (!el || val == null) return false;
        if (prop === 'src') el.src = val;
        else if (prop === 'html') el.innerHTML = val;
        else el.textContent = val;
        return true;
      }
      if (productData.name) setIf('#product-title', productData.name);
      if (productData.image) {
        setIf('#product-main-image', productData.image, 'src')
          || setIf('.product-main-image', productData.image, 'src');
      }
      if (productData.price) setIf('#price', '$' + productData.price);
      if (productData.oldPrice) setIf('#old-price', productData.oldPrice);
      if (productData.description) setIf('#product-card .lead', productData.description);
    }

    /* ---------- Elements ---------- */
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

    let qty = parseInt(qtyEl?.textContent || '1', 10);
    if (!qty || qty < 1) qty = 1;

    function updateQtyUI() {
      if (qtyEl) qtyEl.textContent = qty;
    }

    function readProductFromPage() {
      const name = titleEl?.textContent?.trim() || document.title || 'Product';
      const image = mainImage?.src || '';
      const price = parseFloat(priceEl?.textContent?.replace(/[^0-9.]/g, '') || 0);
      const oldPrice = oldPriceEl?.textContent?.replace(/[^0-9.]/g, '') || '';
      const description = descEl?.textContent?.trim() || '';

      return { name, image, price, oldPrice, description };
    }

    /* ---------- Size Select ---------- */
    sizeBtns.forEach(btn => {
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', btn.classList.contains('active') ? 'true' : 'false');
      btn.addEventListener('click', () => {
        sizeBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      });
    });

    /* ---------- Quantity + / - ---------- */
    minusBtn?.addEventListener('click', () => {
      if (qty > 1) qty--;
      updateQtyUI();
    });

    plusBtn?.addEventListener('click', () => {
      qty++;
      updateQtyUI();
    });

    /* ---------- Message Flash ---------- */
    function flashMessage(show = true, text = 'Added ✓') {
      if (!msgEl) return;
      msgEl.textContent = text;
      if (show) {
        msgEl.classList.add('show');
        setTimeout(() => msgEl.classList.remove('show'), 1300);
      } else {
        msgEl.classList.remove('show');
      }
    }

    /* ---------- LocalStorage Cart ---------- */
    function addToCartStorage(item) {
      let cart = safeParse(localStorage.getItem('cart')) || [];
      if (!Array.isArray(cart)) cart = [];
      const existing = cart.findIndex(ci => ci.name === item.name && ci.size === item.size);
      if (existing > -1) {
        cart[existing].qty += item.qty;
      } else {
        cart.push(item);
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      return cart;
    }

    /* ---------- Server Add ---------- */
    async function addToCartServer(item) {
      try {
        return await serverRequest({ url: '/api/cart/add', method: 'POST', json: item });
      } catch { return null; }
    }

    /* ---------- Add to Cart Button ---------- */
    addToCartBtn?.addEventListener('click', async () => {
      const activeSizeBtn = sizeBtns.find(b => b.classList.contains('active'));
      const selectedSize = activeSizeBtn?.dataset.size || activeSizeBtn?.textContent.trim();

      if (!selectedSize) {
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
        id: (product.name + '|' + selectedSize).replace(/\s+/g, '_') + '|' + Date.now().toString(36),
        name: product.name,
        image: product.image,
        price: product.price,
        oldPrice: product.oldPrice,
        description: product.description,
        size: selectedSize,
        qty
      };

      addToCartStorage(cartItem);
      addToCartServer(cartItem);

      flashMessage(true, 'Added to cart ✓');
      setTimeout(() => window.location.href = 'cart.html', 350);
    });

    updateQtyUI();
  }


  /* =========================================================
     CART PAGE — RENDER, UPDATE, REMOVE, PROMO, CHECKOUT
     ========================================================= */
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

    const ENABLE_DOM_HYDRATE = false; // Do not reimport fallback DOM items

    function readCart() {
      return safeParse(localStorage.getItem('cart')) || [];
    }

    function saveCart(cart) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }

    function escapeHtml(text) {
      return String(text).replace(/[&<>"']/g, m => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
      ));
    }

    /* ---------- Render Cart ---------- */
    function renderCart() {
      let cart = readCart();

      if (!cartListEl) return;

      if (!cart.length) {
        cartListEl.innerHTML = '<div class="cart-empty">Your cart is empty. Add items to get started.</div>';
        subtotalEl.textContent = money(0);
        discountEl.textContent = '- ' + money(0);
        deliveryEl.textContent = money(0);
        totalEl.textContent = money(0);
        updateTotals();
        return;
      }

      cartListEl.innerHTML = cart.map((item, idx) => {
        const safeId = item.id || ('i' + idx);
        return `
  <div class="item" data-id="${safeId}">
    <div class="thumb">
      <img loading="lazy" src="${item.image || 'assets/images/placeholder.png'}"
           alt="${escapeHtml(item.name)}"
           class="cart-thumb">
    </div>
    <div class="item-info">
      <div class="item-title">${escapeHtml(item.name)}</div>
      <div class="meta">Size: <strong>${escapeHtml(item.size || '')}</strong> • Color: <strong>${escapeHtml(item.color || '')}</strong></div>
      <div class="price-row">
        <div class="price">${money(item.price)}</div>
        <div class="controls">
          <div class="qty" role="group" data-id="${safeId}">
            <button class="qty-decrease" title="Decrease">−</button>
            <div class="count">${item.qty}</div>
            <button class="qty-increase" title="Increase">+</button>
          </div>
        </div>
      </div>
    </div>
    <div class="trash" title="Remove item" data-id="${safeId}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round">
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

    /* ---------- Qty + / - Handlers ---------- */
    function attachItemHandlers() {
      qsa('.qty-increase').forEach(btn => {
        btn.onclick = () => {
          const id = btn.closest('.qty')?.dataset.id;
          changeQty(id, +1);
        };
      });
      qsa('.qty-decrease').forEach(btn => {
        btn.onclick = () => {
          const id = btn.closest('.qty')?.dataset.id;
          changeQty(id, -1);
        };
      });
      qsa('.trash').forEach(tr => {
        tr.onclick = () => removeItemById(tr.dataset.id);
      });
    }

    const debounce = (fn, wait=300) => {
      let t; return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };

    const syncQtyToServerDebounced = debounce(async (id, qty) => {
      await serverRequest({
        url: '/api/cart/update',
        method: 'POST',
        json: { product_id: id, quantity: qty }
      });
    }, 400);

    function changeQty(id, delta) {
      const cart = readCart();
      const idx = cart.findIndex(i => i.id === id);
      if (idx < 0) return;

      cart[idx].qty = Math.max(1, cart[idx].qty + delta);
      saveCart(cart);
      renderCart();

      syncQtyToServerDebounced(id, cart[idx].qty);
    }

    async function removeItemById(id) {
      let cart = readCart();
      cart = cart.filter(i => i.id !== id);
      saveCart(cart);
      renderCart();

      await serverRequest({ url: '/api/cart/remove', method: 'POST', json: { product_id: id } });
    }

    /* ---------- Promo Code ---------- */
    function applyPromo() {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return alert('Please enter a promo code');
      if (!PROMOS[code]) return alert('Invalid promo code');

      currentPromo = code;
      updateTotals();
      alert('Promo applied: ' + code);

      serverRequest({ url: '/api/cart/promo', method: 'POST', json: { promo_code: code } });
    }

    /* ---------- Update Totals ---------- */
    let currentPromo = null;

    function updateTotals() {
      const cart = readCart();
      const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
      const discountAmt = currentPromo ? subtotal * PROMOS[currentPromo] : 0;
      const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
      const total = subtotal - discountAmt + delivery;

      if (subtotalEl) subtotalEl.textContent = money(subtotal);
      if (discountEl) discountEl.textContent = (discountAmt > 0 ? '- ' : '') + money(discountAmt);
      if (deliveryEl) deliveryEl.textContent = money(delivery);
      if (totalEl) totalEl.textContent = money(total);
    }

    /* ---------- Checkout ---------- */
    function goCheckout() {
      const cart = readCart();
      if (!cart.length) return alert('Your cart is empty');

      const summary = {
        cart,
        subtotal: subtotalEl.textContent,
        discount: discountEl.textContent,
        delivery: deliveryEl.textContent,
        total: totalEl.textContent
      };

      localStorage.setItem('checkoutOrder', JSON.stringify(summary));
      localStorage.removeItem('cart');

      serverRequest({
        url: '/api/cart/checkout',
        method: 'POST',
        json: { cart, timestamp: nowIso() }
      });

      window.location.href = 'checkout.html';
    }

    // promo apply button
    if (promoInput) {
      const applyBtn = qs('.apply-btn');
      if (applyBtn) applyBtn.addEventListener('click', applyPromo);
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', goCheckout);

    renderCart();
  }

  /* ---------- Apply Filters Button (no popup, ensures "all" shows products) ---------- */
const applyBtn = qs('#applyFilters');
if (applyBtn) {
  applyBtn.addEventListener('click', () => {
    // 1) category: prefer the .active-category element, otherwise fall back to a data attribute
    const activeCat = document.querySelector('.filter-category.active-category');
    selectedCategory = (activeCat?.dataset?.category || 'all').toLowerCase();

    // If user picked "all", clear any search query so search doesn't hide items
    if (selectedCategory === 'all') {
      // clear search query param and search bar if present
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch (e) { /* ignore if URL unavailable */ }

      if (searchBarEl) {
        searchBarEl.value = '';
      }
    }

    // 2) styles: collect active-style elements (if any)
    selectedStyles.clear();
    qsa('.filter-style.active-style').forEach(el => {
      const st = (el.dataset.style || '').toLowerCase().trim();
      if (st) selectedStyles.add(st);
    });

    // 3) colors: collect elements with .selected
    selectedColors.clear();
    qsa('.color .selected, .color .color-swatch.selected, .color button.selected').forEach(el => {
      let col = (el.dataset?.color) || el.getAttribute('alt') || el.getAttribute('title') || '';
      if (!col && el.closest) col = (el.closest('button')?.dataset?.color || '');
      col = String(col).toLowerCase().trim();
      if (col) selectedColors.add(col);
    });

    // 4) sizes: collect .size-btn.active
    selectedSizes.clear();
    qsa('.size-btn.active').forEach(btn => {
      const s = (btn.dataset.size || btn.textContent || '').toLowerCase().trim();
      if (s) selectedSizes.add(s);
    });

    // 5) price slider (if present)
    if (slider) {
      maxPrice = parseInt(slider.value || slider.getAttribute('value') || slider.max || 'Infinity', 10) || Infinity;
      if (value) value.textContent = slider.value;
    }

    // 6) hide any "no results" message before filtering (prevents a flash)
    try {
      if (noResultsEl) noResultsEl.style.display = 'none';
    } catch (e) { /* ignore */ }

    // 7) apply the filter (this will show all items if selectedCategory === 'all')
    filterProducts();

    // No popups, no alerts — just silent apply
  });
}
 



  /* =========================================================
     BOOTSTRAP — Run all page initializers
     ========================================================= */
  function boot() {
    const init = () => {
      if (isJQ()) initJQuerySearch();
      else initNativeSearch();
      initListingAndNav();
      initProductPage();
      initCart();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return { boot, serverRequest };

})();

/* =========================================================
   AUTO BOOT APP
   ========================================================= */
App.boot();
