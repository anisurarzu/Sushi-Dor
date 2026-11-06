"use client";

import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

type Props = {
  value: string;
  onChange: (date: string) => void;
  /** Inclusive lower bound (YYYY-MM-DD). Optional for admin. */
  min?: string;
  /** Inclusive upper bound (YYYY-MM-DD). Optional for admin. */
  max?: string;
  /** Mark this day as "today" (defaults to min when min is set). */
  today?: string;
  className?: string;
};

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

function toYmd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthLabel(y: number, m: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Monday-first index: Mon=0 … Sun=6 */
function startWeekdayMondayFirst(y: number, m: number) {
  const js = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // Sun=0
  return (js + 6) % 7;
}

function shiftMonth(y: number, m: number, delta: number) {
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1 };
}

function addDaysYmd(ymd: string, days: number) {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function ReservationCalendar({
  value,
  onChange,
  min,
  max,
  today,
  className = "",
}: Props) {
  const selected = parseYmd(value);
  const todayYmd = today || todayUtc();
  const minYmd = min || addDaysYmd(todayYmd, -365);
  const maxYmd = max || addDaysYmd(todayYmd, 365);
  const minP = parseYmd(minYmd);
  const maxP = parseYmd(maxYmd);
  const [view, setView] = useState({ y: selected.y, m: selected.m });

  useEffect(() => {
    setView({ y: selected.y, m: selected.m });
  }, [selected.y, selected.m]);

  const cells = useMemo(() => {
    const total = daysInMonth(view.y, view.m);
    const offset = startWeekdayMondayFirst(view.y, view.m);
    const list: ({ kind: "empty" } | { kind: "day"; day: number; ymd: string; disabled: boolean; isToday: boolean; isSelected: boolean })[] = [];

    for (let i = 0; i < offset; i++) list.push({ kind: "empty" });

    for (let day = 1; day <= total; day++) {
      const ymd = toYmd(view.y, view.m, day);
      list.push({
        kind: "day",
        day,
        ymd,
        disabled: ymd < minYmd || ymd > maxYmd,
        isToday: ymd === todayYmd,
        isSelected: ymd === value,
      });
    }
    return list;
  }, [view.y, view.m, minYmd, maxYmd, todayYmd, value]);

  const canPrev = toYmd(view.y, view.m, 1) > toYmd(minP.y, minP.m, 1);
  const canNext =
    toYmd(view.y, view.m, 1) < toYmd(maxP.y, maxP.m, 1);

  return (
    <div
      className={`reservation-cal ${className}`.trim()}
      role="group"
      aria-label="Choisir une date"
    >
      <div className="reservation-cal__head">
        <button
          type="button"
          className="reservation-cal__nav"
          aria-label="Mois précédent"
          disabled={!canPrev}
          onClick={() => setView((v) => shiftMonth(v.y, v.m, -1))}
        >
          ‹
        </button>
        <p className="reservation-cal__month" key={`${view.y}-${view.m}`}>
          {monthLabel(view.y, view.m)}
        </p>
        <button
          type="button"
          className="reservation-cal__nav"
          aria-label="Mois suivant"
          disabled={!canNext}
          onClick={() => setView((v) => shiftMonth(v.y, v.m, 1))}
        >
          ›
        </button>
      </div>

      <div className="reservation-cal__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="reservation-cal__grid" key={`${view.y}-${view.m}-grid`}>
        {cells.map((cell, i) =>
          cell.kind === "empty" ? (
            <span key={`e-${i}`} className="reservation-cal__empty" />
          ) : (
            <button
              key={cell.ymd}
              type="button"
              disabled={cell.disabled}
              aria-label={cell.ymd}
              aria-pressed={cell.isSelected}
              className={[
                "reservation-cal__day",
                cell.isSelected ? "is-selected" : "",
                cell.isToday && !cell.isSelected ? "is-today" : "",
                cell.disabled ? "is-disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(cell.ymd)}
            >
              {cell.day}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
