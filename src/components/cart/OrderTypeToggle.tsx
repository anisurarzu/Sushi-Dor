"use client";

type OrderType = "TAKEAWAY" | "DELIVERY";

type Props = {
  value: OrderType;
  onChange: (type: OrderType) => void;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  name?: string;
};

export function OrderTypeToggle({
  value,
  onChange,
  pickupEnabled = true,
  deliveryEnabled = true,
  name,
}: Props) {
  const options: {
    type: OrderType;
    label: string;
    hint: string;
    enabled: boolean;
  }[] = [
    {
      type: "TAKEAWAY",
      label: "À emporter",
      hint: "Retrait sur place",
      enabled: pickupEnabled,
    },
    {
      type: "DELIVERY",
      label: "Livraison",
      hint: "À domicile",
      enabled: deliveryEnabled,
    },
  ];

  return (
    <div
      className="order-type-toggle"
      role="radiogroup"
      aria-label="Type de commande"
    >
      {options.map((opt) => {
        if (!opt.enabled) return null;
        const active = value === opt.type;
        return (
          <label
            key={opt.type}
            className={`order-type-option ${active ? "is-active" : ""}`}
          >
            <input
              type="radio"
              name={name ?? "orderType"}
              value={opt.type}
              className="sr-only"
              checked={active}
              onChange={() => onChange(opt.type)}
            />
            <span className="order-type-icon" aria-hidden>
              {opt.type === "TAKEAWAY" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 8Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 8V6.5A4 4 0 0 1 12 2.5v0a4 4 0 0 1 4 4V8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M3 7h11v9H3V7Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M14 10h3.2l2.3 3v3H14v-6Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="7" cy="18.5" r="1.5" fill="currentColor" />
                  <circle cx="17" cy="18.5" r="1.5" fill="currentColor" />
                </svg>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                {opt.label}
              </span>
              <span className="mt-0.5 block text-[0.68rem] font-normal normal-case tracking-normal text-mist">
                {opt.hint}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
