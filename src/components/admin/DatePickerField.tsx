"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ReservationCalendar } from "@/components/reservation/ReservationCalendar";

type Props = {
  value: string;
  onChange: (date: string) => void;
  today?: string;
  min?: string;
  max?: string;
  label?: string;
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
};

function formatFr(ymd: string) {
  if (!ymd) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${ymd}T12:00:00.000Z`));
  } catch {
    return ymd;
  }
}

export function DatePickerField({
  value,
  onChange,
  today,
  min,
  max,
  label,
  allowClear = false,
  placeholder = "Choisir une date",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const placePanel = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(280, Math.max(rect.width, 240));
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    const below = rect.bottom + 4;
    const spaceBelow = window.innerHeight - below;
    const preferAbove = spaceBelow < 320 && rect.top > spaceBelow;
    setPanelStyle({
      position: "fixed",
      top: preferAbove ? undefined : below,
      bottom: preferAbove ? window.innerHeight - rect.top + 4 : undefined,
      left,
      width,
      zIndex: 80,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    placePanel();
    function onScroll() {
      placePanel();
    }
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, placePanel]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      // Defer unmount past the current pointer event (avoids removeChild races)
      window.setTimeout(() => setOpen(false), 0);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function pick(d: string) {
    onChange(d);
    // Close after React applies the value change
    window.setTimeout(() => setOpen(false), 0);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      {label ? (
        <span className="mb-1 block text-[0.65rem] uppercase tracking-[0.14em] text-[#a89f8e]">
          {label}
        </span>
      ) : null}
      <div className="flex gap-2">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 border border-[#c4a35a]/30 bg-[#0c0b0a] px-3 py-2.5 text-left text-sm text-[#e8dfd0] hover:border-[#c4a35a]/55"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? listId : undefined}
        >
          <span
            className={value ? "truncate text-[#e8dfd0]" : "text-[#a89f8e]"}
          >
            {value ? formatFr(value) : placeholder}
          </span>
          <span aria-hidden className="shrink-0 text-[#c4a35a]">
            ▾
          </span>
        </button>
        {allowClear && value ? (
          <button
            type="button"
            className="shrink-0 border border-[#c4a35a]/25 px-2.5 text-xs text-[#a89f8e] hover:text-[#e0c878]"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            ✕
          </button>
        ) : null}
      </div>

      {mounted && open
        ? createPortal(
            <div
              ref={panelRef}
              id={listId}
              role="dialog"
              aria-label={label || "Choisir une date"}
              style={panelStyle}
              className="border border-[#c4a35a]/35 bg-[#12100e] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
            >
              <ReservationCalendar
                value={
                  value || today || new Date().toISOString().slice(0, 10)
                }
                today={today}
                min={min}
                max={max}
                onChange={pick}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
