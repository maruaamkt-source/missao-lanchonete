"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { moeda } from "@/lib/formatar";
import {
  alterarQuantidade,
  precoUnitario,
  removerItem,
  subtotalSacola,
  totalItem,
  useSacola,
} from "@/lib/sacola";

function useMontado() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function SacolaConteudo({
  taxaPercentual,
  aberto,
}: {
  taxaPercentual: number;
  aberto: boolean;
}) {
  const montado = useMontado();
  const itens = useSacola();

  if (!montado) {
    return <p className="py-10 text-center text-sm">Carregando...</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-10 text-center shadow-sm">
        <ShoppingBag size={48} className="text-oliva/40" />
        <h1 className="font-titulo text-2xl text-oliva">Sacola vazia</h1>
        <p className="text-sm text-carvao/70">
          Escolha algo no cardápio pra começar o pedido.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-mostarda px-6 py-3 font-bold text-carvao"
        >
          Ver cardápio
        </Link>
      </div>
    );
  }

  const subtotal = subtotalSacola(itens);
  const taxaEntrega = Math.round(subtotal * taxaPercentual) / 100;
  const total = subtotal + taxaEntrega;

  return (
    <div className="grid gap-4 pb-8 lg:grid-cols-3 lg:gap-6">
      <section className="flex flex-col gap-3 lg:col-span-2">
        <h1 className="font-titulo text-2xl text-oliva">Sua sacola</h1>
        {itens.map((item) => (
          <article
            key={item.chave}
            className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-carvao">{item.nome}</h2>
                {item.opcoes.map((o) => (
                  <span
                    key={`${o.grupoId}-${o.opcaoId}`}
                    className="text-sm text-carvao/70"
                  >
                    {o.nome}
                    {o.precoExtra > 0 && ` (+ ${moeda(o.precoExtra)})`}
                  </span>
                ))}
                {item.observacao && (
                  <span className="text-sm italic text-carvao/60">
                    Obs: {item.observacao}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remover ${item.nome}`}
                onClick={() => removerItem(item.chave)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-tijolo hover:bg-tijolo/10"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center rounded-xl bg-areia p-1">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() =>
                    alterarQuantidade(item.chave, item.quantidade - 1)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-oliva active:scale-95"
                >
                  <Minus size={18} />
                </button>
                <span className="w-8 text-center font-bold">
                  {item.quantidade}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() =>
                    alterarQuantidade(
                      item.chave,
                      Math.min(99, item.quantidade + 1)
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-oliva active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-carvao/50">
                  {moeda(precoUnitario(item))} cada
                </span>
                <span className="text-lg font-bold text-oliva">
                  {moeda(totalItem(item))}
                </span>
              </div>
            </div>
          </article>
        ))}

        <Link href="/" className="text-sm font-semibold text-oliva underline">
          Adicionar mais itens
        </Link>
      </section>

      <aside className="flex h-fit flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:p-6 lg:sticky lg:top-20">
        <h2 className="font-titulo text-xl text-oliva">Resumo</h2>

        <div className="flex justify-between text-sm">
          <span className="text-carvao/70">Subtotal</span>
          <span className="font-semibold">{moeda(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-carvao/70">Taxa de entrega</span>
          <span className="font-semibold">{moeda(taxaEntrega)}</span>
        </div>
        <div className="flex justify-between border-t border-carvao/10 pt-3 text-lg">
          <span className="font-bold">Total</span>
          <span className="font-bold text-oliva">{moeda(total)}</span>
        </div>

        {!aberto && (
          <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
            Estamos fechados no momento. Dá pra montar a sacola, mas só é
            possível finalizar quando abrirmos.
          </p>
        )}

        {aberto ? (
          <Link
            href="/checkout"
            className="flex h-14 items-center justify-center rounded-xl bg-mostarda font-bold text-carvao shadow-sm"
          >
            Ir para o pagamento
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-14 items-center justify-center rounded-xl bg-mostarda font-bold text-carvao opacity-50"
          >
            Ir para o pagamento
          </button>
        )}
      </aside>
    </div>
  );
}