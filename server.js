const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// simple token store in-memory (token -> { username, role })
const tokens = {};
const ordersFile = path.join(__dirname, 'orders.json');

function genToken(){ return crypto.randomBytes(24).toString('hex'); }
function readOrders(){ try{ if(!fs.existsSync(ordersFile)) return []; return JSON.parse(fs.readFileSync(ordersFile,'utf8')||'[]'); }catch(e){ return []; } }
function writeOrders(list){ try{ fs.writeFileSync(ordersFile, JSON.stringify(list, null, 2), 'utf8'); }catch(e){ console.error('Failed to write orders', e); } }

// ensure orders file exists
if(!fs.existsSync(ordersFile)) writeOrders([]);

function authFromHeader(req){ const h = req.headers.authorization || ''; if(!h.startsWith('Bearer ')) return null; const t = h.slice(7); return tokens[t] || null; }


app.get('/api/products', (req, res) => {
  // generate up to 100 products with categories, brands and images
  const categories = ['Mobiles', 'Computers', 'Audio', 'TVs', 'Accessories'];
  const brands = {
    'Mobiles': ['RealTech','Zenfone','Nova','Pixelon'],
    'Computers': ['ProBook','MegaTech','Ultra','NoteMax'],
    'Audio': ['SoundBeat','TuneX','BassPro','AudioLyft'],
    'TVs': ['ViewMax','CinemaV','ScreenPro','VisionX'],
    'Accessories': ['ChargeIt','SafeCase','PowerUp','Gizmo']
  };
  const images = {
    'Mobiles': '/images/phone.svg',
    'Computers': '/images/laptop.svg',
    'Audio': '/images/headphones.svg',
    'TVs': '/images/tv.svg',
    'Accessories': '/images/charger.svg'
  };

  const products = [];
  let id = 1;
  while (products.length < 1000) {
    const category = categories[(id - 1) % categories.length];
    const brandList = brands[category] || ['BrandX'];
    const brand = brandList[(id - 1) % brandList.length];
    // price ranges by category (approx)
    const base = category === 'Accessories' ? 200 : category === 'Audio' ? 1500 : category === 'TVs' ? 20000 : category === 'Computers' ? 35000 : 10000;
    const price = Math.round(base + Math.random() * base * 1.5);
    const rating = +(3 + Math.random() * 2).toFixed(1);
    const name = `${brand} ${category} Model ${1000 + id}`;
    products.push({ id: id, name, category, brand, price, rating, image: images[category] || '/images/phone.svg' });
    id++;
  }
  res.json(products);
});

// Checkout endpoint: supports a mock gateway by default. If you set USE_STRIPE=1
// and provide STRIPE_SECRET and STRIPE_PUBLISHABLE environment variables and
// install the `stripe` npm package, the endpoint will create a real PaymentIntent.
app.post('/api/checkout', async (req, res) => {
  const { cart, total } = req.body || {};
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Optional Stripe integration
  if (process.env.USE_STRIPE === '1' && process.env.STRIPE_SECRET) {
    try {
      // lazy-require so project doesn't crash when stripe isn't installed
      const Stripe = require('stripe');
      const stripe = Stripe(process.env.STRIPE_SECRET);
      const amount = Math.round((total || cart.reduce((s,i)=>s + (i.price||0) * (i.qty||1),0)) * 100); // in paise/cents
      const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'inr' });
      return res.json({ stripe: true, clientSecret: paymentIntent.client_secret, publishableKey: process.env.STRIPE_PUBLISHABLE || '' });
    } catch (err) {
      console.error('Stripe error:', err.message || err);
      // fall through to mock mode
    }
  }

  // Mock payment processing: immediately succeed and return a mock id
  const paymentId = `MOCKPAY_${Date.now()}`;
  // In a real app you'd persist the order and payment record here
  const response = { success: true, id: paymentId, status: 'succeeded', amount: total || cart.reduce((s,i)=>s + (i.price||0) * (i.qty||1),0) };
  if(req.body && req.body.address) response.address = req.body.address;

  // persist order (basic)
  try{
    const orders = readOrders();
    const order = { id: paymentId, createdAt: new Date().toISOString(), cart, amount: response.amount, address: req.body.address || null, status:'paid' };
    orders.push(order);
    writeOrders(orders);
    response.orderSaved = true;
  }catch(err){ console.error('Order save error', err); response.orderSaved = false; }

  return res.json(response);
});

// Simple login: demo users
const demoUsers = {
  user: { username: 'user', password: 'userpass', role: 'user' },
  host: { username: 'host', password: 'hostpass', role: 'host' }
};

app.post('/api/login', (req,res)=>{
  const { username, password } = req.body || {};
  if(!username || !password) return res.status(400).json({ error: 'username and password required' });
  const found = Object.values(demoUsers).find(u => u.username === username && u.password === password);
  if(!found) return res.status(401).json({ error: 'invalid credentials' });
  const token = genToken(); tokens[token] = { username: found.username, role: found.role, iat: Date.now() };
  return res.json({ token, role: found.role, username: found.username });
});

// Host-only orders endpoint
app.get('/api/orders', (req,res)=>{
  const auth = authFromHeader(req);
  if(!auth || auth.role !== 'host') return res.status(403).json({ error: 'forbidden' });
  const orders = readOrders();
  return res.json(orders.reverse());
});

app.listen(port, () => {
  console.log(`A J KART running at http://localhost:${port}`);
});
