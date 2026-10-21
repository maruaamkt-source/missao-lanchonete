"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { moeda } from "@/lib/formatar";

type Id = string | number;

type Categoria = { id: Id; nome: string };
type Produto = {
  id: Id;
  categoria_id: Id;
  nome: string;
  descricao: string | null;
  preco: number | string;
  imagem_url: string | null;
};

export default function CardapioLista({
  categorias,
  produtos,
}: {
  categorias: Categoria[];
  produtos: Produto[];
}) {
  const [categoria, setCategoria] = useState<Id | "todas">("todas");
  const [busca, setBusca] = useState("");

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return categorias
      .filter((c) => categoria === "todas" || c.id === categoria)
      .map((c) => ({
        categoria: c,
        itens: produtos.filter(
          (p) =>
            p.categoria_id === c.id &&
            (!termo ||
              p.nome.toLowerCase().includes(termo) ||
              (p.descricao ?? "").toLowerCase().includes(termo))
        ),
      }))
      .filter((g) => g.itens.length > 0);
  }, [categorias, produtos, categoria, busca]);

  const pilula = (ativa: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
      ativa ? "bg-oliva text-white" : "bg-white text-carvao/70"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carvao/40"
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no cardápio"
          className="h-12 w-full rounded-xl bg-white pl-12 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-oliva/30"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <button
          onClick={() => setCategoria("todas")}
          className={pilula(categoria === "todas")}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoria(c.id)}
            className={pilula(categoria === c.id)}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {grupos.length === 0 && (
        <p className="py-10 text-center text-sm text-carvao/60">
          Nenhum item encontrado.
        </p>
      )}

      {grupos.map(({ categoria: c, itens }) => (
        <section key={c.id} className="flex flex-col gap-3">
          <h2 className="font-titulo text-xl text-oliva md:text-2xl">
            {c.nome}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {itens.map((p) => (
              <Link
                key={p.id}
                href={`/produto/${p.id}`}
                className="flex h-full flex-col justify-between gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  {p.imagem_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagem_url}
                      alt={p.nome}
                      className="h-44 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-carvao">{p.nome}</h3>
                    {p.descricao && (
                      <p className="line-clamp-3 text-sm text-carvao/70">
                        {p.descricao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-oliva">
                    {moeda(p.preco)}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mostarda text-carvao shadow-sm">
                    <Plus size={24} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}