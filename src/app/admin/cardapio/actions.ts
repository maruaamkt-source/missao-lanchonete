"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function alternarProduto(id: string, disponivel: boolean) {
  const supabase = await createClient();
  await supabase.from("produtos").update({ disponivel }).eq("id", id);
  revalidatePath("/admin/cardapio");
}

export async function alternarCategoria(id: string, ativa: boolean) {
  const supabase = await createClient();
  await supabase.from("categorias").update({ ativa }).eq("id", id);
  revalidatePath("/admin/cardapio");
}

export async function criarCategoria(nome: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1);
  const proxima = (data?.[0]?.ordem ?? 0) + 1;
  await supabase
    .from("categorias")
    .insert({ nome: limpo, ordem: proxima, ativa: true });
  revalidatePath("/admin/cardapio");
}