async function fetchProducts() {
  const res = await fetch('/api/products');
  return await res.json();
}

function formatPrice(p) {
  return '₹' + p.toLocaleString('en-IN');
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="price">${formatPrice(p.price)}</div>
      <button data-id="${p.id}" class="add">Add to cart</button>
    `;
    grid.appendChild(card);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const products = await fetchProducts();
  let current = products.slice();
  let filtered = products.slice();
  let page = 1;
  const PAGE_SIZE = 12;

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const categoryFilters = document.getElementById('categoryFilters');
  const sidebarCategories = document.getElementById('sidebarCategories');

  function createCategoryBtn(name){
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.addEventListener('click', () => {
      if(name === 'All') { current = products.slice(); } else { current = products.filter(p => p.category === name); }
      renderProducts(current);
    });
    return btn;
  }

  categoryFilters.appendChild(createCategoryBtn('All'));
  sidebarCategories.appendChild(createCategoryBtn('All'));
  categories.forEach(c => { categoryFilters.appendChild(createCategoryBtn(c)); sidebarCategories.appendChild(createCategoryBtn(c)); });

  // populate brands
  const brandSelect = document.getElementById('brandFilter');
  const brands = Array.from(new Set(products.map(p => p.brand))).sort();
  brands.forEach(b => { const o = document.createElement('option'); o.value=b; o.textContent=b; brandSelect.appendChild(o); });

  function applyFiltersAndSort(){
    const selectedBrand = document.getElementById('brandFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    // start from current category selection
    filtered = current.slice();
    if(selectedBrand){ filtered = filtered.filter(p => p.brand === selectedBrand); }
    if(priceRange){ const [min,max] = priceRange.split('-').map(Number); filtered = filtered.filter(p=>p.price >= min && p.price <= max); }
    if(sortBy === 'price-asc'){ filtered.sort((a,b)=>a.price-b.price); }
    else if(sortBy === 'price-desc'){ filtered.sort((a,b)=>b.price-a.price); }
    else if(sortBy === 'rating-desc'){ filtered.sort((a,b)=>b.rating-a.rating); }
    page = 1; renderPage();
  }

  function renderPage(){
    const start = (page-1)*PAGE_SIZE; const end = start+PAGE_SIZE;
    renderProducts(filtered.slice(start,end));
    renderPagination();
  }

  function renderPagination(){
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    let pager = document.getElementById('pager');
    if(!pager){ pager = document.createElement('div'); pager.id='pager'; pager.className='pager'; document.querySelector('.product-area').appendChild(pager); }
    pager.innerHTML = '';
    const prev = document.createElement('button'); prev.textContent='◀ Prev'; prev.disabled = page===1; prev.addEventListener('click', ()=>{ page=Math.max(1,page-1); renderPage(); });
    const next = document.createElement('button'); next.textContent='Next ▶'; next.disabled = page===totalPages; next.addEventListener('click', ()=>{ page=Math.min(totalPages,page+1); renderPage(); });
    const info = document.createElement('span'); info.textContent = ` Page ${page} of ${totalPages} `;
    pager.appendChild(prev); pager.appendChild(info); pager.appendChild(next);
  }

  renderPage();

  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    current = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    applyFiltersAndSort();
  });

  // wire controls
  brandSelect.addEventListener('change', applyFiltersAndSort);
  document.getElementById('priceFilter').addEventListener('change', applyFiltersAndSort);
  document.getElementById('sortBy').addEventListener('change', applyFiltersAndSort);

  // Cart implementation (localStorage)
  const CART_KEY = 'flipkart_clone_cart_v1';
  function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||[] }catch(e){return[]} }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
  function addToCart(id){ const cart = loadCart(); const prod = products.find(p=>p.id==id); if(!prod) return; const existing = cart.find(i=>i.id==id); if(existing){ existing.qty++; } else { cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, qty: 1 }); } saveCart(cart); }

  document.body.addEventListener('click', (e)=>{
    if(e.target && e.target.classList.contains('add')){
      const id = parseInt(e.target.getAttribute('data-id'),10);
      addToCart(id);
    }
  });

  // Cart drawer controls
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const closeCart = document.getElementById('closeCart');
  cartBtn.addEventListener('click', ()=>{ cartDrawer.classList.add('open'); updateCartUI(); });
  closeCart.addEventListener('click', ()=>{ cartDrawer.classList.remove('open'); });

  function updateCartUI(){
    const cart = loadCart();
    document.getElementById('cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
    const list = document.getElementById('cartItems'); list.innerHTML='';
    let total = 0;
    cart.forEach(item=>{
      total += item.price * item.qty;
      const el = document.createElement('div'); el.className='cart-item';
      el.innerHTML = `<img src="${item.image}" alt="${item.name}"><div><div style="font-weight:700">${item.name}</div><div>₹${item.price.toLocaleString('en-IN')} x ${item.qty}</div><div style="margin-top:6px"><button data-id="${item.id}" class="decrease">-</button> <button data-id="${item.id}" class="increase">+</button> <button data-id="${item.id}" class="remove">Remove</button></div></div>`;
      list.appendChild(el);
    });
    document.getElementById('cartTotal').textContent = '₹' + total.toLocaleString('en-IN');
    // set editable amount field
    const amtInput = document.getElementById('cartAmount');
    if(amtInput) amtInput.value = total.toFixed(2);
  }

  document.getElementById('cartItems').addEventListener('click', (e)=>{
    const id = parseInt(e.target.getAttribute('data-id'),10);
    if(e.target.classList.contains('increase')){
      const cart = loadCart(); const it = cart.find(i=>i.id===id); if(it){ it.qty++; saveCart(cart); }
    } else if(e.target.classList.contains('decrease')){
      const cart = loadCart(); const it = cart.find(i=>i.id===id); if(it){ it.qty = Math.max(1,it.qty-1); saveCart(cart); }
    } else if(e.target.classList.contains('remove')){
      let cart = loadCart(); cart = cart.filter(i=>i.id!==id); saveCart(cart);
    }
  });

  document.getElementById('checkoutBtn').addEventListener('click', ()=>{
    const cart = loadCart();
    if(cart.length === 0){ alert('Your cart is empty'); return; }
    // collect address
    const name = document.getElementById('addrName').value.trim();
    const line1 = document.getElementById('addrLine1').value.trim();
    const city = document.getElementById('addrCity').value.trim();
    const state = document.getElementById('addrState').value.trim();
    const pincode = document.getElementById('addrPincode').value.trim();
    if(!name || !line1 || !city || !state || !pincode){ alert('Please fill all address fields.'); return; }
    const amtInput = document.getElementById('cartAmount');
    let total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
    let submittedAmount = parseFloat(amtInput && amtInput.value ? amtInput.value : total);
    if(isNaN(submittedAmount) || submittedAmount <= 0){ alert('Enter a valid amount'); return; }
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true; checkoutBtn.textContent = 'Processing...';
    fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ cart, total: submittedAmount, address: { name, line1, city, state, pincode } }) })
      .then(r=>r.json())
      .then(data=>{
        if(data && (data.success || data.stripe)){
          if(data.stripe){
            // Stripe flow: return client secret and publishable key (integration step)
            alert('Stripe payment created (demo). In a real integration you would use Stripe.js to complete payment.');
            // For demo, we clear cart too
          } else {
            alert('Payment succeeded. Order id: ' + (data.id||'N/A'));
          }
          localStorage.removeItem(CART_KEY);
          updateCartUI();
          document.getElementById('cartDrawer').classList.remove('open');
        } else {
          alert('Payment failed: ' + (data && data.error ? data.error : 'unknown'));
        }
      })
      .catch(err=>{ alert('Checkout error: ' + err.message); })
      .finally(()=>{ checkoutBtn.disabled = false; checkoutBtn.textContent = 'Checkout'; });
  });

  // initial cart UI
  updateCartUI();
});
