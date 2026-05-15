import crypto from "node:crypto";

export const ACCOUNT_SESSION_COOKIE = "spearomaniacs.account";

export type AccountSession = {
  email: string;
  name: string;
};

type SessionPayload = AccountSession & {
  exp: number;
};

function getSessionSecret() {
  return (
    process.env.ACCOUNT_SESSION_SECRET ||
    process.env.SANITY_API_WRITE_TOKEN ||
    process.env.STRIPE_SECRET_KEY ||
    "dev-account-secret"
  );
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value, "utf8").digest("base64url");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createPasswordDigest(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const candidateBuffer = Buffer.from(candidate, "hex");
  const hashBuffer = Buffer.from(hash, "hex");

  if (candidateBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, hashBuffer);
}

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token, "utf8").digest("hex");

  return {
    token,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  };
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function createSessionCookieValue(session: AccountSession) {
  const payload: SessionPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionCookieValue(cookieValue?: string | null): AccountSession | null {
  if (!cookieValue) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;

    if (!payload.email || !payload.name || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: normalizeEmail(payload.email),
      name: payload.name,
    };
  } catch {
    return null;
  }
}
