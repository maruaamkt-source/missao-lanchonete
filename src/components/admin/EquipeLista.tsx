"use client";

import { useState, useTransition } from "react";
import AtualizarAuto from "@/components/admin/AtualizarAuto";
import {
  aprovar,
  recusar,
  novoCodigo,
  trocarCargo,
  alternarAtivo,
} from "@/app/admin/equipe/actions";

export type Membro = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  papel: string;
  cargo_pedido: "motoboy" | "cozinha" | null;
  codigo_acesso: string | null;
  codigo_validado: boolean;
  ativo: boolean;
};

type Cargo = "motoboy" | "cozinha";

const cargos: Record<Cargo, string> = { cozinha: "Cozinha", motoboy: "Motoboy" };

function situacao(m: Membro) {
  if (!m.ativo) return { txt: "Bloqueado", cor: "bg-tijolo/15 text-tijolo" };
  if (!m.codigo_validado)
    return { txt: "Aguardando código", cor: "bg-mostarda/40 text-carvao" };
  return { txt: "Ativo", cor: "bg-oliva/15 text-oliva" };
}

export default function EquipeLista({ membros }: { membros: Membro[] }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");

  const pendentes = membros.filter(
    (m) => m.papel === "cliente" && m.cargo_pedido
  );
  const equipe = membros.filter(
    (m) => m.papel === "motoboy" || m.papel === "cozinha"
  );

  function rodar(fn: () => Promise<{ erro?: string }>) {
    iniciar(async () => {
      const r = await fn();
      setErro(r.erro ?? "");
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titulo text-2xl text-oliva sm:text-3xl">Equipe</h1>
        <AtualizarAuto />
      </div>

      {erro && <p className="text-sm text-tijolo">{erro}</p>}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-titulo text-xl text-oliva">Pendentes</h2>
          <span className="rounded bg-mostarda/40 px-2 py-0.5 text-xs font-bold">
            {pendentes.length}
          </span>
        </div>
        {pendentes.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
            Nenhuma conta esperando aprovação.
          </p>
        )}
        {pendentes.map((m) => (
          <article
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="text-sm">
              <p className="font-semibold">{m.nome}</p>
              <p className="text-carvao/70">{m.email}</p>
              {m.telefone && <p className="text-carvao/70">{m.telefone}</p>}
              <p className="mt-1 text-xs font-bold uppercase text-oliva">
                Quer ser: {cargos[m.cargo_pedido as Cargo]}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={pendente}
                onClick={() =>
                  rodar(() => aprovar(m.id, m.cargo_pedido as Cargo))
                }
                className="rounded-xl bg-mostarda px-4 py-2 text-sm font-semibold text-carvao disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                disabled={pendente}
                onClick={() => rodar(() => recusar(m.id))}
                className="rounded-xl border border-tijolo/40 px-4 py-2 text-sm font-semibold text-tijolo disabled:opacity-50"
              >
                Recusar
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-titulo text-xl text-oliva">Funcionários</h2>
          <span className="rounded bg-oliva/15 px-2 py-0.5 text-xs font-bold">
            {equipe.length}
          </span>
        </div>
        {equipe.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm text-carvao/50 shadow-sm">
            Nenhum funcionário ainda.
          </p>
        )}
        {equipe.map((m) => {
          const s = situacao(m);
          return (
            <article
              key={m.id}
              className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold">{m.nome}</p>
                  <p className="text-carvao/70">{m.email}</p>
                  {m.telefone && <p className="text-carvao/70">{m.telefone}</p>}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${s.cor}`}
                >
                  {s.txt}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={m.papel}
                  disabled={pendente}
                  onChange={(e) => {
                    if (
                      window.confirm(
                        "Trocar o cargo gera um novo código e o funcionário precisa digitá-lo. Continuar?"
                      )
                    )
                      rodar(() => trocarCargo(m.id, e.target.value as Cargo));
                  }}
                  className="rounded-lg border border-oliva/30 bg-areia px-3 py-2 text-sm"
                >
                  <option value="cozinha">Cozinha</option>
                  <option value="motoboy">Motoboy</option>
                </select>

                <span className="rounded-lg bg-areia px-3 py-2 font-mono text-lg tracking-widest">
                  {m.codigo_acesso ?? "------"}
                </span>
                {m.codigo_validado && (
                  <span className="text-xs text-carvao/50">já usado</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={pendente}
                  onClick={() => {
                    if (
                      window.confirm(
                        "O código antigo para de valer e o funcionário perde o acesso até digitar o novo. Continuar?"
                      )
                    )
                      rodar(() => novoCodigo(m.id));
                  }}
                  className="rounded-xl bg-mostarda px-4 py-2 text-sm font-semibold text-carvao disabled:opacity-50"
                >
                  Gerar novo código
                </button>
                <button
                  disabled={pendente}
                  onClick={() => rodar(() => alternarAtivo(m.id, !m.ativo))}
                  className="rounded-xl border border-oliva/30 px-4 py-2 text-sm font-semibold text-oliva disabled:opacity-50"
                >
                  {m.ativo ? "Bloquear" : "Desbloquear"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}