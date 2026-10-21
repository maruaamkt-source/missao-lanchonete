import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { obterPerfil } from "@/lib/auth";
import PedidoAcompanhar, {
  type HistoricoItem,
  type PedidoDados,
} from "@/components/cliente/PedidoAcompanhar";
import BarraInferior from "@/components/cliente/BarraInferior";

async function Conteudo({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");

  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select(
      "id, status, forma_pagamento, subtotal, taxa_entrega, total, endereco_entrega, observacao, itens_pedido(nome_produto, preco_unitario, quantidade, observacao, itens_pedido_opcoes(nome_opcao, preco_extra))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!pedido) notFound();

  const { data: hist } = await supabase
    .from("historico_status")
    .select("*")
    .eq("pedido_id", id);

  const historico: HistoricoItem[] = (hist ?? []).map(
    (h: Record<string, string | null>) => ({
      status: h.status as string,
      quando: h.criado_em ?? h.created_at ?? h.data ?? null,
    })
  );

  return (
    <PedidoAcompanhar
      pedido={pedido as unknown as PedidoDados}
      historico={historico}
    />
  );
}

export default function PaginaPedido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          <span className="font-titulo text-lg text-oliva">Pedido</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-20 md:px-6">
        <Suspense
          fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
        >
          <Conteudo params={params} />
        </Suspense>
      </main>

      <BarraInferior />
    </div>
  );
}