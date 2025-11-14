const slider = document.getElementById("range");
  const value = document.getElementById("value");

  slider.oninput = function () {
    value.textContent = this.value;
  };


  // Basic cart data (mirrors visible UI)
    const cart = [
      { id:1, price:145, qty:1 },
      { id:2, price:180, qty:1 },
      { id:3, price:240, qty:1 }
    ];

    // Utility functions to update DOM numbers
    function calcTotals(){
      const subtotal = cart.reduce((s,i)=> s + i.price * i.qty, 0);
      const discount = Math.round(subtotal * 0.2); // 20% discount
      const delivery = 15;
      const total = subtotal - discount + delivery;

      document.getElementById('subtotalVal').textContent = `$${subtotal}`;
      document.getElementById('discountVal').textContent = `- $${discount}`;
      document.getElementById('deliveryVal').textContent = `$${delivery}`;
      document.getElementById('totalVal').textContent = `$${total}`;
    }

    // Wire quantity buttons
    function attachQtyHandlers(){
      document.querySelectorAll('.item').forEach(el => {
        const id = Number(el.dataset.id);
        const inc = el.querySelector('.qty-increase');
        const dec = el.querySelector('.qty-decrease');
        const countEl = el.querySelector('.count');

        inc?.addEventListener('click', () => {
          const item = cart.find(c=>c.id===id);
          if(!item) return;
          item.qty++;
          countEl.textContent = item.qty;
          calcTotals();
        });

        dec?.addEventListener('click', () => {
          const item = cart.find(c=>c.id===id);
          if(!item) return;
          if(item.qty > 1) item.qty--;
          countEl.textContent = item.qty;
          calcTotals();
        });
      });
    }

    // Remove item
    function removeItem(btn){
      const itemDiv = btn.closest('.item');
      if(!itemDiv) return;
      const id = Number(itemDiv.dataset.id);
      // remove from UI
      itemDiv.remove();
      // remove from data
      const idx = cart.findIndex(c=>c.id===id);
      if(idx>-1) cart.splice(idx,1);
      calcTotals();
    }

    // Promo (dummy)
    function applyPromo(){
      const code = document.getElementById('promoInput').value.trim();
      if(!code){
        alert('Enter a promo code (try: SAVE20)');
        return;
      }
      alert('Promo applied (demo only).');
    }

    function goCheckout(){
      alert('Proceed to checkout (demo).');
    }

    // initialize
    attachQtyHandlers();
    calcTotals();