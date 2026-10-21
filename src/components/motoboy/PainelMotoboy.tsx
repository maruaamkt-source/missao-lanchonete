"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { sair } from "@/app/login/actions";
import { aceitarEntrega, concluirEntrega } from "@/app/motoboy/actions";
import AtualizarAuto from "@/components/admin/AtualizarAuto";

export type PedidoMotoboy = {
  id: string;
  codigo: string;
  hora: string;
  endereco: string;
  pagamento: string;
  total: string;
  taxa: string;
  observacao: string | null;
};

type Props = {
  emAndamento: PedidoMotoboy[];
  disponiveis: PedidoMotoboy[];
  historico: PedidoMotoboy[];
};

const nomePagamento: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

export default function PainelMotoboy({
  emAndamento,
  disponiveis,
  historico,
}: Props) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");

  function Card({
    p,
    acao,
  }: {
    p: PedidoMotoboy;
    acao?: { texto: string; classe: string; fn: () => Promise<{ erro?: string }> };
  }) {
    return (
      <article className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold">#{p.codigo}</span>
          <span className="text-xs text-carvao/60">{p.hora}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{p.endereco}</p>
          {p.observacao && (
            <p className="italic text-tijolo">Obs: {p.observacao}</p>
          )}
          <p className="text-carvao/70">
            {nomePagamento[p.pagamento] ?? p.pagamento} · Total {p.total} · Taxa{" "}
            {p.taxa}
          </p>
          {p.pagamento === "dinheiro" && (
            <p className="font-bold text-tijolo">Cobrar {p.total} na entrega</p>
          )}
        </div>
        {acao && (
          <button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await acao.fn();
                setErro(r.erro ?? "");
              })
            }
            className={`w-full rounded-xl px-4 py-2.5 font-semibold shadow-sm disabled:opacity-50 ${acao.classe}`}
          >
            {acao.texto}
          </button>
        )}
      </article>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-sm text-carvao/60">Missão Lanchonete</span>
          <h1 className="font-titulo text-2xl text-oliva sm:text-3xl">
            Entregas
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <AtualizarAuto />
          <form action={sair}>
            <button
              type="submit"
              aria-label="Sair"
              className="flex items-center gap-2 rounded-lg border border-oliva/30 px-3 py-2 text-sm text-oliva"
            >
              <LogOut size={18} /> Sair
            </button>
          </form>
        </div>
      </div>

      {erro && <p className="text-sm text-tijolo">{erro}</p>}

      <section className="space-y-3">
        <h2 className="font-titulo text-xl text-oliva">
          Em andamento ({emAndamento.length})
        </h2>
        {emAndamento.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
            Nenhuma entrega em andamento.
          </p>
        )}
        {emAndamento.map((p) => (
          <Card
            key={p.id}
            p={p}
            acao={{
              texto: "Marcar como entregue",
              classe: "bg-oliva text-white",
              fn: () => concluirEntrega(p.id),
            }}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-xl text-oliva">
          Disponíveis ({disponiveis.length})
        </h2>
        {disponiveis.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
            Nenhum pedido pronto no momento.
          </p>
        )}
        {disponiveis.map((p) => (
          <Card
            key={p.id}
            p={p}
            acao={{
              texto: "Aceitar entrega",
              classe: "bg-mostarda text-carvao",
              fn: () => aceitarEntrega(p.id),
            }}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-xl text-oliva">Histórico</h2>
        {historico.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
            Nenhuma entrega concluída.
          </p>
        )}
        {historico.map((p) => (
          <Card key={p.id} p={p} />
        ))}
      </section>
    </div>
  );
}