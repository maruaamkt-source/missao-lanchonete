"use client";

import { useState } from "react";
import { Phone, Search } from "lucide-react";
import { moeda } from "@/lib/formatar";

export type PedidoQuadro = {
  id: string | number;
  curto: string;
  status: string;
  hora: string;
  cliente: string;
  telefone: string;
  endereco: string;
  total: number;
  pagamento: string;
  observacao: string;
  motoboyId: string | null;
  motoboyNome: string;
  itens: {
    nome: string;
    quantidade: number;
    observacao: string;
    opcoes: string[];
  }[];
};

const colunas = [
  { status: "novo", titulo: "Novos", cor: "bg-mostarda" },
  { status: "em_preparo", titulo: "Em preparo", cor: "bg-mostarda/50" },
  { status: "pronto", titulo: "Prontos", cor: "bg-oliva/40" },
  { status: "saiu_para_entrega", titulo: "Em rota", cor: "bg-oliva" },
  { status: "entregue", titulo: "Entregues", cor: "bg-green-500" },
  { status: "cancelado", titulo: "Cancelados", cor: "bg-tijolo" },
];

const pagamentos: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

function Cartao({ p }: { p: PedidoQuadro }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-titulo text-lg text-oliva">#{p.curto}</span>
        <span className="text-xs text-carvao/60">{p.hora}</span>
      </div>

      <div className="flex flex-col">
        <span className="font-bold">{p.cliente}</span>
        {p.telefone && (
          <span className="flex items-center gap-1 text-xs text-carvao/60">
            <Phone size={12} />
            {p.telefone}
          </span>
        )}
        <span className="mt-1 text-sm text-carvao/70">{p.endereco}</span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg bg-areia p-3 text-sm">
        {p.itens.map((i, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="font-semibold">
              {i.quantidade}x {i.nome}
            </span>
            {i.opcoes.length > 0 && (
              <span className="text-xs text-carvao/70">
                {i.opcoes.join(", ")}
              </span>
            )}
            {i.observacao && (
              <span className="text-xs italic text-carvao/70">
                Obs: {i.observacao}
              </span>
            )}
          </div>
        ))}
        {p.observacao && (
          <span className="border-t border-carvao/10 pt-1.5 text-xs italic">
            Obs do pedido: {p.observacao}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-carvao/60">
          {pagamentos[p.pagamento] ?? p.pagamento}
        </span>
        <span className="font-bold text-oliva">{moeda(p.total)}</span>
      </div>

      {p.status === "pronto" && (
        <span className="rounded-lg bg-areia px-3 py-2 text-sm font-semibold text-carvao/70">
          Aguardando motoboy
        </span>
      )}

      {p.status === "saiu_para_entrega" && (
        <span className="rounded-lg bg-oliva/10 px-3 py-2 text-sm font-semibold text-oliva">
          Motoboy: {p.motoboyNome || "—"}
        </span>
      )}
    </div>
  );
}

export default function QuadroPedidos({
  pedidos,
}: {
  pedidos: PedidoQuadro[];
}) {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase().replace("#", "");

  const visiveis = termo
    ? pedidos.filter(
        (p) =>
          p.curto.toLowerCase().includes(termo) ||
          p.cliente.toLowerCase().includes(termo) ||
          p.itens.some((i) => i.nome.toLowerCase().includes(termo))
      )
    : pedidos;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full md:w-96">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-carvao/50"
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por #código, cliente ou item"
          className="h-11 w-full rounded-xl bg-white pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-oliva/30"
        />
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {colunas.map((c) => {
          const lista = visiveis.filter((p) => p.status === c.status);
          return (
            <section
              key={c.status}
              className="flex flex-col gap-3 rounded-xl bg-carvao/5 p-3"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${c.cor}`} />
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {c.titulo}
                  </h2>
                </div>
                <span className="rounded-full bg-oliva px-2 py-0.5 text-xs font-bold text-white">
                  {lista.length}
                </span>
              </div>
              {lista.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-carvao/50">
                  Nenhum pedido
                </p>
              )}
              {lista.map((p) => (
                <Cartao key={p.id} p={p} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}