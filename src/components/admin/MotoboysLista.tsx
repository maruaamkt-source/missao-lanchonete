"use client";

import { useState, useTransition } from "react";
import {
  alternarMotoboy,
  salvarTaxaMotoboy,
  aplicarTaxaTodos,
} from "@/app/admin/motoboys/actions";

export type Motoboy = {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  emRota: boolean;
  entregues: number;
  taxa: number;
};

export default function MotoboysLista({ motoboys }: { motoboys: Motoboy[] }) {
  const [pendente, iniciar] = useTransition();
  const [taxas, setTaxas] = useState<Record<string, string>>(
    Object.fromEntries(motoboys.map((m) => [m.id, String(m.taxa)]))
  );
  const [todos, setTodos] = useState("");
  const [msg, setMsg] = useState("");
  const num = (v: string) => Number(v.replace(",", ".")) || 0;

  if (motoboys.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-carvao/60 shadow-sm">
        Nenhum motoboy cadastrado. Cadastra uma conta com papel motoboy.
      </p>
    );
  }

  return (
    <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <label className="mb-1 block text-sm text-carvao/70">
          Taxa para todos (%)
        </label>
        <input
          className="w-32 rounded-xl border border-oliva/20 bg-white px-3 py-2 text-carvao"
          inputMode="decimal"
          value={todos}
          onChange={(e) => setTodos(e.target.value)}
        />
      </div>
      <button
        disabled={pendente || !todos}
        onClick={() =>
          iniciar(async () => {
            const t = num(todos);
            const r = await aplicarTaxaTodos(t);
            if (r.erro) return setMsg(r.erro);
            setTaxas(Object.fromEntries(motoboys.map((m) => [m.id, String(t)])));
            setMsg("Aplicado a todos.");
          })
        }
        className="rounded-xl bg-mostarda px-5 py-2 font-semibold text-carvao shadow-sm disabled:opacity-50"
      >
        Aplicar a todos
      </button>
      {msg && <span className="text-sm text-oliva">{msg}</span>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {motoboys.map((m) => (
        <div
          key={m.id}
          className={`flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ${
            m.ativo ? "" : "opacity-60"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-carvao">{m.nome}</p>
              <p className="text-sm text-carvao/60">
                {m.telefone || "Sem telefone"}
              </p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                !m.ativo
                  ? "bg-carvao/10 text-carvao/60"
                  : m.emRota
                  ? "bg-oliva text-white"
                  : "bg-mostarda/40 text-carvao"
              }`}
            >
              {!m.ativo ? "Inativo" : m.emRota ? "Em rota" : "Livre"}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-carvao/60">
                Taxa (%)
              </label>
              <input
                className="w-full rounded-xl border border-oliva/20 bg-white px-3 py-1.5 text-carvao"
                inputMode="decimal"
                value={taxas[m.id] ?? ""}
                onChange={(e) =>
                  setTaxas((t) => ({ ...t, [m.id]: e.target.value }))
                }
              />
            </div>
            <button
              disabled={pendente}
              onClick={() =>
                iniciar(async () => {
                  const r = await salvarTaxaMotoboy(m.id, num(taxas[m.id] ?? ""));
                  setMsg(r.erro ?? `Taxa de ${m.nome} salva.`);
                })
              }
              className="rounded-lg border border-oliva/40 px-3 py-1.5 text-sm text-oliva disabled:opacity-40"
            >
              Salvar
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-carvao/60">
              {m.entregues} entregas
            </span>
            <button
              disabled={pendente || m.emRota}
              onClick={() => iniciar(() => alternarMotoboy(m.id, !m.ativo))}
              className={`rounded-lg border px-3 py-1 text-sm disabled:opacity-40 ${
                m.ativo
                  ? "border-tijolo/40 text-tijolo"
                  : "border-oliva/40 text-oliva"
              }`}
            >
              {m.ativo ? "Desativar" : "Ativar"}
            </button>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}