import { NextResponse } from "next/server";

export function assertPrintAgent(req: Request): NextResponse | null {
  const secret = process.env.PRINT_AGENT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "PRINT_AGENT_SECRET non configuré sur le serveur" },
      { status: 503 },
    );
  }
  const header =
    req.headers.get("x-print-agent-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!header || header !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}
