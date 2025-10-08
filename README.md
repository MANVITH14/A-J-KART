# A J KART

A minimal Flipkart-like static frontend served by an Express server.

Run locally:

```powershell
cd c:\Users\HP\flipkart
npm install
npm start
```

Open http://localhost:3000

Checkout / Payment
-------------------
This project includes a mock payment endpoint at `POST /api/checkout` that accepts a JSON body of `{ cart, total }` and returns a fake success response. The frontend calls this endpoint when you click the Checkout button in the cart drawer.

Optional: integrate Stripe
1. Install the Stripe library:

```powershell
npm install stripe
```

2. Set environment variables before starting the server (PowerShell example):

```powershell
$env:USE_STRIPE = '1';
$env:STRIPE_SECRET = 'sk_test_...';
$env:STRIPE_PUBLISHABLE = 'pk_test_...';
npm start
```

With `USE_STRIPE=1` and `STRIPE_SECRET` set, the `/api/checkout` endpoint will attempt to create a PaymentIntent and return `clientSecret` and `publishableKey` for client-side completion (you will still need to integrate Stripe.js to finalize the payment flow).

Host features
-------------
This project includes a simple host (admin) dashboard at `/host.html`. Login using the demo host credentials (host/hostpass) to view orders and export them to CSV. Orders are persisted in `orders.json`.
