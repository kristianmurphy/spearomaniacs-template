type AccountShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return secretKey;
}

async function stripeFormRequest(path: string, form: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Stripe request failed: ${await response.text()}`);
  }

  return response.json() as Promise<{ id: string }>;
}

function appendShipping(form: URLSearchParams, address?: AccountShippingAddress | null, name?: string) {
  if (!address?.line1 || !address.city || !address.postalCode || !address.country) {
    return;
  }

  if (name) {
    form.set("shipping[name]", name);
  }

  form.set("shipping[address][line1]", address.line1);

  if (address.line2) {
    form.set("shipping[address][line2]", address.line2);
  }

  form.set("shipping[address][city]", address.city);

  if (address.state) {
    form.set("shipping[address][state]", address.state);
  }

  form.set("shipping[address][postal_code]", address.postalCode);
  form.set("shipping[address][country]", address.country);
}

export async function createOrUpdateStripeCustomer(input: {
  stripeCustomerId?: string;
  email: string;
  name?: string;
  shippingAddress?: AccountShippingAddress | null;
}) {
  const form = new URLSearchParams();
  form.set("email", input.email);

  if (input.name) {
    form.set("name", input.name);
  }

  appendShipping(form, input.shippingAddress, input.name);

  if (input.stripeCustomerId) {
    const customer = await stripeFormRequest(`/v1/customers/${input.stripeCustomerId}`, form);
    return customer.id;
  }

  const customer = await stripeFormRequest("/v1/customers", form);
  return customer.id;
}

export async function createRewardsCoupon(input: {
  amountOff: number;
  currency: string;
  pointsRedeemed: number;
}) {
  const form = new URLSearchParams();
  form.set("duration", "once");
  form.set("amount_off", String(input.amountOff));
  form.set("currency", input.currency.toLowerCase());
  form.set("name", `${input.pointsRedeemed} rewards points`);
  form.set("metadata[rewards_points_redeemed]", String(input.pointsRedeemed));

  const coupon = await stripeFormRequest("/v1/coupons", form);
  return coupon.id;
}
