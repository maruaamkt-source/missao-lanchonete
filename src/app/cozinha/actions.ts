"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function avancarPedido(
  id: string,
  de: "novo" | "em_preparo",
  para: "em_preparo" | "pronto"
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .update({ status: para })
    .eq("id", id)
    .eq("status", de)
    .select("id");
  if (error) return { erro: error.message };
  if (!data?.length) return { erro: "Pedido já mudou de status." };
  revalidatePath("/cozinha");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return {};
}