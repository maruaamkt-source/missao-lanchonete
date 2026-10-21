"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { sair } from "@/app/login/actions";
import { avancarPedido } from "@/app/cozinha/actions";
import AtualizarAuto from "@/components/admin/AtualizarAuto";

export type PedidoCozinha = {
  id: string;
  codigo: string;
  hora: string;
  status: "novo" | "em_preparo" | "pronto";
  observacao: string | null;
  itens: { nome: string; quantidade: number; observacao: string | null; opcoes: string[] }[];
};

const colunas = [
  { status: "novo", titulo: "Novos", cor: "bg-mostarda" },
  { status: "em_preparo", titulo: "Em preparo", cor: "bg-mostarda/40" },
  { status: "pronto", titulo: "Prontos", cor: "bg-oliva/15" },
] as const;

export default function QuadroCozinha({ pedidos }: { pedidos: PedidoCozinha[] }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-sm text-carvao/60">Missão Lanchonete</span>
          <h1 className="font-titulo text-2xl text-oliva sm:text-3xl">Cozinha</h1>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {colunas.map((c) => {
          const lista = pedidos.filter((p) => p.status === c.status);
          return (
            <section key={c.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-titulo text-xl text-oliva">{c.titulo}</h2>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${c.cor}`}>
                  {lista.length}
                </span>
              </div>

              {lista.length === 0 && (
                <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
                  Nenhum pedido.
                </p>
              )}

              {lista.map((p) => (
                <article
                  key={p.id}
                  className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">#{p.codigo}</span>
                    <span className="text-xs text-carvao/60">{p.hora}</span>
                  </div>

                  <ul className="space-y-2">
                    {p.itens.map((i, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="font-semibold">
                          {i.quantidade}x {i.nome}
                        </span>
                        {i.opcoes.map((o) => (
                          <span key={o} className="block text-carvao/70">
                            • {o}
                          </span>
                        ))}
                        {i.observacao && (
                          <span className="block italic text-tijolo">
                            Obs: {i.observacao}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {c.status === "novo" && (
                    <button
                      disabled={pendente}
                      onClick={() =>
                        iniciar(async () => {
                          const r = await avancarPedido(p.id, "novo", "em_preparo");
                          setErro(r.erro ?? "");
                        })
                      }
                      className="w-full rounded-xl bg-mostarda px-4 py-2.5 font-semibold text-carvao shadow-sm disabled:opacity-50"
                    >
                      Aceitar e preparar
                    </button>
                  )}
                  {c.status === "em_preparo" && (
                    <button
                      disabled={pendente}
                      onClick={() =>
                        iniciar(async () => {
                          const r = await avancarPedido(p.id, "em_preparo", "pronto");
                          setErro(r.erro ?? "");
                        })
                      }
                      className="w-full rounded-xl bg-oliva px-4 py-2.5 font-semibold text-white shadow-sm disabled:opacity-50"
                    >
                      Marcar como pronto
                    </button>
                  )}
                  {c.status === "pronto" && (
                    <p className="text-center text-xs font-bold uppercase text-oliva">
                      Aguardando motoboy
                    </p>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}