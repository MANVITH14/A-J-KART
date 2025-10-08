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

About this repository
---------------------
This repository contains a minimal Flipkart-like demo storefront renamed to A J KART. It provides:

- A static frontend served from the `public/` folder (HTML/CSS/JS).
- A small Express server (`server.js`) that serves product data (`/api/products`), a checkout endpoint (`/api/checkout`) and basic authentication (`/api/login`).
- Demo host dashboard at `/host.html` which lists persisted orders and supports CSV export.
- Generated sample product catalog (up to 1000 items) for testing filters, pagination and cart flows.

Images
------
Product images and SVG placeholders live in `public/images/`. You can replace these files with real product photos (same filenames) if you want a more realistic store front.

Quick start
-----------
1. Install dependencies and start the server:

```powershell
cd C:\Users\HP\flipkart
npm install
npm start
```

2. Open the app in your browser: http://localhost:3000

Demo accounts
-------------
- Regular user: `user` / `userpass`
- Host (admin): `host` / `hostpass`

Host usage
----------
1. Login at http://localhost:3000/login.html using host/hostpass.
2. You will be redirected to http://localhost:3000/host.html where you can view orders and export CSV.

Notes
-----
- Orders are persisted to `orders.json` in the project root (for demo purposes). Add `orders.json` to `.gitignore` to avoid committing it (already included).
- For production you should replace the demo auth with proper user management and secure payment integration (Stripe or similar).

If you want, I can add a nicer repo description on GitHub (repository metadata) using the GitHub API or `gh` CLI — tell me if you'd like me to do that.
