"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { moeda } from "@/lib/formatar";

type Id = string | number;

type ItemPedido = {
  nome_produto: string;
  preco_unitario: number | string;
  quantidade: number;
  observacao: string | null;
  itens_pedido_opcoes: { nome_opcao: string; preco_extra: number | string }[] | null;
};

export type PedidoDados = {
  id: Id;
  status: string;
  forma_pagamento: string;
  subtotal: number | string;
  taxa_entrega: number | string;
  total: number | string;
  endereco_entrega: string;
  observacao: string | null;
  itens_pedido: ItemPedido[] | null;
};

export type HistoricoItem = { status: string; quando: string | null };

const etapas = [
  { status: "novo", titulo: "Pedido recebido", desc: "Recebemos seu pedido e vamos começar o preparo." },
  { status: "em_preparo", titulo: "Em preparo", desc: "Seu lanche está na chapa." },
  { status: "pronto", titulo: "Pronto", desc: "Embalado e aguardando o motoboy." },
  { status: "saiu_para_entrega", titulo: "Saiu para entrega", desc: "O motoboy está a caminho." },
  { status: "entregue", titulo: "Entregue", desc: "Bom apetite!" },
];

const pagamentos: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão na entrega",
  dinheiro: "Dinheiro na entrega",
};

function hora(valor: string | null) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

export default function PedidoAcompanhar({
  pedido,
  historico,
}: {
  pedido: PedidoDados;
  historico: HistoricoItem[];
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`pedido-${pedido.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedido.id}`,
        },
        () => router.refresh()
      )
      .subscribe();
    const timer = setInterval(() => router.refresh(), 20000);
    return () => {
      supabase.removeChannel(canal);
      clearInterval(timer);
    };
  }, [pedido.id, router]);

  const cancelado = pedido.status === "cancelado";
  const atual = etapas.findIndex((e) => e.status === pedido.status);
  const codigo = String(pedido.id).slice(0, 6).toUpperCase();
  const itens = pedido.itens_pedido ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col">
          <span className="text-sm text-carvao/60">Pedido #{codigo}</span>
          <h1 className="font-titulo text-2xl text-oliva">
            {cancelado
              ? "Pedido cancelado"
              : pedido.status === "entregue"
              ? "Pedido entregue"
              : "Acompanhe seu pedido"}
          </h1>
        </div>

        {cancelado ? (
          <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
            Este pedido foi cancelado. Se precisar de ajuda, fale com o restaurante.
          </p>
        ) : (
          <ol className="flex flex-col">
            {etapas.map((e, idx) => {
              const feita = idx < atual || pedido.status === "entregue";
              const ativa = idx === atual && pedido.status !== "entregue";
              const quando = hora(
                historico.find((h) => h.status === e.status)?.quando ?? null
              );
              return (
                <li key={e.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        feita
                          ? "bg-oliva text-white"
                          : ativa
                          ? "animate-pulse bg-mostarda text-carvao"
                          : "bg-areia text-carvao/40"
                      }`}
                    >
                      {feita ? <Check size={18} /> : idx + 1}
                    </span>
                    {idx < etapas.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 ${feita ? "bg-oliva" : "bg-areia"}`}
                      />
                    )}
                  </div>
                  <div className="flex flex-col pb-5">
                    <span
                      className={`font-bold ${
                        feita || ativa ? "text-carvao" : "text-carvao/40"
                      }`}
                    >
                      {e.titulo}
                      {quando && (
                        <span className="ml-2 text-xs font-normal text-carvao/50">
                          {quando}
                        </span>
                      )}
                    </span>
                    {(feita || ativa) && (
                      <span className="text-sm text-carvao/70">{e.desc}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="flex h-fit flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:p-6">
        <h2 className="font-titulo text-xl text-oliva">Detalhes</h2>

        <div className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Entrega em</span>
          <span className="text-carvao/70">{pedido.endereco_entrega}</span>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="font-bold">Pagamento</span>
          <span className="text-carvao/70">
            {pagamentos[pedido.forma_pagamento] ?? pedido.forma_pagamento}
          </span>
        </div>

        <div className="flex flex-col gap-2 border-t border-carvao/10 pt-3">
          {itens.map((i, idx) => (
            <div key={idx} className="flex justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span className="font-semibold">
                  {i.quantidade}x {i.nome_produto}
                </span>
                {(i.itens_pedido_opcoes ?? []).map((o, k) => (
                  <span key={k} className="text-carvao/60">
                    {o.nome_opcao}
                  </span>
                ))}
                {i.observacao && (
                  <span className="italic text-carvao/60">Obs: {i.observacao}</span>
                )}
              </div>
              <span className="whitespace-nowrap font-semibold">
                {moeda(
                  (Number(i.preco_unitario) +
                    (i.itens_pedido_opcoes ?? []).reduce(
                      (s, o) => s + Number(o.preco_extra),
                      0
                    )) *
                    i.quantidade
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t border-carvao/10 pt-3 text-sm">
          <span className="text-carvao/70">Subtotal</span>
          <span className="font-semibold">{moeda(pedido.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-carvao/70">Taxa de entrega</span>
          <span className="font-semibold">{moeda(pedido.taxa_entrega)}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="font-bold">Total</span>
          <span className="font-bold text-oliva">{moeda(pedido.total)}</span>
        </div>
      </section>
    </div>
  );
}