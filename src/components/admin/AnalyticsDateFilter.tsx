"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DatePickerField } from "@/components/admin/DatePickerField";

type Props = {
  from: string;
  to: string;
  today: string;
  min?: string;
};

export function AnalyticsDateFilter({ from, to, today, min }: Props) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const qs = params.toString();
    router.push(qs ? `/admin/analytics?${qs}` : "/admin/analytics");
  }

  function resetLast30() {
    router.push("/admin/analytics");
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-col gap-3 border border-[#c4a35a]/20 bg-[#12100e] p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[12rem] flex-1">
        <DatePickerField
          label="Du"
          value={fromDate}
          onChange={setFromDate}
          today={today}
          min={min}
          max={toDate || today}
        />
      </div>
      <div className="min-w-[12rem] flex-1">
        <DatePickerField
          label="Au"
          value={toDate}
          onChange={setToDate}
          today={today}
          min={fromDate || min}
          max={today}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-gold px-4 py-2 text-[0.65rem]">
          Filtrer
        </button>
        <button
          type="button"
          onClick={resetLast30}
          className="btn-ghost px-4 py-2 text-[0.65rem]"
        >
          30 derniers jours
        </button>
      </div>
    </form>
  );
}
