"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type AdminSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  options: AdminSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  /** Accessible label text for the trigger */
  "aria-label"?: string;
};

export function AdminSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner…",
  disabled = false,
  name,
  className = "",
  "aria-label": ariaLabel,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((o) => o.value === value);
  const enabled = options.filter((o) => !o.disabled);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = enabled.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, value, enabled]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        const opt = enabled[activeIndex];
        if (opt) choose(opt.value);
      } else {
        setActiveIndex((i) => Math.min(enabled.length - 1, Math.max(0, i) + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel || placeholder}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 border border-[#c4a35a]/25 bg-[#0a0908] px-3 py-2.5 text-left text-sm transition-colors hover:border-[#c4a35a]/45 focus:border-[#c4a35a] focus:outline-none disabled:opacity-40 ${
          open ? "border-[#c4a35a]/55" : ""
        }`}
      >
        <span
          className={
            selected ? "truncate text-[#f0e6c8]" : "truncate text-[#a89f8e]"
          }
        >
          {selected?.label || placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className={`shrink-0 text-[#c4a35a] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-[#c4a35a]/30 bg-[#12100e] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#a89f8e]">Aucune option</li>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              const enabledIdx = enabled.findIndex((o) => o.value === opt.value);
              const isActive = !opt.disabled && enabledIdx === activeIndex;
              return (
                <li key={opt.value || "__empty"} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onMouseEnter={() => {
                      if (!opt.disabled && enabledIdx >= 0) {
                        setActiveIndex(enabledIdx);
                      }
                    }}
                    onClick={() => {
                      if (!opt.disabled) choose(opt.value);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm disabled:opacity-40 ${
                      isSelected
                        ? "bg-[#c4a35a]/15 text-[#e0c878]"
                        : isActive
                          ? "bg-white/5 text-[#f0e6c8]"
                          : "text-[#c4bbaa] hover:bg-white/5 hover:text-[#f0e6c8]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <span className="ml-2 text-[0.65rem] text-[#c4a35a]">✓</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
