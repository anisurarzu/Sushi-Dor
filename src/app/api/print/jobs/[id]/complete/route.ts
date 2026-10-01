import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertPrintAgent } from "@/lib/print-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  ok: z.boolean(),
  error: z.string().max(2000).optional(),
});

/** Mark job PRINTED or FAILED after agent attempts the printer. */
export async function POST(req: Request, ctx: Ctx) {
  const denied = assertPrintAgent(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const job = await prisma.printJob.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  }

  if (parsed.data.ok) {
    const updated = await prisma.printJob.update({
      where: { id },
      data: {
        status: "PRINTED",
        printedAt: new Date(),
        error: null,
      },
    });
    return NextResponse.json({ job: updated });
  }

  const updated = await prisma.printJob.update({
    where: { id },
    data: {
      status: "FAILED",
      error: parsed.data.error || "Échec impression",
    },
  });
  return NextResponse.json({ job: updated });
}
