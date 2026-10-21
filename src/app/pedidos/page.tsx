import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obterPerfil } from "@/lib/auth";
import { moeda } from "@/lib/formatar";
import BarraInferior from "@/components/cliente/BarraInferior";

type PedidoLista = {
  id: string | number;
  status: string;
  total: number | string;
  criado_em?: string | null;
  created_at?: string | null;
  itens_pedido: { nome_produto: string; quantidade: number }[] | null;
};

const rotulos: Record<string, string> = {
  novo: "Recebido",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function corStatus(status: string) {
  if (status === "entregue") return "bg-green-100 text-green-800";
  if (status === "cancelado") return "bg-tijolo/10 text-tijolo";
  return "bg-mostarda/25 text-carvao";
}

function quando(p: PedidoLista) {
  const valor = p.criado_em ?? p.created_at;
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function Cartao({ pedido }: { pedido: PedidoLista }) {
  const itens = pedido.itens_pedido ?? [];
  const resumo = itens
    .map((i) => `${i.quantidade}x ${i.nome_produto}`)
    .join(", ");
  return (
    <Link
      href={`/pedidos/${pedido.id}`}
      className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-carvao">
            #{String(pedido.id).slice(0, 6).toUpperCase()}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${corStatus(
              pedido.status
            )}`}
          >
            {rotulos[pedido.status] ?? pedido.status}
          </span>
        </div>
        <span className="truncate text-sm text-carvao/70">{resumo}</span>
        <span className="text-xs text-carvao/50">{quando(pedido)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-bold text-oliva">
          {moeda(pedido.total)}
        </span>
        <ChevronRight size={20} className="text-carvao/40" />
      </div>
    </Link>
  );
}

async function Conteudo() {
  await connection();
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("*, itens_pedido(nome_produto, quantidade)")
    .eq("cliente_id", perfil.id);

  const pedidos = ((data ?? []) as unknown as PedidoLista[]).sort((a, b) => {
    const da = new Date(a.criado_em ?? a.created_at ?? 0).getTime();
    const db = new Date(b.criado_em ?? b.created_at ?? 0).getTime();
    return db - da;
  });

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-10 text-center shadow-sm">
        <Package size={48} className="text-oliva/40" />
        <h1 className="font-titulo text-2xl text-oliva">Nenhum pedido ainda</h1>
        <p className="text-sm text-carvao/70">
          Quando você fizer um pedido, ele aparece aqui.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-mostarda px-6 py-3 font-bold text-carvao"
        >
          Ver cardápio
        </Link>
      </div>
    );
  }

  const andamento = pedidos.filter(
    (p) => p.status !== "entregue" && p.status !== "cancelado"
  );
  const anteriores = pedidos.filter(
    (p) => p.status === "entregue" || p.status === "cancelado"
  );

  return (
    <div className="flex flex-col gap-6">
      {andamento.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-titulo text-xl text-oliva">Em andamento</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {andamento.map((p) => (
              <Cartao key={p.id} pedido={p} />
            ))}
          </div>
        </section>
      )}
      {anteriores.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-titulo text-xl text-oliva">Anteriores</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {anteriores.map((p) => (
              <Cartao key={p.id} pedido={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function PaginaPedidos() {
  return (
    <div className="min-h-screen bg-areia text-carvao">
      <header className="fixed inset-x-0 top-0 z-50 bg-areia/90 shadow-[0_1px_8px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <Link
            href="/"
            aria-label="Voltar ao cardápio"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-oliva shadow-sm"
          >
            <ArrowLeft size={22} />
          </Link>
          <span className="font-titulo text-lg text-oliva">Meus pedidos</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-20 md:px-6">
        <Suspense
          fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
        >
          <Conteudo />
        </Suspense>
      </main>

      <BarraInferior />
    </div>
  );
}