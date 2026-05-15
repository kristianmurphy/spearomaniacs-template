const POINTS_PER_CURRENCY_UNIT = Number.parseInt(process.env.REWARDS_POINTS_PER_CURRENCY_UNIT || "1", 10);
const CENTS_PER_POINT = Number.parseInt(process.env.REWARDS_CENTS_PER_POINT || "5", 10);
const MINIMUM_CHARGE_AMOUNT = Number.parseInt(process.env.REWARDS_MINIMUM_CHARGE_AMOUNT || "50", 10);

function sanitizePositiveInteger(value: number, fallback: number) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function getRewardsPointsPerCurrencyUnit() {
  return sanitizePositiveInteger(POINTS_PER_CURRENCY_UNIT, 1);
}

export function getRewardsCentsPerPoint() {
  return sanitizePositiveInteger(CENTS_PER_POINT, 5);
}

export function getRewardsMinimumChargeAmount() {
  return sanitizePositiveInteger(MINIMUM_CHARGE_AMOUNT, 50);
}

export function calculateRewardPointsEarned(amountTotal?: number | null) {
  if (typeof amountTotal !== "number" || !Number.isFinite(amountTotal) || amountTotal <= 0) {
    return 0;
  }

  const wholeCurrencyUnits = Math.floor(amountTotal / 100);
  return wholeCurrencyUnits * getRewardsPointsPerCurrencyUnit();
}

export function calculateRewardDiscountAmount(points?: number | null) {
  if (typeof points !== "number" || !Number.isFinite(points) || points <= 0) {
    return 0;
  }

  return Math.floor(points) * getRewardsCentsPerPoint();
}

export function calculateMaxRedeemablePoints(pointsAvailable: number, orderAmount: number) {
  if (!Number.isFinite(pointsAvailable) || pointsAvailable <= 0 || !Number.isFinite(orderAmount) || orderAmount <= 0) {
    return 0;
  }

  const maxDiscountAmount = Math.max(0, Math.floor(orderAmount) - getRewardsMinimumChargeAmount());
  const maxPointsByOrderValue = Math.floor(maxDiscountAmount / getRewardsCentsPerPoint());

  return Math.max(0, Math.min(Math.floor(pointsAvailable), maxPointsByOrderValue));
}

export function formatRewardsDiscount(points: number, currency = "AUD") {
  const amount = calculateRewardDiscountAmount(points);

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(amount / 100);
}
