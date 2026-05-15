import { groq } from "next-sanity";
import { sanityWriteClient } from "@/lib/sanity.write.client";
import {
  createPasswordDigest,
  createPasswordResetToken,
  hashPasswordResetToken,
  normalizeEmail,
  verifyPassword,
  type AccountSession,
} from "@/lib/account-auth";

type CmsUser = {
  _id: string;
  name: string;
  email: string;
  emailNormalized?: string;
  newsletterOptIn?: boolean;
  rewardsPoints?: number;
  rewardsLifetimePoints?: number;
  stripeCustomerId?: string;
  failedSignInCount?: number;
  lastFailedSignInAt?: string;
  signInLockedUntil?: string;
  resetPasswordRequestedAt?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: string;
  defaultShippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  passwordSalt?: string;
  passwordHash?: string;
};

export type AccountShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type AccountOrder = {
  _id: string;
  stripeSessionId?: string;
  paymentStatus?: string;
  cardBrand?: string;
  cardLast4?: string;
  fulfillmentStatus?: string;
  printfulOrderId?: string;
  printfulStatus?: string;
  printfulSubmittedAt?: string;
  printfulSubmissionError?: string;
  amountTotal?: number;
  rewardsPointsEarned?: number;
  rewardsPointsRedeemed?: number;
  rewardsDiscountAmount?: number;
  currency?: string;
  stripeCreatedAt?: string;
  items?: Array<{
    _key?: string;
    title?: string;
    slug?: string;
    description?: string;
    syncVariantId?: string;
    size?: string;
    color?: string;
    quantity?: number;
    unitAmount?: number;
    totalAmount?: number;
    currency?: string;
    imageUrl?: string;
  }>;
};

type AccountOrderOwnershipRecord = {
  _id: string;
  customerEmailNormalized?: string;
  fulfillmentStatus?: string;
  printfulOrderId?: string;
};

const userByEmailQuery = groq`
  *[_type == "user" && emailNormalized == $email][0]{
    _id,
    name,
    email,
    emailNormalized,
    newsletterOptIn,
    rewardsPoints,
    rewardsLifetimePoints,
    stripeCustomerId,
    failedSignInCount,
    lastFailedSignInAt,
    signInLockedUntil,
    resetPasswordRequestedAt,
    resetPasswordTokenHash,
    resetPasswordExpiresAt,
    defaultShippingAddress,
    passwordSalt,
    passwordHash
  }
`;

const userByResetTokenHashQuery = groq`
  *[
    _type == "user" &&
    resetPasswordTokenHash == $tokenHash
  ][0]{
    _id,
    name,
    email,
    emailNormalized,
    newsletterOptIn,
    rewardsPoints,
    rewardsLifetimePoints,
    stripeCustomerId,
    resetPasswordTokenHash,
    resetPasswordExpiresAt,
    defaultShippingAddress,
    passwordSalt,
    passwordHash
  }
`;

const ordersByEmailQuery = groq`
  *[_type == "order" && customerEmailNormalized == $email] | order(stripeCreatedAt desc){
    _id,
    stripeSessionId,
    paymentStatus,
    cardBrand,
    cardLast4,
    fulfillmentStatus,
    printfulOrderId,
    printfulStatus,
    printfulSubmittedAt,
    printfulSubmissionError,
    amountTotal,
    rewardsPointsEarned,
    rewardsPointsRedeemed,
    rewardsDiscountAmount,
    currency,
    stripeCreatedAt,
    items[]{
      _key,
      title,
      slug,
      description,
      syncVariantId,
      size,
      color,
      quantity,
      unitAmount,
      totalAmount,
      currency,
      imageUrl
    }
  }
`;

const orderOwnershipQuery = groq`
  *[_type == "order" && _id == $id][0]{
    _id,
    customerEmailNormalized,
    fulfillmentStatus,
    printfulOrderId
  }
`;

