import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertPrintAgent } from "@/lib/print-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Claim a job before printing (avoids double-print with multiple agents). */
export async function POST(req: Request, ctx: Ctx) {
  const denied = assertPrintAgent(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const job = await prisma.printJob.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  }
  if (job.status === "PRINTED") {
    return NextResponse.json({ error: "Déjà imprimé", job }, { status: 409 });
  }
  if (job.status !== "PENDING" && job.status !== "FAILED") {
    return NextResponse.json(
      { error: `Statut ${job.status}`, job },
      { status: 409 },
    );
  }

  const updated = await prisma.printJob.update({
    where: { id },
    data: {
      status: "CLAIMED",
      claimedAt: new Date(),
      attempts: { increment: 1 },
      error: null,
    },
  });

  return NextResponse.json({
    job: {
      id: updated.id,
      eposXml: updated.eposXml,
      escposBase64: updated.escposBase64,
      attempts: updated.attempts,
    },
  });
}
