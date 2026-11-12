import { NextResponse } from "next/server";
import { getCustomerUser } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCustomerUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    },
  });
}