const newsletterOptInUsersQuery = groq`
  *[_type == "user" && newsletterOptIn == true]{
    email
  }
`;

export async function getUserByEmail(email: string) {
  if (!sanityWriteClient) {
    return null as CmsUser | null;
  }

  return sanityWriteClient.fetch<CmsUser | null>(userByEmailQuery, {
    email: normalizeEmail(email),
  });
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  newsletterOptIn: boolean;
}) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const email = normalizeEmail(input.email);
  const existing = await getUserByEmail(email);

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const { salt, hash } = createPasswordDigest(input.password);

  const created = await sanityWriteClient.create({
    _type: "user",
    name: input.name.trim(),
    email,
    emailNormalized: email,
    newsletterOptIn: input.newsletterOptIn,
    rewardsPoints: 0,
    rewardsLifetimePoints: 0,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  });

  return {
    _id: created._id,
    name: input.name.trim(),
    email,
    newsletterOptIn: input.newsletterOptIn,
  };
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user?.passwordSalt || !user?.passwordHash) {
    return null;
  }

  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return null;
  }

  return user;
}

const SIGN_IN_MAX_ATTEMPTS = 5;
const SIGN_IN_LOCKOUT_MS = 1000 * 60 * 15;
const SIGN_IN_ATTEMPT_WINDOW_MS = 1000 * 60 * 15;

export async function attemptUserSignIn(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user?.passwordSalt || !user?.passwordHash || !sanityWriteClient) {
    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  const lockedUntil = user.signInLockedUntil ? Date.parse(user.signInLockedUntil) : Number.NaN;

  if (Number.isFinite(lockedUntil) && lockedUntil > Date.now()) {
    return {
      ok: false as const,
      reason: "locked" as const,
      lockedUntil: user.signInLockedUntil || "",
    };
  }

  const isValidPassword = verifyPassword(password, user.passwordSalt, user.passwordHash);

  if (!isValidPassword) {
    const now = Date.now();
    const lastFailedAt = user.lastFailedSignInAt ? Date.parse(user.lastFailedSignInAt) : Number.NaN;
    const withinWindow = Number.isFinite(lastFailedAt) && now - lastFailedAt < SIGN_IN_ATTEMPT_WINDOW_MS;
    const failedSignInCount = withinWindow ? Math.max(0, Math.floor(user.failedSignInCount || 0)) + 1 : 1;
    const patch = sanityWriteClient.patch(user._id).set({
      failedSignInCount,
      lastFailedSignInAt: new Date(now).toISOString(),
    });

    if (failedSignInCount >= SIGN_IN_MAX_ATTEMPTS) {
      patch.set({
        signInLockedUntil: new Date(now + SIGN_IN_LOCKOUT_MS).toISOString(),
      });
    }

    await patch.commit();

    if (failedSignInCount >= SIGN_IN_MAX_ATTEMPTS) {
      return {
        ok: false as const,
        reason: "locked" as const,
        lockedUntil: new Date(now + SIGN_IN_LOCKOUT_MS).toISOString(),
      };
    }

    return { ok: false as const, reason: "invalid_credentials" as const };
  }

  await sanityWriteClient
    .patch(user._id)
    .set({
      failedSignInCount: 0,
      lastFailedSignInAt: "",
      signInLockedUntil: "",
    })
    .commit();

  return { ok: true as const, user };
}

export async function updateNewsletterPreference(email: string, newsletterOptIn: boolean) {
  const user = await getUserByEmail(email);

  if (!user || !sanityWriteClient) {
    throw new Error("Account not found.");
  }

  await sanityWriteClient.patch(user._id).set({ newsletterOptIn }).commit();

  if (newsletterOptIn) {
    await upsertNewsletterSubscriber(email, "account-opt-in");
  } else {
    await removeNewsletterSubscriber(email);
  }
}

