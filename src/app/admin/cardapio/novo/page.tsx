import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ProdutoForm from "@/components/admin/ProdutoForm";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const [{ data: categorias }, { data: insumos }] = await Promise.all([
    supabase.from("categorias").select("id, nome").order("ordem"),
    supabase
      .from("insumos")
      .select("id, nome, unidade, custo_unitario")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <ProdutoForm
      categorias={categorias ?? []}
      insumos={insumos ?? []}
      inicial={{
        nome: "",
        categoria_id: "",
        codigo: "",
        descricao: "",
        preco: 0,
        disponivel: true,
        imagem_url: null,
        ficha: [],
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-carvao/60">Carregando...</p>}>
      <Conteudo />
    </Suspense>
  );
}