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

type Ponto = { hora: string; pedidos: number };

export default function GraficoPico({ dados }: { dados: Ponto[] }) {
  const maior = Math.max(...dados.map((d) => d.pedidos));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1A1A" vertical={false} />
          <XAxis
            dataKey="hora"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            interval={1}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "#F3EDE0" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Ponto;
              return (
                <div className="rounded-lg bg-white p-3 text-xs shadow-md">
                  <p className="font-bold text-oliva">{p.hora}</p>
                  <p>{p.pedidos} pedido(s)</p>
                </div>
              );
            }}
          />
          <Bar dataKey="pedidos" radius={[6, 6, 0, 0]}>
            {dados.map((d, i) => (
              <Cell
                key={i}
                fill={maior > 0 && d.pedidos === maior ? "#E8A317" : "#3B4A2F"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}