function mergeNewsletterSources(existingSource?: string, nextSource?: string) {
  const sources = new Set(
    [existingSource, nextSource]
      .flatMap((value) => (value || "").split(","))
      .map((value) => value.trim())
      .filter(Boolean)
  );

  return Array.from(sources).join(",");
}

async function getNewsletterSubscriberByEmail(email: string) {
  if (!sanityWriteClient) {
    return null as { _id: string; source?: string; subscribedAt?: string } | null;
  }

  return sanityWriteClient.fetch<{ _id: string; source?: string; subscribedAt?: string } | null>(
    groq`*[_type == "newsletterSubscriber" && emailNormalized == $email][0]{ _id, source, subscribedAt }`,
    { email }
  );
}

export async function upsertNewsletterSubscriber(emailInput: string, source = "site-footer") {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const email = normalizeEmail(emailInput);

  const existingSubscriber = await getNewsletterSubscriberByEmail(email);

  if (existingSubscriber) {
    await sanityWriteClient
      .patch(existingSubscriber._id)
      .set({
        source: mergeNewsletterSources(existingSubscriber.source, source),
      })
      .commit();

    return { email, alreadySubscribed: true };
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    await sanityWriteClient.patch(existingUser._id).set({ newsletterOptIn: true }).commit();
  }

  await sanityWriteClient.create({
    _type: "newsletterSubscriber",
    email,
    emailNormalized: email,
    source,
    subscribedAt: new Date().toISOString(),
  });

  return { email, alreadySubscribed: false };
}

export async function removeNewsletterSubscriber(emailInput: string) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const email = normalizeEmail(emailInput);
  const existingSubscriber = await getNewsletterSubscriberByEmail(email);

  if (!existingSubscriber) {
    return { removed: false };
  }

  await sanityWriteClient.delete(existingSubscriber._id);
  return { removed: true };
}

export async function subscribeEmailToNewsletter(emailInput: string, source = "site-footer") {
  return upsertNewsletterSubscriber(emailInput, source);
}

export async function backfillNewsletterSubscribersFromUsers() {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const users = await sanityWriteClient.fetch<Array<{ email?: string }>>(newsletterOptInUsersQuery);
  let createdOrUpdated = 0;

  for (const user of users || []) {
    const email = normalizeEmail(user.email || "");

    if (!email) {
      continue;
    }

    await upsertNewsletterSubscriber(email, "account-opt-in");
    createdOrUpdated += 1;
  }

  return { createdOrUpdated };
}

export async function createPasswordResetRequest(email: string) {
  const user = await getUserByEmail(email);

  if (!user || !sanityWriteClient) {
    return null;
  }

  const requestedAt = user.resetPasswordRequestedAt ? Date.parse(user.resetPasswordRequestedAt) : Number.NaN;

  if (Number.isFinite(requestedAt) && Date.now() - requestedAt < 1000 * 60 * 5) {
    throw new Error("Please wait a few minutes before requesting another password reset email.");
  }

  const reset = createPasswordResetToken();
  const now = new Date().toISOString();

  await sanityWriteClient
    .patch(user._id)
    .set({
      resetPasswordRequestedAt: now,
      resetPasswordTokenHash: reset.tokenHash,
      resetPasswordExpiresAt: reset.expiresAt,
    })
    .commit();

  return {
    token: reset.token,
    expiresAt: reset.expiresAt,
    user,
  };
}

export async function resetPasswordWithToken(token: string, nextPassword: string) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const tokenHash = hashPasswordResetToken(token);
  const user = await sanityWriteClient.fetch<CmsUser | null>(userByResetTokenHashQuery, { tokenHash });

  if (!user) {
    throw new Error("This password reset link is invalid or has expired.");
  }

  const expiresAt = user.resetPasswordExpiresAt ? Date.parse(user.resetPasswordExpiresAt) : Number.NaN;

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error("This password reset link is invalid or has expired.");
  }

  const { salt, hash } = createPasswordDigest(nextPassword);

  await sanityWriteClient
    .patch(user._id)
    .set({
      passwordSalt: salt,
      passwordHash: hash,
    })
    .unset(["resetPasswordTokenHash", "resetPasswordExpiresAt"])
    .commit();

  return user;
}

