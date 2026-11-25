import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recordSiteVisit } from "@/lib/site-traffic";

export const dynamic = "force-dynamic";

const COOKIE = "sd_vid";
const MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

function looksLikeBot(ua: string) {
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|headless/i.test(
    ua,
  );
}

export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (looksLikeBot(ua)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const jar = await cookies();
    let visitorId = jar.get(COOKIE)?.value;
    const isNewCookie = !visitorId;
    if (!visitorId) {
      visitorId = randomBytes(16).toString("hex");
    }

    await recordSiteVisit(visitorId);

    const res = NextResponse.json({ ok: true });
    if (isNewCookie) {
      res.cookies.set(COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: MAX_AGE,
      });
    }
    return res;
  } catch (err) {
    console.error("[analytics/visit]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
