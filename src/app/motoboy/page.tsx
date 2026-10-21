import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import PainelMotoboy, {
  type PedidoMotoboy,
} from "@/components/motoboy/PainelMotoboy";

type Linha = {
  id: string | number;
  endereco_entrega: string | null;
  forma_pagamento: string;
  total: number;
  taxa_entrega: number;
  observacao: string | null;
  criado_em?: string | null;
  created_at?: string | null;
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v ?? 0)
  );

const dataDe = (l: Linha) => l.criado_em ?? l.created_at ?? null;

function converter(linhas: Linha[]): PedidoMotoboy[] {
  return linhas.map((l) => ({
    id: String(l.id),
    codigo: String(l.id).slice(0, 6).toUpperCase(),
    hora: dataDe(l)
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(dataDe(l)!))
      : "",
    endereco: l.endereco_entrega ?? "",
    pagamento: l.forma_pagamento,
    total: brl(l.total),
    taxa: brl(l.taxa_entrega),
    observacao: l.observacao,
  }));
}

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [a, d, h] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*")
      .eq("status", "saiu_para_entrega")
      .eq("motoboy_id", user.id),
    supabase
      .from("pedidos")
      .select("*")
      .eq("status", "pronto")
      .is("motoboy_id", null),
    supabase
      .from("pedidos")
      .select("*")
      .eq("status", "entregue")
      .eq("motoboy_id", user.id)
      .limit(30),
  ]);

  const ordenar = (x: Linha[], desc = false) =>
    x.sort((p, q) => {
      const r =
        new Date(dataDe(p) ?? 0).getTime() - new Date(dataDe(q) ?? 0).getTime();
      return desc ? -r : r;
    });

  return (
    <PainelMotoboy
      emAndamento={converter(ordenar((a.data ?? []) as unknown as Linha[]))}
      disponiveis={converter(ordenar((d.data ?? []) as unknown as Linha[]))}
      historico={converter(ordenar((h.data ?? []) as unknown as Linha[], true))}
    />
  );
}

export default function MotoboyPage() {
  return (
    <main className="min-h-screen bg-areia text-carvao">
      <Suspense
        fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
      >
        <Conteudo />
      </Suspense>
    </main>
  );
}