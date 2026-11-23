import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Non-secret email config probe for live debugging. */
export async function GET() {
  const key =
    process.env.EMAIL_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || null;
  const admin =
    process.env.ADMIN_EMAIL?.trim() || process.env.EMAIL_ADMIN?.trim() || null;

  return NextResponse.json({
    hasEmailApiKey: Boolean(key),
    emailFrom: from,
    hasAdminEmail: Boolean(admin),
    adminEmailSet: Boolean(admin),
    usingOnboardingFrom: Boolean(from?.includes("onboarding@resend.dev")),
    tip: !key
      ? "Set EMAIL_API_KEY on Vercel Production, then redeploy."
      : from?.includes("sushidor.fr") && !from.includes("onboarding@")
        ? "Domain sushidor.fr must be verified on Resend, or use onboarding@resend.dev."
        : null,
  });
}
