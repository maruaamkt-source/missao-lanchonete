"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Cargo = "motoboy" | "cozinha";

const gerar = () => String(randomInt(0, 1000000)).padStart(6, "0");

function pronto(error: { message: string } | null) {
  if (error) return { erro: error.message };
  revalidatePath("/admin/equipe");
  return {};
}

export async function aprovar(id: string, cargo: Cargo) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({
      papel: cargo,
      cargo_pedido: null,
      codigo_acesso: gerar(),
      codigo_validado: false,
      tentativas: 0,
      ativo: true,
    })
    .eq("id", id)
    .eq("papel", "cliente");
  return pronto(error);
}

export async function recusar(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ cargo_pedido: null })
    .eq("id", id)
    .eq("papel", "cliente");
  return pronto(error);
}

export async function novoCodigo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ codigo_acesso: gerar(), codigo_validado: false, tentativas: 0 })
    .eq("id", id)
    .in("papel", ["motoboy", "cozinha"]);
  return pronto(error);
}

export async function trocarCargo(id: string, cargo: Cargo) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({
      papel: cargo,
      codigo_acesso: gerar(),
      codigo_validado: false,
      tentativas: 0,
    })
    .eq("id", id)
    .in("papel", ["motoboy", "cozinha"]);
  return pronto(error);
}

export async function alternarAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ ativo })
    .eq("id", id)
    .in("papel", ["motoboy", "cozinha"]);
  return pronto(error);
}
export async function contarPendentes() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("perfis")
    .select("id", { count: "exact", head: true })
    .eq("papel", "cliente")
    .not("cargo_pedido", "is", null);
  return count ?? 0;
}