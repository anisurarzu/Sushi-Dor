import { createHash, randomBytes } from "crypto";
import type {
  DayOfWeek,
  Reservation,
  ReservationSource,
  ReservationStatus,
  Restaurant,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export { OCCASIONS } from "@/lib/reservation-options";

export type ReservationSlot = {
  startTime: string;
  endTime: string;
  remainingGuests: number;
  available: boolean;
};

export type PublicRestaurantReservation = {
  id: string;
  name: string;
  slug: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string | null;
  email: string | null;
  timezone: string;
  reservationInterval: number;
  maxGuestsPerSlot: number;
  maxPartySize: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
};

const ACTIVE: ReservationStatus[] = ["PENDING", "CONFIRMED"];

const DOW: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function hashCancelToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newCancelToken() {
  return randomBytes(24).toString("hex");
}

export function newConfirmationCode() {
  return `SD${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Date invalide");
  }
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Standard dining turn time by party size (international restaurant practice). */
export function turnMinutes(partySize: number): number {
  if (partySize <= 2) return 90;
  if (partySize <= 4) return 105;
  if (partySize <= 6) return 120;
  return 150;
}

export function computeEndTime(startTime: string, partySize: number): string {
  return minutesToTime(timeToMinutes(startTime) + turnMinutes(partySize));
}

function parisParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute === "24" ? 0 : parts.minute),
  };
}

function dayOfWeekForDate(dateStr: string): DayOfWeek {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  return DOW[d.getUTCDay()];
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function getReservationRestaurant(
  restaurantId?: string,
): Promise<(Restaurant & { openingHours: { dayOfWeek: DayOfWeek; openTime: string; closeTime: string; service: string; isClosed: boolean }[]; blockedDates: { date: Date; reason: string | null }[] }) | null> {
  if (restaurantId) {
    return prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        isActive: true,
        reservationEnabled: true,
      },
      include: { openingHours: true, blockedDates: true },
    });
  }
  return prisma.restaurant.findFirst({
    where: { isActive: true, reservationEnabled: true },
    orderBy: { name: "asc" },
    include: { openingHours: true, blockedDates: true },
  });
}

export function toPublicRestaurant(
  r: Restaurant,
): PublicRestaurantReservation {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    address: r.address,
    postalCode: r.postalCode,
    city: r.city,
    phone: r.phone,
    email: r.email,
    timezone: r.timezone,
    reservationInterval: r.reservationInterval,
    maxGuestsPerSlot: r.maxGuestsPerSlot,
    maxPartySize: r.maxPartySize,
    minAdvanceMinutes: r.minAdvanceMinutes,
    maxAdvanceDays: r.maxAdvanceDays,
  };
}

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots(input: {
  restaurantId: string;
  date: string;
  partySize: number;
}): Promise<{
  restaurant: PublicRestaurantReservation;
  date: string;
  partySize: number;
  closedReason: string | null;
  slots: ReservationSlot[];
}> {
  const restaurant = await getReservationRestaurant(input.restaurantId);
  if (!restaurant) {
    throw new Error("Réservations non disponibles.");
  }
  if (input.partySize < 1 || input.partySize > restaurant.maxPartySize) {
    throw new Error(
      `Nombre de convives invalide (1–${restaurant.maxPartySize}).`,
    );
  }

  const date = parseDateOnly(input.date);
  const dateStr = formatDateOnly(date);
  const now = parisParts();

  const maxDate = new Date(`${now.date}T00:00:00.000Z`);
  maxDate.setUTCDate(maxDate.getUTCDate() + restaurant.maxAdvanceDays);
  if (date > maxDate) {
    throw new Error(
      `Réservation possible jusqu'à ${restaurant.maxAdvanceDays} jours à l'avance.`,
    );
  }
  if (dateStr < now.date) {
    throw new Error("Impossible de réserver une date passée.");
  }

  const blocked = restaurant.blockedDates.find(
    (b) => formatDateOnly(b.date) === dateStr,
  );
  if (blocked) {
    return {
      restaurant: toPublicRestaurant(restaurant),
      date: dateStr,
      partySize: input.partySize,
      closedReason: blocked.reason || "Restaurant fermé ce jour-là.",
      slots: [],
    };
  }

  const dow = dayOfWeekForDate(dateStr);
  const periods = restaurant.openingHours.filter(
    (h) => h.dayOfWeek === dow && !h.isClosed,
  );
  if (periods.length === 0) {
    return {
      restaurant: toPublicRestaurant(restaurant),
      date: dateStr,
      partySize: input.partySize,
      closedReason: "Restaurant fermé ce jour-là.",
      slots: [],
    };
  }

  const existing = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      date,
      status: { in: ACTIVE },
      deletedStatus: 0,
    },
    select: { startTime: true, endTime: true, partySize: true },
  });

  const duration = turnMinutes(input.partySize);
  const interval = Math.max(15, restaurant.reservationInterval || 30);
  const candidateStarts = new Set<number>();

  for (const period of periods) {
    const open = timeToMinutes(period.openTime);
    const close = timeToMinutes(period.closeTime);
    for (let t = open; t + duration <= close; t += interval) {
      candidateStarts.add(t);
    }
  }

  const slots: ReservationSlot[] = [...candidateStarts]
    .sort((a, b) => a - b)
    .map((startMin) => {
      const startTime = minutesToTime(startMin);
      const endTime = minutesToTime(startMin + duration);
      const used = existing
        .filter((r) => overlaps(startTime, endTime, r.startTime, r.endTime))
        .reduce((sum, r) => sum + r.partySize, 0);
      const remainingGuests = Math.max(0, restaurant.maxGuestsPerSlot - used);
      let available = remainingGuests >= input.partySize;

      if (dateStr === now.date) {
        if (startMin < now.minutes + restaurant.minAdvanceMinutes) {
          available = false;
        }
      }

      return { startTime, endTime, remainingGuests, available };
    });

  return {
    restaurant: toPublicRestaurant(restaurant),
    date: dateStr,
    partySize: input.partySize,
    closedReason: null,
    slots,
  };
}

export type CreateReservationInput = {
  restaurantId: string;
  date: string;
  startTime: string;
  partySize: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occasion?: string | null;
  specialRequest?: string | null;
  source?: ReservationSource;
  status?: ReservationStatus;
  adminNotes?: string | null;
  /** Admin can bypass some public rules */
  asAdmin?: boolean;
};

export async function createReservation(input: CreateReservationInput): Promise<{
  reservation: Reservation;
  cancelToken: string;
}> {
  const restaurant = await getReservationRestaurant(input.restaurantId);
  if (!restaurant) {
    throw new Error("Réservations non disponibles.");
  }

  const partySize = input.partySize;
  if (partySize < 1 || partySize > restaurant.maxPartySize) {
    throw new Error(
      `Nombre de convives invalide (1–${restaurant.maxPartySize}).`,
    );
  }
  if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
    throw new Error("Heure invalide.");
  }

  const availability = await getAvailableSlots({
    restaurantId: restaurant.id,
    date: input.date,
    partySize,
  });
  const slot = availability.slots.find((s) => s.startTime === input.startTime);
  if (!input.asAdmin) {
    if (availability.closedReason) {
      throw new Error(availability.closedReason);
    }
    if (!slot?.available) {
      throw new Error("Ce créneau n'est plus disponible.");
    }
  } else {
    const date = parseDateOnly(input.date);
    const endTime = computeEndTime(input.startTime, partySize);
    const guests = await prisma.reservation.aggregate({
      where: {
        restaurantId: restaurant.id,
        date,
        status: { in: ACTIVE },
        deletedStatus: 0,
        startTime: { lt: endTime },
        endTime: { gt: input.startTime },
      },
      _sum: { partySize: true },
    });
    if ((guests._sum.partySize || 0) + partySize > restaurant.maxGuestsPerSlot) {
      throw new Error("Créneau complet (capacité atteinte).");
    }
  }

  const endTime =
    slot?.endTime || computeEndTime(input.startTime, partySize);
  const date = parseDateOnly(input.date);
  const cancelToken = newCancelToken();

  // Parties of 8+ usually need restaurant confirmation internationally
  const autoStatus: ReservationStatus =
    input.status ||
    (partySize >= 8 ? "PENDING" : "CONFIRMED");

  const occasion =
    input.occasion && input.occasion !== "none" ? input.occasion : null;

  const reservation = await prisma.reservation.create({
    data: {
      confirmationCode: newConfirmationCode(),
      cancelTokenHash: hashCancelToken(cancelToken),
      restaurantId: restaurant.id,
      date,
      startTime: input.startTime,
      endTime,
      partySize,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      occasion,
      specialRequest: input.specialRequest?.trim() || null,
      adminNotes: input.adminNotes?.trim() || null,
      source: input.source || "ONLINE",
      status: autoStatus,
    },
  });

  return { reservation, cancelToken };
}

export async function findReservationByToken(token: string) {
  return prisma.reservation.findFirst({
    where: {
      cancelTokenHash: hashCancelToken(token),
      deletedStatus: 0,
    },
    include: { restaurant: true },
  });
}

export async function findReservationByCodeEmail(code: string, email: string) {
  return prisma.reservation.findFirst({
    where: {
      confirmationCode: code.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      deletedStatus: 0,
    },
    include: { restaurant: true },
  });
}

export async function cancelReservation(reservationId: string) {
  return prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
    include: { restaurant: true },
  });
}

export function reservationEmailHtml(opts: {
  reservation: Reservation;
  restaurantName: string;
  restaurantPhone?: string | null;
  cancelToken?: string;
  kind: "confirmation" | "pending" | "cancelled" | "updated";
}) {
  const { reservation: r, restaurantName, restaurantPhone, cancelToken, kind } =
    opts;
  const dateLabel = formatDateOnly(r.date);
  const manageUrl = cancelToken
    ? `${appUrl()}/reservation/manage?token=${cancelToken}`
    : `${appUrl()}/reservation/manage`;
  const titles = {
    confirmation: "Réservation confirmée",
    pending: "Demande de réservation reçue",
    cancelled: "Réservation annulée",
    updated: "Réservation mise à jour",
  } as const;

  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0c0a08;color:#f5f0e8;padding:24px">
  <div style="max-width:560px;margin:0 auto;border:1px solid #c4a35a55;padding:28px;background:#12100e">
    <p style="letter-spacing:.2em;text-transform:uppercase;color:#c4a35a;font-size:12px">Sushi D'or</p>
    <h1 style="font-size:28px;color:#e0c878;margin:8px 0 16px">${titles[kind]}</h1>
    <p style="color:#c4bbaa;line-height:1.6">Bonjour ${r.firstName},</p>
    <p style="color:#c4bbaa;line-height:1.6">
      ${
        kind === "pending"
          ? "Nous avons bien reçu votre demande. Notre équipe vous confirmera rapidement (groupes de 8+)."
          : kind === "cancelled"
            ? "Votre réservation a été annulée."
            : "Voici le récapitulatif de votre réservation."
      }
    </p>
    <table style="width:100%;margin:20px 0;color:#f5f0e8;font-size:15px">
      <tr><td style="padding:6px 0;color:#a89f8e">Code</td><td style="padding:6px 0;font-weight:bold;color:#e0c878">${r.confirmationCode}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f8e">Restaurant</td><td style="padding:6px 0">${restaurantName}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f8e">Date</td><td style="padding:6px 0">${dateLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f8e">Heure</td><td style="padding:6px 0">${r.startTime}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f8e">Convives</td><td style="padding:6px 0">${r.partySize}</td></tr>
      <tr><td style="padding:6px 0;color:#a89f8e">Statut</td><td style="padding:6px 0">${r.status}</td></tr>
    </table>
    ${
      kind !== "cancelled"
        ? `<p style="margin:24px 0"><a href="${manageUrl}" style="display:inline-block;background:#c4a35a;color:#0c0a08;padding:12px 18px;text-decoration:none;font-size:13px;letter-spacing:.08em;text-transform:uppercase">Gérer / Annuler</a></p>`
        : ""
    }
    ${
      restaurantPhone
        ? `<p style="color:#a89f8e;font-size:13px">Questions ? Appelez-nous au ${restaurantPhone}.</p>`
        : ""
    }
  </div></body></html>`;
}

export async function sendReservationEmail(opts: {
  reservation: Reservation;
  restaurantName: string;
  restaurantPhone?: string | null;
  cancelToken?: string;
  kind: "confirmation" | "pending" | "cancelled" | "updated";
}) {
  const subjects = {
    confirmation: `Confirmation · ${opts.reservation.confirmationCode} · Sushi D'or`,
    pending: `Demande reçue · ${opts.reservation.confirmationCode} · Sushi D'or`,
    cancelled: `Annulation · ${opts.reservation.confirmationCode} · Sushi D'or`,
    updated: `Mise à jour · ${opts.reservation.confirmationCode} · Sushi D'or`,
  } as const;
  return sendEmail({
    to: opts.reservation.email,
    subject: subjects[opts.kind],
    html: reservationEmailHtml(opts),
  });
}

export function publicReservationView(
  r: Reservation & { restaurant: Restaurant },
) {
  return {
    id: r.id,
    confirmationCode: r.confirmationCode,
    status: r.status,
    date: formatDateOnly(r.date),
    startTime: r.startTime,
    endTime: r.endTime,
    partySize: r.partySize,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    occasion: r.occasion,
    specialRequest: r.specialRequest,
    restaurant: {
      id: r.restaurant.id,
      name: r.restaurant.name,
      address: r.restaurant.address,
      postalCode: r.restaurant.postalCode,
      city: r.restaurant.city,
      phone: r.restaurant.phone,
    },
    canCancel:
      (r.status === "PENDING" || r.status === "CONFIRMED") &&
      formatDateOnly(r.date) >= parisParts().date,
  };
}
