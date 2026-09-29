"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { knownLatestId?: string };

export function OrderPoller({ knownLatestId }: Props) {
  const router = useRouter();
  const lastId = useRef(knownLatestId);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    lastId.current = knownLatestId;
  }, [knownLatestId]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/orders/latest", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          id?: string;
          orderNumber?: string;
        };
        if (data.id && lastId.current && data.id !== lastId.current) {
          setToast(`Nouvelle commande #${data.orderNumber}`);
          lastId.current = data.id;
          router.refresh();
          setTimeout(() => setToast(null), 6000);
        } else if (data.id && !lastId.current) {
          lastId.current = data.id;
        }
      } catch {
        // ignore
      }
    }, 12000);
    return () => clearInterval(id);
  }, [router]);

  if (!toast) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 border border-[#c4a35a] bg-[#12100e] px-4 py-3 text-sm text-[#e0c878] shadow-lg">
      {toast}
    </div>
  );
}
