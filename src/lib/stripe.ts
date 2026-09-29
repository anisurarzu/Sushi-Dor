import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY manquant. Configurez Stripe pour activer le paiement.",
    );
  }
  // TEST/SANDBOX only — never accept live keys in this project stage
  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) {
    throw new Error(
      "Clé Stripe LIVE détectée. Utilisez uniquement des clés TEST (sk_test_ / rkcs_test_).",
    );
  }
  if (
    !key.startsWith("sk_test_") &&
    !key.startsWith("rk_test_") &&
    !key.startsWith("rkcs_test_")
  ) {
    throw new Error(
      "STRIPE_SECRET_KEY invalide. Attendu: sk_test_… ou clé sandbox rkcs_test_…",
    );
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
