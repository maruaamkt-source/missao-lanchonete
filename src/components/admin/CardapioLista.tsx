"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  alternarProduto,
  alternarCategoria,
  criarCategoria,
} from "@/app/admin/cardapio/actions";

type Categoria = { id: string; nome: string; ativa: boolean };
type Produto = {
  id: string;
  categoria_id: string;
  nome: string;
  preco: number | string;
  disponivel: boolean;
  codigo: string | null;
  imagem_url: string | null;
};

const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CardapioLista({
  categorias,
  produtos,
}: {
  categorias: Categoria[];
  produtos: Produto[];
}) {
  const [busca, setBusca] = useState("");
  const [novaCat, setNovaCat] = useState("");
  const [pendente, iniciar] = useTransition();

  const termo = busca.trim().toLowerCase();
  const filtrados = produtos.filter(
    (p) =>
      !termo ||
      p.nome.toLowerCase().includes(termo) ||
      (p.codigo ?? "").toLowerCase().includes(termo)
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titulo text-2xl text-oliva sm:text-3xl">Cardápio</h1>
        <Link
          href="/admin/cardapio/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-mostarda px-4 py-2 font-semibold text-carvao shadow-sm"
        >
          <Plus size={18} /> Novo produto
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-carvao/50"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código"
            className="w-full rounded-xl border border-oliva/20 bg-white py-2 pl-10 pr-3 text-carvao"
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            value={novaCat}
            onChange={(e) => setNovaCat(e.target.value)}
            placeholder="Nova categoria"
            className="rounded-xl border border-oliva/20 bg-white px-3 py-2 text-carvao"
          />
          <button
            disabled={pendente || !novaCat.trim()}
            onClick={() =>
              iniciar(async () => {
                await criarCategoria(novaCat);
                setNovaCat("");
              })
            }
            className="rounded-xl bg-oliva px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </div>

      {categorias.map((cat) => {
        const lista = filtrados.filter((p) => p.categoria_id === cat.id);
        if (termo && lista.length === 0) return null;
        return (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className={`font-titulo text-xl ${
                  cat.ativa ? "text-oliva" : "text-carvao/40"
                }`}
              >
                {cat.nome}{" "}
                <span className="text-sm text-carvao/50">({lista.length})</span>
              </h2>
              <button
                disabled={pendente}
                onClick={() =>
                  iniciar(() => alternarCategoria(cat.id, !cat.ativa))
                }
                className="rounded-lg border border-oliva/30 px-3 py-1 text-sm text-oliva"
              >
                {cat.ativa ? "Pausar categoria" : "Ativar categoria"}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ${
                    p.disponivel && cat.ativa ? "" : "opacity-60"
                  }`}
                >
                  {p.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagem_url}
                      alt={p.nome}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-areia" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-carvao">
                      {p.nome}
                    </p>
                    <p className="text-sm text-carvao/60">
                      {p.codigo ? `#${p.codigo} · ` : ""}
                      {brl(p.preco)}
                    </p>
                    <div className="mt-1 flex gap-3 text-sm">
                      <Link
                        href={`/admin/cardapio/${p.id}`}
                        className="text-oliva underline"
                      >
                        Editar
                      </Link>
                      <button
                        disabled={pendente}
                        onClick={() =>
                          iniciar(() => alternarProduto(p.id, !p.disponivel))
                        }
                        className={p.disponivel ? "text-tijolo" : "text-oliva"}
                      >
                        {p.disponivel ? "Pausar" : "Ativar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {lista.length === 0 && (
                <p className="text-sm text-carvao/50">Nenhum produto.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}