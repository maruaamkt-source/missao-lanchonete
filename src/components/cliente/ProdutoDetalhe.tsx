"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { moeda } from "@/lib/formatar";
import { adicionarItem } from "@/lib/sacola";

type Id = string | number;

type Opcao = {
  id: Id;
  nome: string;
  preco_extra: number | string;
};

type Grupo = {
  id: Id;
  nome: string;
  obrigatorio: boolean;
  min_escolhas: number | null;
  max_escolhas: number | null;
  opcoes: Opcao[];
};

export type ProdutoDetalheDados = {
  id: Id;
  nome: string;
  descricao: string | null;
  preco: number | string;
  imagem_url: string | null;
  grupos: Grupo[];
};

function limites(g: Grupo) {
  const min = g.obrigatorio
    ? Math.max(1, g.min_escolhas ?? 1)
    : (g.min_escolhas ?? 0);
  const max =
    g.max_escolhas && g.max_escolhas > 0 ? g.max_escolhas : g.opcoes.length;
  return { min: Math.min(min, g.opcoes.length), max };
}

function rotulo(g: Grupo) {
  const { min, max } = limites(g);
  if (max === 1) return min >= 1 ? "Obrigatório • Escolha 1" : "Opcional • Escolha 1";
  if (min >= 1)
    return `Obrigatório • Escolha ${min === max ? min : `de ${min} a ${max}`}`;
  return `Opcional • Até ${max}`;
}

export default function ProdutoDetalhe({
  produto,
}: {
  produto: ProdutoDetalheDados;
}) {
  const router = useRouter();
  const [escolhas, setEscolhas] = useState<Record<string, Id[]>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");

  function alternar(g: Grupo, opcaoId: Id) {
    const chave = String(g.id);
    const { max } = limites(g);
    setEscolhas((atual) => {
      const lista = atual[chave] ?? [];
      const marcada = lista.includes(opcaoId);
      if (max === 1) {
        return {
          ...atual,
          [chave]: marcada && !g.obrigatorio ? [] : [opcaoId],
        };
      }
      if (marcada) {
        return { ...atual, [chave]: lista.filter((x) => x !== opcaoId) };
      }
      if (lista.length >= max) return atual;
      return { ...atual, [chave]: [...lista, opcaoId] };
    });
  }

  const valido = produto.grupos.every(
    (g) => (escolhas[String(g.id)] ?? []).length >= limites(g).min
  );

  const selecionadas = produto.grupos.flatMap((g) =>
    g.opcoes
      .filter((o) => (escolhas[String(g.id)] ?? []).includes(o.id))
      .map((o) => ({
        grupoId: g.id,
        opcaoId: o.id,
        nome: o.nome,
        precoExtra: Number(o.preco_extra),
      }))
  );

  const unitario =
    Number(produto.preco) +
    selecionadas.reduce((soma, o) => soma + o.precoExtra, 0);
  const total = unitario * quantidade;

  function adicionar() {
    if (!valido) return;
    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      precoBase: Number(produto.preco),
      quantidade,
      observacao: observacao.trim(),
      opcoes: selecionadas,
    });
    router.push("/");
  }

  return (
    <>
      <div className="grid gap-4 pb-32 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {produto.imagem_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="h-72 w-full rounded-xl object-cover shadow-md"
            />
          )}
          <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-titulo text-2xl text-oliva md:text-3xl">
                {produto.nome}
              </h1>
              <span className="whitespace-nowrap text-xl font-bold text-oliva">
                {moeda(produto.preco)}
              </span>
            </div>
            {produto.descricao && (
              <p className="text-carvao/70">{produto.descricao}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {produto.grupos.map((g) => {
            const { max } = limites(g);
            const lista = escolhas[String(g.id)] ?? [];
            const radio = max === 1;
            return (
              <section
                key={g.id}
                className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-carvao">{g.nome}</h2>
                  <span className="rounded bg-areia px-2 py-0.5 text-xs font-semibold text-carvao/70">
                    {rotulo(g)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {g.opcoes.map((o) => {
                    const marcada = lista.includes(o.id);
                    const bloqueada = !radio && !marcada && lista.length >= max;
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-areia p-3 transition-colors has-[:checked]:bg-oliva has-[:checked]:text-white ${
                          bloqueada ? "opacity-50" : ""
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type={radio ? "radio" : "checkbox"}
                            name={`grupo-${g.id}`}
                            checked={marcada}
                            disabled={bloqueada}
                            onChange={() => alternar(g, o.id)}
                            onClick={() => {
                              if (radio && marcada) alternar(g, o.id);
                            }}
                            className="h-5 w-5 accent-mostarda"
                          />
                          <span className="font-semibold">{o.nome}</span>
                        </span>
                        {Number(o.preco_extra) > 0 && (
                          <span className="whitespace-nowrap text-sm font-bold">
                            + {moeda(o.preco_extra)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <section className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm md:p-6">
            <label htmlFor="observacao" className="font-bold text-carvao">
              Observações <span className="text-xs font-normal text-carvao/50">(opcional)</span>
            </label>
            <textarea
              id="observacao"
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: sem cebola, molho à parte"
              className="w-full resize-none rounded-xl bg-areia p-3 text-sm outline-none focus:ring-2 focus:ring-oliva/30"
            />
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center rounded-xl bg-areia p-1">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-lg text-oliva active:scale-95"
            >
              <Minus size={20} />
            </button>
            <span className="w-8 text-center text-lg font-bold">
              {quantidade}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantidade((q) => Math.min(99, q + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-lg text-oliva active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          <button
            type="button"
            onClick={adicionar}
            disabled={!valido}
            className="flex h-14 flex-1 items-center justify-between rounded-xl bg-mostarda px-5 font-bold text-carvao shadow-sm transition-opacity disabled:opacity-50"
          >
            <span>{valido ? "Adicionar à sacola" : "Escolha as opções"}</span>
            <span>{moeda(total)}</span>
          </button>
        </div>
      </div>
    </>
  );
}