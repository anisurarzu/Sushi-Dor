import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/reservations";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  restaurantId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.coerce.number().int().min(1).max(40),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse({
      restaurantId: url.searchParams.get("restaurantId"),
      date: url.searchParams.get("date"),
      partySize: url.searchParams.get("partySize"),
    });
    const data = await getAvailableSlots(parsed);
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de charger les créneaux.";
    const status = message.includes("non disponibles") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
