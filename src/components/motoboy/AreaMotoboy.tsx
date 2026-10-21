"use client";

import { useState, useTransition } from "react";
import { LogOut, Phone } from "lucide-react";
import { sair } from "@/app/login/actions";
import { aceitarEntrega, concluirEntrega } from "@/app/motoboy/actions";
import AtualizarAuto from "@/components/admin/AtualizarAuto";

export type PedidoMoto = {
  id: string;
  codigo: string;
  hora: string;
  status: "pronto" | "saiu_para_entrega" | "entregue";
  endereco: string;
  pagamento: string;
  total: number;
  observacao: string | null;
  cliente: string;
  telefone: string | null;
  itens: string[];
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formas: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

export default function AreaMotoboy({ pedidos }: { pedidos: PedidoMoto[] }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");

  const andamento = pedidos.filter((p) => p.status === "saiu_para_entrega");
  const disponiveis = pedidos.filter((p) => p.status === "pronto");
  const historico = pedidos.filter((p) => p.status === "entregue").reverse();

  function Card({ p }: { p: PedidoMoto }) {
    return (
      <article className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold">#{p.codigo}</span>
          <span className="text-xs text-carvao/60">{p.hora}</span>
        </div>

        <div className="text-sm">
          <p className="font-semibold">{p.cliente}</p>
          <p className="text-carvao/70">{p.endereco}</p>
        </div>

        <ul className="text-sm text-carvao/80">
          {p.itens.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>

        {p.observacao && (
          <p className="rounded-lg bg-areia p-2 text-sm italic text-tijolo">
            Obs: {p.observacao}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <span>{formas[p.pagamento] ?? p.pagamento}</span>
          <span className="font-bold text-oliva">{brl(p.total)}</span>
        </div>

        {p.status === "saiu_para_entrega" && p.telefone && (
          <a
            href={`tel:${p.telefone}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-oliva/30 py-2 text-sm font-semibold text-oliva"
          >
            <Phone size={16} /> Ligar para o cliente
          </a>
        )}

        {p.status === "pronto" && (
          <button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await aceitarEntrega(p.id);
                setErro(r.erro ?? "");
              })
            }
            className="w-full rounded-xl bg-mostarda px-4 py-2.5 font-semibold text-carvao shadow-sm disabled:opacity-50"
          >
            Aceitar entrega
          </button>
        )}

        {p.status === "saiu_para_entrega" && (
          <button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await concluirEntrega(p.id);
                setErro(r.erro ?? "");
              })
            }
            className="w-full rounded-xl bg-oliva px-4 py-2.5 font-semibold text-white shadow-sm disabled:opacity-50"
          >
            Marcar como entregue
          </button>
        )}
      </article>
    );
  }

  function Secao({
    titulo,
    lista,
    vazio,
  }: {
    titulo: string;
    lista: PedidoMoto[];
    vazio: string;
  }) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-titulo text-xl text-oliva">{titulo}</h2>
          <span className="rounded bg-mostarda/40 px-2 py-0.5 text-xs font-bold">
            {lista.length}
          </span>
        </div>
        {lista.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
            {vazio}
          </p>
        )}
        {lista.map((p) => (
          <Card key={p.id} p={p} />
        ))}
      </section>
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

      <Secao
        titulo="Em andamento"
        lista={andamento}
        vazio="Nenhuma entrega em andamento."
      />
      <Secao
        titulo="Disponíveis"
        lista={disponiveis}
        vazio="Nenhum pedido pronto agora."
      />
      <Secao
        titulo="Histórico"
        lista={historico}
        vazio="Nenhuma entrega concluída."
      />
    </div>
  );
}