export async function updateAccountProfile(
  email: string,
  input: {
    name?: string;
    defaultShippingAddress?: AccountShippingAddress;
    stripeCustomerId?: string;
  }
) {
  const user = await getUserByEmail(email);

  if (!user || !sanityWriteClient) {
    throw new Error("Account not found.");
  }

  const patch = sanityWriteClient.patch(user._id);

  if (typeof input.name === "string" && input.name.trim().length >= 2) {
    patch.set({ name: input.name.trim() });
  }

  if (input.defaultShippingAddress) {
    patch.set({ defaultShippingAddress: input.defaultShippingAddress });
  }

  if (input.stripeCustomerId) {
    patch.set({ stripeCustomerId: input.stripeCustomerId });
  }

  await patch.commit();
}

export async function getOrdersByEmail(email: string) {
  if (!sanityWriteClient) {
    return [] as AccountOrder[];
  }

  return sanityWriteClient.fetch<AccountOrder[]>(ordersByEmailQuery, {
    email: normalizeEmail(email),
  });
}

export async function cancelOrderForEmail(orderId: string, email: string) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const normalizedEmail = normalizeEmail(email);
  const order = await sanityWriteClient.fetch<AccountOrderOwnershipRecord | null>(orderOwnershipQuery, {
    id: orderId,
  });

  if (!order || order.customerEmailNormalized !== normalizedEmail) {
    throw new Error("Order not found.");
  }

  if (order.printfulOrderId) {
    throw new Error("This order is already in production and can no longer be cancelled.");
  }

  const allowedStatuses = new Set(["processing", "submission_failed", "pending_review"]);

  if (!allowedStatuses.has(order.fulfillmentStatus || "")) {
    throw new Error("This order can no longer be cancelled.");
  }

  await sanityWriteClient
    .patch(order._id)
    .set({
      fulfillmentStatus: "cancelled",
      printfulSubmissionError: "",
    })
    .commit();

  return { ok: true };
}

export async function getAccountSnapshot(session: AccountSession) {
  const [user, orders] = await Promise.all([getUserByEmail(session.email), getOrdersByEmail(session.email)]);

  return {
    user,
    orders,
  };
}

export async function applyOrderRewards(input: {
  email: string;
  rewardsPointsEarned: number;
  rewardsPointsRedeemed: number;
  defaultShippingAddress?: AccountShippingAddress;
  stripeCustomerId?: string;
  customerName?: string;
}) {
  const user = await getUserByEmail(input.email);

  if (!user || !sanityWriteClient) {
    return null;
  }

  const nextRewardsPoints = Math.max(
    0,
    Math.floor(user.rewardsPoints || 0) + Math.floor(input.rewardsPointsEarned || 0) - Math.floor(input.rewardsPointsRedeemed || 0)
  );
  const nextLifetimePoints = Math.max(
    0,
    Math.floor(user.rewardsLifetimePoints || 0) + Math.floor(input.rewardsPointsEarned || 0)
  );

  const patch = sanityWriteClient.patch(user._id).set({
    rewardsPoints: nextRewardsPoints,
    rewardsLifetimePoints: nextLifetimePoints,
  });

  if (input.defaultShippingAddress) {
    patch.set({ defaultShippingAddress: input.defaultShippingAddress });
  }

  if (input.stripeCustomerId) {
    patch.set({ stripeCustomerId: input.stripeCustomerId });
  }

  if (input.customerName && input.customerName.trim().length >= 2) {
    patch.set({ name: input.customerName.trim() });
  }

  await patch.commit();

  return {
    rewardsPoints: nextRewardsPoints,
    rewardsLifetimePoints: nextLifetimePoints,
  };
}
