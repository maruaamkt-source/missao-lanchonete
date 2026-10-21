"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Ficha = { insumo_id: string; quantidade: number };

export type DadosProduto = {
  id?: string;
  nome: string;
  categoria_id: string;
  codigo: string;
  descricao: string;
  preco: number;
  disponivel: boolean;
  imagem_url: string | null;
  ficha: Ficha[];
};

export async function salvarProduto(d: DadosProduto) {
  const supabase = await createClient();
  const campos = {
    nome: d.nome.trim(),
    categoria_id: d.categoria_id,
    codigo: d.codigo.trim() || null,
    descricao: d.descricao.trim() || null,
    preco: d.preco,
    disponivel: d.disponivel,
    imagem_url: d.imagem_url,
  };

  let id = d.id;
  if (id) {
    const { error } = await supabase.from("produtos").update(campos).eq("id", id);
    if (error) return { erro: error.message };
  } else {
    const { data, error } = await supabase
      .from("produtos")
      .insert(campos)
      .select("id")
      .single();
    if (error) return { erro: error.message };
    id = data.id as string;
  }

  await supabase.from("produto_insumos").delete().eq("produto_id", id);
  const ficha = d.ficha.filter((f) => f.insumo_id && f.quantidade > 0);
  if (ficha.length) {
    const { error } = await supabase
      .from("produto_insumos")
      .insert(ficha.map((f) => ({ ...f, produto_id: id })));
    if (error) return { erro: error.message };
  }

  revalidatePath("/admin/cardapio");
  revalidatePath("/");
  redirect("/admin/cardapio");
}

export async function excluirProduto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) return { erro: "Não dá pra excluir (já tem pedido com ele). Use Pausar." };
  revalidatePath("/admin/cardapio");
  revalidatePath("/");
  redirect("/admin/cardapio");
}