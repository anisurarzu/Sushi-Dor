"use client";

export function ListSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="list-skeleton" aria-busy="true" aria-live="polite">
      <div className="list-skeleton-toolbar">
        <span className="sk sk-chip" />
        <span className="sk sk-chip" />
        <span className="sk sk-chip" />
      </div>
      <div className="overflow-x-auto border border-[#c4a35a]/20">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#12100e]">
            <tr>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i} className="px-3 py-3">
                  <span className="sk sk-line sk-line-sm" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} className="border-t border-[#c4a35a]/10">
                {Array.from({ length: cols }, (_, c) => (
                  <td key={c} className="px-3 py-3.5">
                    <span
                      className={`sk sk-line ${c === 0 ? "sk-thumb" : c === 1 ? "sk-line-lg" : "sk-line-md"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
