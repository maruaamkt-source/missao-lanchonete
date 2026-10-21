"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultado = { ok?: true; erro?: string };

export type EnderecoForm = {
  id?: string | number;
  rotulo: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  referencia: string;
};

async function usuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function atualizar() {
  revalidatePath("/perfil");
  revalidatePath("/checkout");
}

export async function salvarPerfil(dados: {
  nome: string;
  telefone: string;
}): Promise<Resultado> {
  const nome = dados.nome.trim();
  const telefone = dados.telefone.trim();
  if (nome.length < 2) return { erro: "Digite seu nome." };
  if (telefone.length < 8) return { erro: "Informe um telefone válido." };

  const { supabase, user } = await usuario();
  if (!user) return { erro: "Faça login de novo." };

  const { error } = await supabase
    .from("perfis")
    .update({ nome, telefone })
    .eq("id", user.id);
  if (error) return { erro: "Não foi possível salvar." };

  atualizar();
  return { ok: true };
}

export async function salvarEndereco(d: EnderecoForm): Promise<Resultado> {
  const rua = d.rua.trim();
  const numero = d.numero.trim();
  const bairro = d.bairro.trim();
  if (!rua || !numero || !bairro) {
    return { erro: "Preencha rua, número e bairro." };
  }

  const { supabase, user } = await usuario();
  if (!user) return { erro: "Faça login de novo." };

  const campos = {
    rotulo: d.rotulo.trim() || "Endereço",
    rua,
    numero,
    bairro,
    complemento: d.complemento.trim() || null,
    referencia: d.referencia.trim() || null,
  };

  if (d.id) {
    const { error } = await supabase
      .from("enderecos")
      .update(campos)
      .eq("id", d.id)
      .eq("cliente_id", user.id);
    if (error) return { erro: "Não foi possível salvar." };
  } else {
    const { count } = await supabase
      .from("enderecos")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", user.id);
    const { error } = await supabase.from("enderecos").insert({
      ...campos,
      cliente_id: user.id,
      padrao: (count ?? 0) === 0,
    });
    if (error) return { erro: "Não foi possível salvar." };
  }

  atualizar();
  return { ok: true };
}

export async function definirPrincipal(id: string | number): Promise<Resultado> {
  const { supabase, user } = await usuario();
  if (!user) return { erro: "Faça login de novo." };

  await supabase
    .from("enderecos")
    .update({ padrao: false })
    .eq("cliente_id", user.id);
  const { error } = await supabase
    .from("enderecos")
    .update({ padrao: true })
    .eq("id", id)
    .eq("cliente_id", user.id);
  if (error) return { erro: "Não foi possível alterar." };

  atualizar();
  return { ok: true };
}

export async function removerEndereco(id: string | number): Promise<Resultado> {
  const { supabase, user } = await usuario();
  if (!user) return { erro: "Faça login de novo." };

  const { data: atual } = await supabase
    .from("enderecos")
    .select("padrao")
    .eq("id", id)
    .eq("cliente_id", user.id)
    .single();

  const { error } = await supabase
    .from("enderecos")
    .delete()
    .eq("id", id)
    .eq("cliente_id", user.id);
  if (error) return { erro: "Não foi possível remover." };

  if (atual?.padrao) {
    const { data: outro } = await supabase
      .from("enderecos")
      .select("id")
      .eq("cliente_id", user.id)
      .limit(1)
      .maybeSingle();
    if (outro) {
      await supabase.from("enderecos").update({ padrao: true }).eq("id", outro.id);
    }
  }

  atualizar();
  return { ok: true };
}