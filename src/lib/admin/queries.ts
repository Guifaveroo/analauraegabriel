import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GiftOrderStatus } from "../types";

export type GuestRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  family_id: string | null;
  category_id: string | null;
  max_companions: number;
  notes: string;
};
export type GroupRow = { id: string; name: string; type: "family" | "category"; invite_code: string | null };
export type RsvpRow = {
  id: string;
  guest_id: string | null;
  name: string;
  attending: boolean;
  companions: string[];
  dietary: string;
  notes: string;
  responded_at: string;
};
export type OrderRow = {
  id: string;
  gift_id: string;
  guest_name: string;
  guest_email: string | null;
  amount: number;
  status: GiftOrderStatus;
  txid: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  gifts: { name: string } | null;
};

export async function loadGuestsData(db: SupabaseClient) {
  const [g, gr, r] = await Promise.all([
    db.from("guests").select("id,name,phone,email,family_id,category_id,max_companions,notes").order("name"),
    db.from("guest_groups").select("id,name,type,invite_code").order("name"),
    db.from("rsvp_responses").select("id,guest_id,name,attending,companions,dietary,notes,responded_at").order("responded_at", { ascending: false }),
  ]);
  return {
    guests: (g.data ?? []) as GuestRow[],
    groups: (gr.data ?? []) as GroupRow[],
    responses: (r.data ?? []) as RsvpRow[],
  };
}

export function rsvpStats(guests: GuestRow[], responses: RsvpRow[]) {
  const byGuest = new Set(responses.filter((r) => r.guest_id).map((r) => r.guest_id));
  const openResponses = responses.filter((r) => !r.guest_id).length;
  const attending = responses.filter((r) => r.attending);
  return {
    totalGuests: guests.length + openResponses,
    confirmed: attending.length,
    absent: responses.filter((r) => !r.attending).length,
    noResponse: guests.filter((g) => !byGuest.has(g.id)).length,
    people: attending.reduce((acc, r) => acc + 1 + (r.companions?.length ?? 0), 0),
  };
}

export async function loadOrders(db: SupabaseClient, status?: string) {
  let q = db
    .from("gift_orders")
    .select("id,gift_id,guest_name,guest_email,amount,status,txid,created_at,updated_at,paid_at,cancelled_at,gifts(name)")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return ((data ?? []) as unknown as OrderRow[]).map((o) => ({ ...o, amount: Number(o.amount) }));
}

export async function giftStats(db: SupabaseClient) {
  const [{ data: orders }, { data: stock }] = await Promise.all([
    db.from("gift_orders").select("status,amount"),
    db.rpc("public_gift_stock"),
  ]);
  const list = (orders ?? []) as { status: GiftOrderStatus; amount: number }[];
  const sum = (s: GiftOrderStatus) => list.filter((o) => o.status === s).reduce((a, o) => a + Number(o.amount), 0);
  return {
    available: ((stock ?? []) as { status: string }[]).filter((s) => s.status === "AVAILABLE").length,
    pendingCount: list.filter((o) => o.status === "PENDING").length,
    paidCount: list.filter((o) => o.status === "PAID").length,
    pendingTotal: sum("PENDING"),
    paidTotal: sum("PAID"),
  };
}
