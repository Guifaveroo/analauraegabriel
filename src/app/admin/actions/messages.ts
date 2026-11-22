"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import type { AdminResult } from "@/components/admin/ActionForm";

export async function setMessageStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("messages")
    .update({ status: z.enum(["pending", "approved", "rejected"]).parse(status) })
    .eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<AdminResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("messages").delete().eq("id", z.string().uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
