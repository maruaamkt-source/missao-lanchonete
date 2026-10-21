"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function atualizar() {
  revalidatePath("/motoboy");
  revalidatePath("/cozinha");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}

export async function aceitarEntrega(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada." };

  const { data, error } = await supabase
    .from("pedidos")
    .update({ motoboy_id: user.id, status: "saiu_para_entrega" })
    .eq("id", id)
    .eq("status", "pronto")
    .is("motoboy_id", null)
    .select("id");
  if (error) return { erro: error.message };
  if (!data?.length) return { erro: "Outro motoboy já pegou essa entrega." };
  atualizar();
  return {};
}

export async function concluirEntrega(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada." };

  const { data, error } = await supabase
    .from("pedidos")
    .update({ status: "entregue" })
    .eq("id", id)
    .eq("status", "saiu_para_entrega")
    .eq("motoboy_id", user.id)
    .select("id");
  if (error) return { erro: error.message };
  if (!data?.length) return { erro: "Pedido já mudou de status." };
  atualizar();
  return {};
}   