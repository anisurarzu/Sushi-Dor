import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE,
  destroyCustomerSession,
} from "@/lib/customer-auth";

export async function POST() {
  try {
    await destroyCustomerSession();
  } catch (e) {
    console.error("[auth/logout]", e);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
