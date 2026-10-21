import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import InsumosLista, { type Insumo } from "@/components/admin/InsumosLista";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("insumos")
    .select("id, nome, unidade, estoque, estoque_minimo, custo_unitario")
    .order("nome");

  const insumos: Insumo[] = (data ?? []).map((i) => ({
    id: i.id,
    nome: i.nome,
    unidade: i.unidade,
    estoque: Number(i.estoque),
    estoque_minimo: Number(i.estoque_minimo),
    custo_unitario: Number(i.custo_unitario),
  }));

  const zerados = insumos.filter((i) => i.estoque <= 0).length;
  const baixos = insumos.filter(
    (i) => i.estoque > 0 && i.estoque <= i.estoque_minimo
  ).length;
  const valor = insumos.reduce((s, i) => s + i.estoque * i.custo_unitario, 0);

  const cards = [
    { titulo: "Insumos", valor: String(insumos.length) },
    { titulo: "Estoque baixo", valor: String(baixos) },
    { titulo: "Zerados", valor: String(zerados) },
    {
      titulo: "Valor em estoque",
      valor: valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <span className="text-sm text-carvao/60">
          Ingredientes e bebidas usados nas fichas dos produtos
        </span>
        <h1 className="font-titulo text-3xl text-oliva">Insumos</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.titulo}
            className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-sm"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-carvao/60">
              {c.titulo}
            </span>
            <span className="font-titulo text-3xl text-oliva">{c.valor}</span>
          </div>
        ))}
      </div>

      <InsumosLista insumos={insumos} />
    </div>
  );
}

export default function PaginaInsumos() {
  return (
    <main className="p-4 md:p-8">
      <Suspense
        fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
      >
        <Conteudo />
      </Suspense>
    </main>
  );
}