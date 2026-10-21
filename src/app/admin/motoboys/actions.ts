"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function alternarMotoboy(id: string, ativo: boolean) {
  const supabase = await createClient();
  await supabase
    .from("perfis")
    .update({ ativo })
    .eq("id", id)
    .eq("papel", "motoboy");
  revalidatePath("/admin/motoboys");
  revalidatePath("/admin");
}
export async function salvarTaxaMotoboy(id: string, taxa: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ taxa_percentual: taxa })
    .eq("id", id)
    .eq("papel", "motoboy");
  if (error) return { erro: error.message };
  revalidatePath("/admin/motoboys");
  return {};
}

export async function aplicarTaxaTodos(taxa: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ taxa_percentual: taxa })
    .eq("papel", "motoboy");
  if (error) return { erro: error.message };

  const { data: r } = await supabase
    .from("restaurante")
    .select("id")
    .limit(1)
    .single();
  if (r) {
    await supabase
      .from("restaurante")
      .update({ taxa_percentual: taxa })
      .eq("id", r.id);
  }
  revalidatePath("/admin/motoboys");
  revalidatePath("/");
  return {};
}