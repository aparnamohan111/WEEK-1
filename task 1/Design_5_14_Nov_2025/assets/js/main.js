
/* =========================
   1) SHARED PRODUCTS ARRAY
   (used by multiple pages/modules)
   ========================= */
var products = [
  { id: 1, name: 'Gradient Graphic T-shirt', category: 'tshirt', price: 250, oldPrice: 300, colors: ['black', 'white'], sizes: ['XS','S','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ81VG-48DpYAvrm-Yh_uJJfPeqhdZTcOWySQ&s' },
  { id: 2, name: 'Polo with Tipping Details', category: 'tshirt', price: 150, oldPrice: 0, colors: ['black'], sizes: ['XS','S','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJudalF7fJjMGYMHiGFh6187h9ro-grlJkg&s' },
  { id: 3, name: 'Light blue formal shirt', category: 'shirt', price: 500, oldPrice: 0, colors: ['blue'], sizes: ['XS','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjUCwwrVS_igbyyA6NdUBpL9gAjUWZ1dixkQ&s' },
  { id: 5, name: 'Skinny fit jeans', category: 'jeans', price: 505, oldPrice: 0, colors: ['blue'], sizes: ['XS','M'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqRfyfLSoHgSxo2lakbFSi-EuNV1boGqjazg&s' },
  { id: 6, name: 'Sleeve Striped t-shirt', category: 'tshirt', price: 100, oldPrice: 0, colors: ['blue','green'], sizes: ['XS','S','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQB5_3mVWWRIxk70miODivIjaCmEYj_QSIH9A&s' },
  { id: 7, name: 'Shorts', category: 'shorts', price: 250, oldPrice: 0, colors: ['blue'], sizes: ['XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHC_dJ9fQEXeONdwtEx-yb2TxEKbkKNO-zWw&s' },
  { id: 8, name: 'Green shirt', category: 'shirt', price: 400, oldPrice: 0, colors: ['green'], sizes: ['XS','S','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk7s5WyCTBz3tBn2yyCZq2RdVlgYXKImnU5w&s' },
  { id: 9, name: 'Black shorts', category: 'shorts', price: 250, oldPrice: 0, colors: ['black'], sizes: ['XS','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXlHhDZUKQFqrhy2M7smdfh_uUZEaiiseytQ&s' },
  { id: 10, name: 'Baggy jeans', category: 'jeans', price: 550, oldPrice: 0, colors: ['blue'], sizes: ['XS','S','M','L','XL'], img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyn4Kf4u7bp4pdliL8VCoiuW_J_tnSGtNXzw&s' }
];

/* =========================
   2) UTILITIES
   Small helpers used across modules
   ========================= */
function safeParseJSON(str) {
  try { return JSON.parse(str); } catch (e) { return null; }
}

/* =========================
   3) INDEX PAGE MODULE
   - search input (live suggestions)
   - click result -> category.html?search=...
   ========================= */
(function indexSearch() {
  var bar = document.getElementById('search-bar');
  var results = document.getElementById('search-results');

  if (!bar || !results) {
    console.log('[main.js] indexSearch skipped - missing elements');
    return;
  }

  // sample names for suggestion matching
  var sample = products.map(function(p){ return p.name; });

  bar.addEventListener('input', function(e){
    var q = (e.target.value || '').trim().toLowerCase();
    if (!q) { results.style.display = 'none'; return; }
    var items = sample.filter(function(x){ return x.toLowerCase().indexOf(q) !== -1; }).slice(0,8);
    if (!items.length) {
      results.innerHTML = '<div class="result-item">No results</div>';
      results.style.display = 'block';
      return;
    }
    results.innerHTML = items.map(function(it){ return '<div class="result-item" tabindex="0">'+it+'</div>'; }).join('');
    results.style.display = 'block';
  });

  results.addEventListener('click', function(ev){
    var item = ev.target.closest('.result-item');
    if (!item) return;
    var q = item.textContent.trim();
    window.location.href = 'category.html?search=' + encodeURIComponent(q);
  });

  // hide suggestions when clicking outside the search wrapper
  document.addEventListener('click', function(ev){
    var wrapper = document.querySelector('.nav-search-wrapper');
    if (!wrapper || !wrapper.contains(ev.target)) {
      results.style.display = 'none';
    }
  });

  console.log('[main.js] indexSearch initialized');
})();

/* =========================
   4) CATEGORY PAGE MODULE
   - #productGrid rendering
   - filters: category, price range, color, size
   - sort, reset, view-all handling
   ========================= */
(function categoryModule() {
  var grid = document.getElementById('productGrid');
  if (!grid) { console.log('[main.js] categoryModule skipped - no #productGrid'); return; }

  /* ----- DOM refs used by this module ----- */
  var range = document.getElementById('range');
  var rangeVal = document.getElementById('rangeVal');
  var noResults = document.getElementById('noResults');
  var sortEl = document.getElementById('sortBy');

  /* ----- render helper ----- */
  function render(list) {
    if (!list || !list.length) {
      grid.innerHTML = '';
      if (noResults) noResults.classList.remove('d-none');
      return;
    }
    if (noResults) noResults.classList.add('d-none');

    grid.innerHTML = list.map(function(p){
      return '<div class="col-6 col-md-4 col-lg-3">\
        <article class="product-card">\
          <a href="product.html?id='+p.id+'" class="d-block product-link" data-id="'+p.id+'">\
            <img src="'+p.img+'" alt="'+p.name+'" loading="lazy">\
          </a>\
          <div class="card-body">\
            <div class="d-flex justify-content-between align-items-start">\
              <h6 class="mb-1" style="font-weight:700">'+p.name+'</h6>\
              <div class="muted">$'+p.price+'</div>\
            </div>\
            <div class="muted small">'+p.category+'</div>\
          </div>\
        </article>\
      </div>';
    }).join('');
  }

  /* ----- Save clicked product to localStorage before navigation ----- */
  grid.addEventListener('click', function(e){
    var a = e.target.closest('.product-link');
    if (!a) return;
    var id = a.getAttribute('data-id');
    var prod = products.find(function(p){ return String(p.id) === String(id); });
    if (prod) {
      try {
        localStorage.setItem('selectedProduct', JSON.stringify({ id: prod.id, ts: Date.now(), data: prod }));
        console.log('[main.js] selectedProduct saved for id', prod.id);
      } catch (err) {
        console.warn('[main.js] could not save selectedProduct', err);
      }
    }
    // allow navigation to proceed
  });

  /* ----- Category activation (UI) ----- */
  function setActiveCategory(cat) {
    var nodes = document.querySelectorAll('.model-item');
    Array.prototype.forEach.call(nodes, function(b){
      var key = (b.getAttribute('data-category') || (b.dataset && b.dataset.category) || '').toLowerCase();
      if (key === (cat||'').toLowerCase()) {
        b.classList.add('active-category');
      } else {
        b.classList.remove('active-category');
      }
    });
  }

  document.addEventListener('click', function(e){
    var el = e.target.closest('.model-item');
    if (!el) return;
    var cat = el.getAttribute('data-category') || (el.dataset && el.dataset.category) || (el.textContent || '').trim().toLowerCase();
    setActiveCategory(cat);
    applyFilters();
  });

  /* ----- range debounce and mobile range wiring ----- */
  function debounce(fn, wait) { var t; return function(){ var args = arguments; clearTimeout(t); t = setTimeout(function(){ fn.apply(null, args); }, wait); }; }
  var onRange = debounce(function(){ if (range && rangeVal) rangeVal.textContent = '$' + range.value; applyFilters(); }, 120);
  if (range) range.addEventListener('input', onRange);

  var rangeMobile = document.getElementById('rangeMobile');
  var rangeValMobile = document.getElementById('rangeValMobile');
  if (rangeMobile) rangeMobile.addEventListener('input', function(){ if (rangeValMobile) rangeValMobile.textContent = '$' + rangeMobile.value; });

  /* ----- color and size toggles ----- */
  function toggleSelected(el) { el.classList.toggle('selected'); }
  document.addEventListener('click', function(e){
    var s = e.target.closest('.color-swatch');
    if (!s) return;
    toggleSelected(s);
    applyFilters();
  });

  document.addEventListener('click', function(e){
    var sb = e.target.closest('.size-btn');
    if (!sb) return;
    sb.classList.toggle('active');
    applyFilters();
  });

  /* ----- control buttons: apply, reset, view all ----- */
  var applyFiltersBtn = document.getElementById('applyFilters');
  var resetFiltersBtn = document.getElementById('resetFilters');
  var viewAllBtn = document.getElementById('viewAll');
  if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
  if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', function(){ resetAll(); render(products); });
  if (viewAllBtn) viewAllBtn.addEventListener('click', removeSearchParamAndShowAll);

  var applyMobile = document.getElementById('applyFiltersMobile');
  var resetMobile = document.getElementById('resetFiltersMobile');
  var viewAllMobile = document.getElementById('viewAllMobile');
  if (applyMobile) applyMobile.addEventListener('click', applyFilters);
  if (resetMobile) resetMobile.addEventListener('click', function(){ resetAll(); render(products); });
  if (viewAllMobile) viewAllMobile.addEventListener('click', removeSearchParamAndShowAll);

  if (sortEl) sortEl.addEventListener('change', function(e){ sortAndRender(e.target.value); });

  /* ----- reset helper ----- */
  function resetAll() {
    var nodes = document.querySelectorAll('.model-item');
    Array.prototype.forEach.call(nodes, function(b){ b.classList.remove('active-category'); });
    var allBtn = document.querySelector('.model-item[data-category="all"]');
    if (allBtn) allBtn.classList.add('active-category');
    if (range) { range.value = 500; if (rangeVal) rangeVal.textContent = '$' + range.value; }
    if (rangeMobile) { rangeMobile.value = 500; if (rangeValMobile) rangeValMobile.textContent = '$' + rangeMobile.value; }
    var swatches = document.querySelectorAll('.color-swatch');
    Array.prototype.forEach.call(swatches, function(s){ s.classList.remove('selected'); });
    var sizes = document.querySelectorAll('.size-btn');
    Array.prototype.forEach.call(sizes, function(s){ s.classList.remove('active'); });
  }

  /* ----- remove ?search param and show all products ----- */
  function removeSearchParamAndShowAll() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('search')) {
      params.delete('search');
      var newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    resetAll();
    render(products);
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ----- apply filters (core filtering logic) ----- */
  function applyFilters() {
    var activeNode = document.querySelector('.model-item.active-category');
    var activeCat = activeNode ? (activeNode.getAttribute('data-category') || (activeNode.dataset && activeNode.dataset.category) || 'all') : 'all';
    var maxPrice = parseInt(range && range.value, 10) || 9999;
    var selectedColors = Array.prototype.map.call(document.querySelectorAll('.color-swatch.selected'), function(n){ return n.getAttribute('data-color'); });
    var selectedSizes = Array.prototype.map.call(document.querySelectorAll('.size-btn.active'), function(n){ return n.getAttribute('data-size'); });

    var out = products.filter(function(p){
      if (activeCat !== 'all' && p.category !== activeCat) return false;
      if (p.price > maxPrice) return false;
      if (selectedColors.length && p.colors.every(function(c){ return selectedColors.indexOf(c) === -1; })) return false;
      if (selectedSizes.length && p.sizes.every(function(s){ return selectedSizes.indexOf(s) === -1; })) return false;
      return true;
    });

    var sortVal = sortEl && sortEl.value;
    if (sortVal) out = sortProducts(out, sortVal);
    render(out);
  }

  /* ----- sorting helpers ----- */
  function sortProducts(list, mode) {
    if (mode === 'price_asc') return list.slice().sort(function(a,b){ return a.price - b.price; });
    if (mode === 'price_desc') return list.slice().sort(function(a,b){ return b.price - a.price; });
    return list;
  }

  function sortAndRender(mode) {
    var base = products.slice();
    var sorted = sortProducts(base, mode);
    render(sorted);
  }

  /* ----- initial reset + handle ?search param on category page ----- */
  resetAll();

  var params = new URLSearchParams(window.location.search);
  var qParam = params.get('search');
  if (qParam && qParam.trim()) {
    var searchInput = document.getElementById('search-bar');
    if (searchInput) searchInput.value = qParam;
    var q = qParam.trim().toLowerCase();
    var matched = products.filter(function(p){ return p.name.toLowerCase().indexOf(q) !== -1; });
    if (matched.length) {
      setActiveCategory(matched[0].category);
      render(matched);
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      render([]);
    }
  } else {
    render(products);
  }

  console.log('[main.js] categoryModule initialized');
})();

/* =========================
   5) PRODUCT PAGE MODULE
   - uses selectedProduct (localStorage) or URL params
   - renders sizes, thumbs, qty controls
   - add-to-cart saves cart_demo_v1 and redirects to cart.html
   ========================= */
(function productPageInit() {
  var mainImg = document.getElementById('product-main-image');
  var titleEl = document.getElementById('product-title');
  if (!mainImg && !titleEl) { console.log('[main.js] productPageInit skipped - not a product page'); return; }

  /* ----- DOM refs ----- */
  var priceEl = document.getElementById('price');
  var oldPriceEl = document.getElementById('old-price');
  var sizeList = document.getElementById('size-list');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumb'));
  var plusBtn = document.getElementById('plus');
  var minusBtn = document.getElementById('minus');
  var qtyEl = document.getElementById('qty');
  var addBtn = document.getElementById('addToCart');
  var msg = document.getElementById('msg');

  var qty = 1;
  function setQty(n) { qty = Math.max(1, parseInt(n,10) || 1); if (qtyEl) qtyEl.textContent = String(qty); }

  /* ----- Get product from localStorage or URL params ----- */
  function getProductFromStorageOrURL() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');

    try {
      var raw = localStorage.getItem('selectedProduct');
      var saved = raw ? safeParseJSON(raw) : null;
      if (saved && saved.data) {
        var isFresh = !saved.ts || (Date.now() - saved.ts) < (1000 * 60 * 60 * 24);
        if (isFresh) {
          if (!id || String(saved.data.id) === String(id)) {
            console.log('[main.js] using selectedProduct from localStorage', saved.data.id);
            return saved.data;
          }
        }
      }
    } catch (e) {
      console.warn('[main.js] reading selectedProduct failed', e);
    }

    if (id) {
      var p = products.find(function(x){ return String(x.id) === String(id); });
      if (p) { console.log('[main.js] found product by id', p.id); return p; }
    }

    var name = params.get('name');
    var price = params.get('price');
    var img = params.get('img');
    if (name || price || img) {
      console.log('[main.js] using legacy URL params');
      return { id: null, name: name ? decodeURIComponent(name) : 'Product', price: price ? Number(price) : 0, oldPrice: null, sizes: [], colors: [], img: img ? decodeURIComponent(img) : '' };
    }

    console.warn('[main.js] no product found');
    return null;
  }

  /* ----- render sizes UI ----- */
  function renderSizes(sizesArr) {
    if (!sizeList) return;
    if (Array.isArray(sizesArr) && sizesArr.length) {
      sizeList.innerHTML = '';
      sizesArr.forEach(function(sz){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'size-btn';
        btn.setAttribute('role','radio');
        btn.setAttribute('aria-checked','false');
        btn.setAttribute('data-size', sz);
        btn.textContent = sz;
        btn.addEventListener('click', function(){
          var current = sizeList.querySelectorAll('.size-btn');
          Array.prototype.forEach.call(current, function(x){ x.classList.remove('active'); x.setAttribute('aria-checked','false'); });
          btn.classList.add('active'); btn.setAttribute('aria-checked','true');
        });
        btn.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }});
        sizeList.appendChild(btn);
      });
    }
  }

  /* ----- wire thumbnails to main image ----- */
  function wireThumbs(imgSrc) {
    if (!thumbs.length) return;
    thumbs.forEach(function(t){
      t.style.cursor = 'pointer';
      t.addEventListener('click', function(){ if (mainImg) mainImg.src = imgSrc; });
    });
  }

  /* ----- populate product UI ----- */
  function populate(product) {
    if (!product) return;
    if (titleEl) titleEl.textContent = product.name || 'Product';
    if (priceEl) priceEl.textContent = (product.price != null) ? String(product.price) : '0';
    if (oldPriceEl) {
      if (product.oldPrice) oldPriceEl.textContent = String(product.oldPrice);
      else {
        var del = null;
        if (oldPriceEl && typeof oldPriceEl.closest === 'function') del = oldPriceEl.closest('del');
        if (del && del.style) del.style.display = 'none';
      }
    }
    if (mainImg && product.img) mainImg.src = product.img;
    renderSizes(product.sizes || []);
    wireThumbs(product.img || (mainImg ? mainImg.src : ''));
    if (addBtn) addBtn.setAttribute('data-product-id', product.id || '');
    console.log('[main.js] populated UI for product', product.id || product.name);
  }

  /* ----- qty controls ----- */
  if (plusBtn) plusBtn.addEventListener('click', function(){ setQty(qty + 1); });
  if (minusBtn) minusBtn.addEventListener('click', function(){ setQty(qty - 1); });

  /* ----- add-to-cart: save cart and redirect to cart.html ----- */
  if (addBtn) {
    addBtn.addEventListener('click', function(){
      if (msg) { msg.classList.add('show'); setTimeout(function(){ msg.classList.remove('show'); }, 800); }

      var selectedSizeEl = document.querySelector('#size-list .size-btn.active') || document.querySelector('#size-list .size-btn[aria-checked="true"]');
      var selectedSize = selectedSizeEl ? selectedSizeEl.getAttribute('data-size') : null;

      var prodId = addBtn.getAttribute('data-product-id') || null;
      var title = titleEl ? titleEl.textContent.trim() : '';
      var priceValue = 0;
      if (priceEl) {
        var ptxt = (priceEl.textContent || '').replace(/[^0-9.]/g,'').trim();
        priceValue = ptxt ? Number(ptxt) : 0;
      }
      var imgSrc = mainImg ? mainImg.src : '';

      var item = {
        id: prodId,
        name: title,
        price: priceValue,
        qty: typeof qty === 'number' ? qty : (parseInt(document.getElementById('qty') && document.getElementById('qty').textContent,10) || 1),
        size: selectedSize,
        img: imgSrc
      };

      try {
        var cart = safeParseJSON(localStorage.getItem('cart_demo_v1')) || [];

        var existingIndex = -1;
        for (var i = 0; i < cart.length; i++) {
          if (String(cart[i].id) === String(item.id) && ((cart[i].size || '') === (item.size || ''))) {
            existingIndex = i;
            break;
          }
        }
        if (existingIndex > -1) {
          cart[existingIndex].qty = (parseInt(cart[existingIndex].qty,10) || 0) + item.qty;
        } else {
          cart.push(item);
        }

        localStorage.setItem('cart_demo_v1', JSON.stringify(cart));
        console.log('[main.js] addToCart -> saved cart_demo_v1', cart);
      } catch (e) {
        console.warn('[main.js] addToCart: could not save to localStorage', e);
      }

      window.location.href = 'cart.html';
    });
  }

  /* ----- DOMContentLoaded: initialize qty and populate ----- */
  document.addEventListener('DOMContentLoaded', function(){
    setQty(1);
    var product = getProductFromStorageOrURL();
    if (product) populate(product);
  });

  console.log('[main.js] productPageInit ready');
})();

/* =========================
   6) CART PAGE MODULE
   - renders cart_demo_v1 to #cartList
   - qty controls, remove item, promo, checkout
   ========================= */
(function cartModule() {
  function fmt(v) { return '$' + Number(v).toFixed(2); }

  /* ----- totals + checkout wiring (checkout button inside recalcTotals) ----- */
  function recalcTotals() {
    var items = document.querySelectorAll('#cartList .item');
    var subtotal = 0;
    Array.prototype.forEach.call(items, function(it){
      var unit = parseFloat(it.getAttribute('data-price') || (it.querySelector('.price') && it.querySelector('.price').dataset && it.querySelector('.price').dataset.unit) || 0) || 0;
      var qty = parseInt(it.querySelector('.count') && it.querySelector('.count').textContent || '1', 10) || 1;
      subtotal += unit * qty;
    });

    var subtotalEl = document.getElementById('subtotalVal');
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);

    var summary = document.getElementById('summaryCard');
    var discountPercent = 0;
    if (summary && summary.dataset && summary.dataset.discount) discountPercent = parseFloat(summary.dataset.discount) || 0;
    var discountValue = subtotal * (discountPercent / 100);
    var discountValEl = document.getElementById('discountVal');
    if (discountValEl) discountValEl.textContent = '- ' + fmt(discountValue);
    var discountPercentEl = document.getElementById('discountPercent');
    if (discountPercentEl) discountPercentEl.textContent = discountPercent + '%';

    var delivery = subtotal === 0 ? 0 : (subtotal < 500 ? 15 : 0);
    var deliveryValEl = document.getElementById('deliveryVal');
    if (deliveryValEl) deliveryValEl.textContent = fmt(delivery);

    var totalValEl = document.getElementById('totalVal');
    if (totalValEl) totalValEl.textContent = fmt(subtotal - discountValue + delivery);

    // checkout: save order, clear cart and redirect to thank-you page
    var checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function (ev) {
        // optional: prevent double clicks
        checkoutBtn.disabled = true;

        try {
          // read current cart
          var raw = localStorage.getItem('cart_demo_v1') || '[]';
          var cart = [];
          try { cart = JSON.parse(raw); } catch (e) { cart = []; }

          // create a simple order object (timestamp + items + totals)
          var subtotal = 0;
          cart.forEach(function (it) { subtotal += (Number(it.price || 0) * (parseInt(it.qty || 1, 10) || 1)); });

          var order = {
            id: 'ORD-' + Date.now(),
            ts: Date.now(),
            items: cart,
            subtotal: subtotal,
            delivery: subtotal === 0 ? 0 : (subtotal < 500 ? 15 : 0),
            discountPercent: (document.getElementById('summaryCard') && document.getElementById('summaryCard').dataset && parseFloat(document.getElementById('summaryCard').dataset.discount || 0)) || 0
          };
          order.total = order.subtotal - (order.subtotal * (order.discountPercent / 100)) + order.delivery;

          // save order history (optional) so you can inspect recent orders
          var ordersRaw = localStorage.getItem('orders') || '[]';
          var orders = [];
          try { orders = JSON.parse(ordersRaw); } catch (e) { orders = []; }
          orders.push(order);
          localStorage.setItem('orders', JSON.stringify(orders));

          // clear the cart
          localStorage.removeItem('cart_demo_v1');

          // redirect to checkout/thank-you page
          window.location.href = 'checkout.html';
        } catch (err) {
          console.warn('[main.js] checkout error', err);
          // fallback: still redirect but don't clear to avoid data loss
          window.location.href = 'checkout.html';
        }
      });
    }
  }

  /* ----- initCart: render list, wire qty + remove ----- */
  function initCart() {
    var cartList = document.getElementById('cartList');
    if (!cartList) { console.log('[main.js] cartModule skipped - no #cartList'); return; }

    function renderCart() {
      var raw = localStorage.getItem('cart_demo_v1') || '[]';
      var cart = [];
      try { cart = JSON.parse(raw); } catch(e){ cart = []; }

      if (!cart || !cart.length) {
        cartList.innerHTML = '<div class="no-items">Your cart is empty.</div>';
        recalcTotals();
        return;
      }

      cartList.innerHTML = cart.map(function(it, idx){
        var priceForAttr = Number(it.price || 0);
        var image = it.img || 'https://via.placeholder.com/80';
        var qtyVal = parseInt(it.qty || 1, 10);
        return '<article class="item" data-id="'+(it.id||'')+'" data-price="'+priceForAttr+'" aria-label="Cart item — '+(it.name||'')+'">\
          <div class="thumb"><img loading="lazy" src="'+image+'" alt="'+(it.name||'')+'" class="cart-thumb"></div>\
          <div class="item-info">\
            <div class="item-title">'+(it.name||'')+'</div>\
            <div class="meta small">'+(it.size ? ('Size: <strong>'+it.size+'</strong>') : '')+'</div>\
            <div class="price-row">\
              <div class="price" data-unit="'+priceForAttr+'">$'+priceForAttr+'</div>\
              <div class="controls">\
                <div class="qty" role="group" aria-label="Quantity">\
                  <button class="qty-decrease" aria-label="Decrease quantity">−</button>\
                  <div class="count" aria-live="polite">'+qtyVal+'</div>\
                  <button class="qty-increase" aria-label="Increase quantity">+</button>\
                </div>\
              </div>\
            </div>\
          </div>\
          <button class="trash" title="Remove item" aria-label="Remove item">\
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">\
              <polyline points="3 6 5 6 21 6"></polyline>\
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>\
              <path d="M10 11v6"></path><path d="M14 11v6"></path>\
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>\
            </svg>\
          </button>\
        </article>';
      }).join('');

      // wire events for each rendered item
      var itemEls = cartList.querySelectorAll('.item');
      Array.prototype.forEach.call(itemEls, function(itemEl, index){
        var dec = itemEl.querySelector('.qty-decrease');
        var inc = itemEl.querySelector('.qty-increase');
        var countEl = itemEl.querySelector('.count');

        if (countEl && !countEl.textContent.trim()) countEl.textContent = '1';

        if (dec) dec.addEventListener('click', function(){
          var c = parseInt(countEl.textContent, 10) || 1;
          if (c > 1) {
            c--; countEl.textContent = c;
            updateCartItemQuantity(index, c);
            recalcTotals();
          }
        });

        if (inc) inc.addEventListener('click', function(){
          var c = parseInt(countEl.textContent, 10) || 1;
          c++; countEl.textContent = c;
          updateCartItemQuantity(index, c);
          recalcTotals();
        });

        var trashBtn = itemEl.querySelector('.trash');
        if (trashBtn) trashBtn.addEventListener('click', function(){
          removeCartItem(index);
        });
      });

      recalcTotals();
    }

    function updateCartItemQuantity(idx, newQty) {
      try {
        var cart = JSON.parse(localStorage.getItem('cart_demo_v1') || '[]');
        if (cart[idx]) {
          cart[idx].qty = newQty;
          localStorage.setItem('cart_demo_v1', JSON.stringify(cart));
        }
      } catch (e) { console.warn('updateCartItemQuantity error', e); }
    }

    function removeCartItem(idx) {
      try {
        var cart = JSON.parse(localStorage.getItem('cart_demo_v1') || '[]');
        if (cart && cart.length > idx) {
          cart.splice(idx,1);
          localStorage.setItem('cart_demo_v1', JSON.stringify(cart));
          renderCart();
        }
      } catch (e) { console.warn('removeCartItem error', e); }
    }

    // compatibility: support existing inline onclick="removeItem(this)" usage
    window.removeItem = function(el) {
      var article = el.closest('.item');
      if (!article) return;
      var id = article.getAttribute('data-id');
      var sizeEl = article.querySelector('.meta strong');
      var sizeText = sizeEl ? sizeEl.textContent : null;
      try {
        var cart = JSON.parse(localStorage.getItem('cart_demo_v1') || '[]');
        var idx = -1;
        for (var i = 0; i < cart.length; i++) {
          if (String(cart[i].id) === String(id) && ((cart[i].size || '') === (sizeText || ''))) {
            idx = i; break;
          }
        }
        if (idx === -1) {
          for (var j = 0; j < cart.length; j++) {
            if (String(cart[j].id) === String(id)) { idx = j; break; }
          }
        }
        if (idx > -1) {
          cart.splice(idx,1);
          localStorage.setItem('cart_demo_v1', JSON.stringify(cart));
          renderCart();
        } else {
          article.remove();
          recalcTotals();
        }
      } catch(e) { console.warn('removeItem fallback error', e); article.remove(); recalcTotals(); }
    };

    // initial render
    renderCart();
  }

  initCart();

  /* ----- promo + checkout hooking ----- */
  var applyPromoBtn = document.getElementById('applyPromoBtn');
  if (applyPromoBtn) applyPromoBtn.addEventListener('click', function(){ applyPromo(); });

  // keep applyPromo function in global scope for reuse:
  window.applyPromo = function() {
    var input = document.getElementById('promoInput');
    var code = (input && input.value || '').trim().toUpperCase();
    var summary = document.getElementById('summaryCard');
    if (!code) {
      if (summary) summary.dataset.discount = 0;
      alert('Please enter a promo code.');
      recalcTotals();
      return;
    }
    var promos = { 'SAVE10': 10, 'SAVE20': 20, 'SAVE30': 30 , 'SAVE40': 40 , 'SAVE50': 50 ,'SAVE60': 60 };
    if (promos[code]) {
      if (summary) summary.dataset.discount = promos[code];
      alert('Promo applied: ' + promos[code] + '% off');
    } else {
      if (summary) summary.dataset.discount = 0;
      alert('Invalid promo code');
    }
    recalcTotals();
  };
})();

/* ===== end of main.js ===== */
