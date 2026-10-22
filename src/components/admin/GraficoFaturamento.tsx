"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { moeda } from "@/lib/formatar";

type Ponto = {
  dia: string;
  faturamento: number;
  pedidos: number;
  ticket: number;
};

export default function GraficoFaturamento({ dados }: { dados: Ponto[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1A1A" vertical={false} />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={48}
            tickFormatter={(v) => `R$${v}`}
          />
          <Tooltip
            cursor={{ fill: "#F3EDE0" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Ponto;
              return (
                <div className="rounded-lg bg-white p-3 text-xs shadow-md">
                  <p className="mb-1 font-bold text-oliva">{p.dia}</p>
                  <p>Faturamento: {moeda(p.faturamento)}</p>
                  <p>Pedidos: {p.pedidos}</p>
                  <p>Ticket médio: {moeda(p.ticket)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="faturamento" radius={[6, 6, 0, 0]}>
            {dados.map((_, i) => (
              <Cell key={i} fill={i === dados.length - 1 ? "#E8A317" : "#3B4A2F"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}