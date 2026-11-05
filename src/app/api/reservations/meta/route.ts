import { NextResponse } from "next/server";
import {
  getReservationRestaurant,
  OCCASIONS,
  toPublicRestaurant,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function GET() {
  const restaurant = await getReservationRestaurant();
  if (!restaurant) {
    return NextResponse.json(
      { error: "Les réservations en ligne sont temporairement indisponibles." },
      { status: 503 },
    );
  }

  const hoursByDay = restaurant.openingHours.reduce<
    Record<
      string,
      { openTime: string; closeTime: string; isClosed: boolean }[]
    >
  >((acc, h) => {
    const key = h.dayOfWeek;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    });
    return acc;
  }, {});

  return NextResponse.json({
    restaurant: toPublicRestaurant(restaurant),
    occasions: OCCASIONS,
    openingHours: hoursByDay,
  });
}
