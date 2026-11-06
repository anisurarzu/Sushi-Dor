"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  /** Accessible label text for the trigger */
  "aria-label"?: string;
};

export function Select({
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
    <div ref={rootRef} className={`site-select relative ${className}`}>
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
        className={`site-select__trigger ${open ? "is-open" : ""}`}
      >
        <span
          className={
            selected ? "site-select__value" : "site-select__placeholder"
          }
        >
          {selected?.label || placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className={`site-select__chevron ${open ? "is-open" : ""}`}
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
        <ul id={listId} role="listbox" className="site-select__menu">
          {options.length === 0 ? (
            <li className="site-select__empty">Aucune option</li>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              const enabledIdx = enabled.findIndex(
                (o) => o.value === opt.value,
              );
              const isActive = !opt.disabled && enabledIdx === activeIndex;
              return (
                <li
                  key={opt.value || "__empty"}
                  role="option"
                  aria-selected={isSelected}
                >
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
                    className={[
                      "site-select__option",
                      isSelected ? "is-selected" : "",
                      isActive ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <span className="site-select__check" aria-hidden>
                        ✓
                      </span>
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
