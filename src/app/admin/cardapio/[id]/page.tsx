import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ProdutoForm from "@/components/admin/ProdutoForm";
import GruposOpcoes from "@/components/admin/GruposOpcoes";
import type { GrupoDados } from "../opcoes-actions";

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const [
    { data: gruposDb },
    { data: produto },
    { data: categorias },
    { data: insumos },
    { data: ficha },
  ] =
    await Promise.all([
      supabase
        .from("grupos_opcao")
        .select(
          "id, nome, obrigatorio, min_escolhas, max_escolhas, ordem, opcoes(id, nome, preco_extra, disponivel, ordem, opcao_insumos(insumo_id, quantidade))"
        )
        .eq("produto_id", id)
        .order("ordem"),
      supabase.from("produtos").select("*").eq("id", id).single(),
      supabase.from("categorias").select("id, nome").order("ordem"),
      supabase
        .from("insumos")
        .select("id, nome, unidade, custo_unitario")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("produto_insumos")
        .select("insumo_id, quantidade")
        .eq("produto_id", id),
    ]);

  if (!produto) notFound();

  const grupos: GrupoDados[] = (gruposDb ?? []).map((g) => ({
    id: g.id,
    nome: g.nome,
    obrigatorio: g.obrigatorio,
    min_escolhas: g.min_escolhas,
    max_escolhas: g.max_escolhas,
    ordem: g.ordem,
    opcoes: [...(g.opcoes ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((o) => ({
        id: o.id,
        nome: o.nome,
        preco_extra: Number(o.preco_extra),
        disponivel: o.disponivel,
        insumos: (o.opcao_insumos ?? []).map((x) => ({
          insumo_id: x.insumo_id,
          quantidade: Number(x.quantidade),
        })),
      })),
  }));

  return (
    <>
    <ProdutoForm
      categorias={categorias ?? []}
      insumos={insumos ?? []}
      inicial={{
        id: produto.id,
        nome: produto.nome,
        categoria_id: produto.categoria_id,
        codigo: produto.codigo ?? "",
        descricao: produto.descricao ?? "",
        preco: Number(produto.preco),
        disponivel: produto.disponivel,
        imagem_url: produto.imagem_url,
        ficha: (ficha ?? []).map((l) => ({
          insumo_id: l.insumo_id,
          quantidade: Number(l.quantidade),
        })),
      }}
    />
    <GruposOpcoes
      produtoId={produto.id}
      insumos={(insumos ?? []).map((i) => ({
        id: i.id,
        nome: i.nome,
        unidade: i.unidade,
      }))}
      inicial={grupos}
    />
    </>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-carvao/60">Carregando...</p>}>
      <Conteudo params={params} />
    </Suspense>
  );
}