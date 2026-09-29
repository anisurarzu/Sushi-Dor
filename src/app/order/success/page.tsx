import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ order?: string; session_id?: string }>;
};

/** Legacy URL — redirect to canonical checkout success. */
export default async function OrderSuccessRedirect({ searchParams }: Props) {
  const { order, session_id } = await searchParams;
  const qs = new URLSearchParams();
  if (session_id) qs.set("session_id", session_id);
  if (order) qs.set("order", order);
  redirect(`/checkout/success?${qs.toString()}`);
}
