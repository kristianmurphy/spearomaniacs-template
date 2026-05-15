## Storefront Template Setup (Sanity + Next.js)

This frontend reads content from the Sanity Studio in `../spearomaniacs-cms-template`.

### 1) Configure environment variables

Copy `.env.example` to `.env.local` and replace the placeholders with your own values:

```bash
cp .env.example .env.local
```

For product import, checkout, and fulfillment, also add:

```bash
SANITY_API_WRITE_TOKEN=your_sanity_write_token
PRINTFUL_API_TOKEN=your_printful_private_token
PRINTFUL_AUTO_SUBMIT_ORDERS=true
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SHOP_ALLOWED_COUNTRIES=AU,NZ,US,CA,GB
```

`SANITY_API_WRITE_TOKEN` must have write access to your Sanity dataset.

### 2) Run the Sanity Studio

From `../spearomaniacs-cms-template`:

```bash
npm run dev
```

In Studio, create:
1. A **Site Settings** document.
2. A **Page** document (for example, slug `home`).
3. Select that Page as the **Home Page** in Site Settings.

### 3) Run the frontend

From this folder:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Import products from Printful

Once both tokens are in `.env.local`, you can import all Printful store products into Sanity:

```bash
curl -X POST http://localhost:3000/api/printful/import-products
```

That upserts `product` documents into Sanity so you can control visibility and presentation in the CMS.

### Stripe checkout and order fulfillment

The shop already creates Stripe Checkout sessions at `/api/checkout`.

To finish setup locally:

1. Start the frontend on `http://localhost:3000`.
2. Forward Stripe webhooks to the app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copy the webhook signing secret from Stripe CLI into `STRIPE_WEBHOOK_SECRET`.
4. Complete a test checkout.

When Stripe sends `checkout.session.completed`, the app will:

1. Save the paid order into Sanity.
2. Keep it in `processing` until you approve it manually if `PRINTFUL_AUTO_SUBMIT_ORDERS=false`.
3. Submit the order to Printful automatically only when `PRINTFUL_AUTO_SUBMIT_ORDERS=true`.
4. Store the Printful order ID, Printful status, and any submission error on the Sanity `order` document.

If Printful rejects an order because of an address issue or missing variant, the order remains in Sanity with `submission_failed` so you can review it in Studio.

For safe local payment testing without creating Printful fulfillment orders, set:

```bash
PRINTFUL_AUTO_SUBMIT_ORDERS=false
```

That keeps paid Stripe test orders in Sanity while stopping automatic submission to Printful.

When auto-submission is disabled, open the order in Sanity Studio and use the `Approve & Send to Printful` document action to submit it manually.

## Deploy on Vercel

1. Import this storefront repo into Vercel.
2. Add the same environment variables from `.env.local`: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_API_WRITE_TOKEN`, `PRINTFUL_API_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHOP_ALLOWED_COUNTRIES`, `SHOP_CURRENCY_CODE`.
3. Deploy.
4. In Stripe, create a production webhook endpoint for `https://your-domain/api/stripe/webhook` and subscribe it to `checkout.session.completed`.

After deployment, future content changes in Sanity will appear automatically (within ~60 seconds due to revalidation).
