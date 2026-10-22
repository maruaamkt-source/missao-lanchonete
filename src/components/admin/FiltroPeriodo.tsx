"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const opcoes = [
  ["hoje", "Hoje"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["6m", "6 meses"],
] as const;

export default function FiltroPeriodo({
  periodo,
  de,
  ate,
}: {
  periodo: string;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const [dDe, setDe] = useState(de);
  const [dAte, setAte] = useState(ate);

  function aplicar() {
    if (!dDe) return;
    router.push(`/admin?periodo=custom&de=${dDe}&ate=${dAte || dDe}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
      {opcoes.map(([valor, rotulo]) => (
        <button
          key={valor}
          onClick={() => router.push(`/admin?periodo=${valor}`)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            periodo === valor
              ? "bg-oliva text-white"
              : "bg-areia text-carvao hover:bg-areia/70"
          }`}
        >
          {rotulo}
        </button>
      ))}

      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 ${
          periodo === "custom" ? "bg-oliva/10" : ""
        }`}
      >
        <input
          type="date"
          value={dDe}
          onChange={(e) => setDe(e.target.value)}
          className="rounded-lg border border-carvao/20 px-2 py-1 text-sm"
        />
        <span className="text-sm text-carvao/60">até</span>
        <input
          type="date"
          value={dAte}
          onChange={(e) => setAte(e.target.value)}
          className="rounded-lg border border-carvao/20 px-2 py-1 text-sm"
        />
        <button
          onClick={aplicar}
          className="rounded-lg bg-mostarda px-3 py-1.5 text-sm font-bold text-carvao"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}