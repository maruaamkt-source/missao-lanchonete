"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OpcaoDados = {
  id?: string;
  nome: string;
  preco_extra: number;
  disponivel: boolean;
  insumos: { insumo_id: string; quantidade: number }[];
};

export type GrupoDados = {
  id: string;
  nome: string;
  obrigatorio: boolean;
  min_escolhas: number;
  max_escolhas: number;
  ordem: number;
  opcoes: OpcaoDados[];
};

export async function criarGrupo(produtoId: string, ordem: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupos_opcao")
    .insert({
      produto_id: produtoId,
      nome: "Novo grupo",
      obrigatorio: false,
      min_escolhas: 0,
      max_escolhas: 1,
      ordem,
    })
    .select("id")
    .single();
  if (error) return { erro: error.message };
  return { id: data.id as string };
}

export async function salvarGrupo(produtoId: string, g: GrupoDados) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("grupos_opcao")
    .update({
      nome: g.nome.trim() || "Grupo",
      obrigatorio: g.obrigatorio,
      min_escolhas: g.obrigatorio ? Math.max(g.min_escolhas, 1) : g.min_escolhas,
      max_escolhas: Math.max(g.max_escolhas, 1),
      ordem: g.ordem,
    })
    .eq("id", g.id);
  if (error) return { erro: error.message };

  const { data: existentes } = await supabase
    .from("opcoes")
    .select("id")
    .eq("grupo_id", g.id);
  const mantidos = g.opcoes.map((o) => o.id).filter(Boolean) as string[];
  const remover = (existentes ?? [])
    .map((e) => e.id as string)
    .filter((id) => !mantidos.includes(id));
  if (remover.length) {
    await supabase.from("opcao_insumos").delete().in("opcao_id", remover);
    await supabase.from("opcoes").delete().in("id", remover);
  }

  const ids: string[] = [];
  for (let i = 0; i < g.opcoes.length; i++) {
    const o = g.opcoes[i];
    const campos = {
      grupo_id: g.id,
      nome: o.nome.trim() || "Opção",
      preco_extra: o.preco_extra,
      disponivel: o.disponivel,
      ordem: i,
    };
    let oid = o.id;
    if (oid) {
      const { error: e } = await supabase
        .from("opcoes")
        .update(campos)
        .eq("id", oid);
      if (e) return { erro: e.message };
    } else {
      const { data, error: e } = await supabase
        .from("opcoes")
        .insert(campos)
        .select("id")
        .single();
      if (e) return { erro: e.message };
      oid = data.id as string;
    }
    ids.push(oid);

    await supabase.from("opcao_insumos").delete().eq("opcao_id", oid);
    const ins = o.insumos.filter((x) => x.insumo_id && x.quantidade > 0);
    if (ins.length) {
      const { error: e } = await supabase
        .from("opcao_insumos")
        .insert(ins.map((x) => ({ ...x, opcao_id: oid })));
      if (e) return { erro: e.message };
    }
  }

  revalidatePath(`/admin/cardapio/${produtoId}`);
  revalidatePath("/");
  return { ids };
}

export async function excluirGrupo(produtoId: string, grupoId: string) {
  const supabase = await createClient();
  const { data: ops } = await supabase
    .from("opcoes")
    .select("id")
    .eq("grupo_id", grupoId);
  const ids = (ops ?? []).map((o) => o.id as string);
  if (ids.length) {
    await supabase.from("opcao_insumos").delete().in("opcao_id", ids);
    await supabase.from("opcoes").delete().in("id", ids);
  }
  const { error } = await supabase
    .from("grupos_opcao")
    .delete()
    .eq("id", grupoId);
  if (error) return { erro: error.message };
  revalidatePath(`/admin/cardapio/${produtoId}`);
  revalidatePath("/");
  return {};
}