"use client";

import { useState, useTransition } from "react";
import { salvarConfig, type DiaHorario } from "@/app/admin/configuracoes/actions";

const dias = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type Modo = "horario" | "24h" | "fechado";

type Inicial = {
  taxa_percentual: number;
  horario: Record<string, DiaHorario>;
  status_manual: string | null;
  status_manual_ate: string;
};

const campo =
  "w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-carvao";

function modoDe(d?: DiaHorario): Modo {
  if (d?.["24h"]) return "24h";
  if (d?.fechado || !d?.abre) return "fechado";
  return "horario";
}

export default function ConfigForm({ inicial }: { inicial: Inicial }) {
  const [taxa, setTaxa] = useState(String(inicial.taxa_percentual));
  const [horario, setHorario] = useState<Record<string, DiaHorario>>(
    inicial.horario ?? {}
  );
  const [status, setStatus] = useState(inicial.status_manual ?? "");
  const [ate, setAte] = useState(inicial.status_manual_ate);
  const [msg, setMsg] = useState("");
  const [pendente, iniciar] = useTransition();

  function mudaModo(k: string, m: Modo) {
    setHorario((h) => ({
      ...h,
      [k]:
        m === "24h"
          ? { "24h": true }
          : m === "fechado"
          ? { fechado: true }
          : { abre: h[k]?.abre ?? "18:00", fecha: h[k]?.fecha ?? "23:00" },
    }));
  }

  function mudaHora(k: string, campoH: "abre" | "fecha", v: string) {
    setHorario((h) => ({ ...h, [k]: { ...h[k], [campoH]: v } }));
  }

  function salvar() {
    setMsg("");
    iniciar(async () => {
      const r = await salvarConfig({
        taxa_percentual: Number(taxa.replace(",", ".")) || 0,
        horario,
        status_manual: status || null,
        status_manual_ate: ate ? new Date(`${ate}:00-03:00`).toISOString() : null,
      });
      setMsg(r.erro ?? "Salvo.");
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <span className="text-sm text-carvao/60">Dados do restaurante</span>
        <h1 className="font-titulo text-2xl text-oliva sm:text-3xl">
          Configurações
        </h1>
      </div>

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-titulo text-xl text-oliva">Aberto / fechado</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-carvao/70">Modo</label>
            <select
              className={campo}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Automático (pelo horário)</option>
              <option value="aberto">Forçar aberto</option>
              <option value="fechado">Forçar fechado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-carvao/70">
              Até quando (vazio = sem prazo)
            </label>
            <input
              type="datetime-local"
              className={campo}
              disabled={!status}
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-titulo text-xl text-oliva">Horário de funcionamento</h2>
        {dias.map((nome, i) => {
          const k = String(i);
          const m = modoDe(horario[k]);
          return (
            <div key={k} className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm font-semibold text-carvao">
                {nome}
              </span>
              <select
                className={`${campo} w-36`}
                value={m}
                onChange={(e) => mudaModo(k, e.target.value as Modo)}
              >
                <option value="horario">Horário</option>
                <option value="24h">24 horas</option>
                <option value="fechado">Fechado</option>
              </select>
              {m === "horario" && (
                <>
                  <input
                    type="time"
                    className={`${campo} w-32`}
                    value={horario[k]?.abre ?? ""}
                    onChange={(e) => mudaHora(k, "abre", e.target.value)}
                  />
                  <span className="text-sm text-carvao/60">às</span>
                  <input
                    type="time"
                    className={`${campo} w-32`}
                    value={horario[k]?.fecha ?? ""}
                    onChange={(e) => mudaHora(k, "fecha", e.target.value)}
                  />
                </>
              )}
            </div>
          );
        })}
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={pendente}
          className="rounded-xl bg-mostarda px-6 py-2.5 font-semibold text-carvao shadow-sm disabled:opacity-50"
        >
          {pendente ? "Salvando..." : "Salvar"}
        </button>
        {msg && (
          <span
            className={`text-sm ${msg === "Salvo." ? "text-oliva" : "text-tijolo"}`}
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}