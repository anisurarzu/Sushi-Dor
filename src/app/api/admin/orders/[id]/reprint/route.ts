import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { enqueuePrintForOrder } from "@/lib/print";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Staff: force a new print job for a paid order. */
export async function POST(_req: Request, ctx: Ctx) {
  const admin = await requireAdminApi("orders.edit");
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const job = await enqueuePrintForOrder(id, { force: true });
  if (!job) {
    return NextResponse.json(
      { error: "Commande introuvable ou non payée" },
      { status: 400 },
    );
  }
  return NextResponse.json({ job });
}
