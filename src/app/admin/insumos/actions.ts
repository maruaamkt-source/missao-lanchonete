"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obterPerfil } from "@/lib/auth";

type Resultado = { ok?: true; erro?: string };

export type InsumoForm = {
  id?: string;
  nome: string;
  unidade: string;
  estoque: number;
  estoqueMinimo: number;
  custoUnitario: number;
};

async function ehAdmin() {
  const perfil = await obterPerfil();
  return !!perfil && perfil.ativo && perfil.papel === "admin";
}

function atualizar() {
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/cardapio");
  revalidatePath("/");
}

export async function salvarInsumo(d: InsumoForm): Promise<Resultado> {
  if (!(await ehAdmin())) return { erro: "Sem permissão." };

  const nome = d.nome.trim();
  if (!nome) return { erro: "Digite o nome do insumo." };
  const numeros = [d.estoque, d.estoqueMinimo, d.custoUnitario];
  if (numeros.some((n) => !Number.isFinite(n) || n < 0)) {
    return { erro: "Confira os números." };
  }

  const campos = {
    nome,
    unidade: d.unidade.trim() || "un",
    estoque: d.estoque,
    estoque_minimo: d.estoqueMinimo,
    custo_unitario: d.custoUnitario,
  };

  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from("insumos").update(campos).eq("id", d.id)
    : await supabase.from("insumos").insert(campos);
  if (error) return { erro: "Não foi possível salvar." };

  atualizar();
  return { ok: true };
}

export async function reporEstoque(
  id: string,
  quantidade: number
): Promise<Resultado> {
  if (!(await ehAdmin())) return { erro: "Sem permissão." };
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return { erro: "Digite uma quantidade maior que zero." };
  }

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("insumos")
    .select("estoque")
    .eq("id", id)
    .single();
  if (!atual) return { erro: "Insumo não encontrado." };

  const { error } = await supabase
    .from("insumos")
    .update({ estoque: Number(atual.estoque) + quantidade })
    .eq("id", id);
  if (error) return { erro: "Não foi possível repor." };

  atualizar();
  return { ok: true };
}

export async function removerInsumo(id: string): Promise<Resultado> {
  if (!(await ehAdmin())) return { erro: "Sem permissão." };

  const supabase = await createClient();
  const { error } = await supabase.from("insumos").delete().eq("id", id);
  if (error) return { erro: "Não foi possível remover." };

  atualizar();
  return { ok: true };
}