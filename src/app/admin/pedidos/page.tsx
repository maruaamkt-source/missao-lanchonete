import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import AtualizarAuto from "@/components/admin/AtualizarAuto";
import QuadroPedidos, {
  type PedidoQuadro,
} from "@/components/admin/QuadroPedidos";

type Bruto = {
  id: string | number;
  status: string;
  total: number | string;
  cliente_id: string;
  motoboy_id: string | null;
  forma_pagamento: string;
  endereco_entrega: string | null;
  observacao: string | null;
  criado_em?: string | null;
  created_at?: string | null;
  itens_pedido:
    | {
        nome_produto: string;
        quantidade: number;
        observacao: string | null;
        itens_pedido_opcoes: { nome_opcao: string }[] | null;
      }[]
    | null;
};

type Perfil = {
  id: string;
  nome: string | null;
  telefone: string | null;
  papel: string;
  ativo: boolean;
};

const fuso = "America/Sao_Paulo";

function dataDe(p: Bruto) {
  return p.criado_em ?? p.created_at ?? null;
}

function tempo(p: Bruto) {
  return new Date(dataDe(p) ?? 0).getTime();
}

function dia(valor: string | number | null) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(
    new Date(valor)
  );
}

function hora(valor: string | null) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

async function Conteudo() {
  await connection();
  const supabase = await createClient();

  const [{ data: dadosPedidos }, { data: dadosPerfis }] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "*, itens_pedido(nome_produto, quantidade, observacao, itens_pedido_opcoes(nome_opcao))"
      ),
    supabase.from("perfis").select("id, nome, telefone, papel, ativo"),
  ]);

  const brutos = ((dadosPedidos ?? []) as unknown as Bruto[]).sort(
    (a, b) => tempo(a) - tempo(b)
  );
  const perfis = (dadosPerfis ?? []) as Perfil[];
  const porId = new Map(perfis.map((p) => [p.id, p]));

  const ativos = brutos.filter((p) =>
    ["novo", "em_preparo", "pronto", "saiu_para_entrega"].includes(p.status)
  );
  const entregues = brutos.filter((p) => p.status === "entregue").slice(-8);
  const cancelados = brutos.filter((p) => p.status === "cancelado").slice(-8);

  const hoje = dia(Date.now());
  const canceladosHoje = brutos.filter(
    (p) => p.status === "cancelado" && dia(dataDe(p)) === hoje
  ).length;

  const pedidos: PedidoQuadro[] = [
    ...ativos,
    ...entregues,
    ...cancelados,
  ].map((p) => ({
    id: p.id,
    curto: String(p.id).slice(0, 6).toUpperCase(),
    status: p.status,
    hora: hora(dataDe(p)),
    cliente: porId.get(p.cliente_id)?.nome || "Cliente",
    telefone: porId.get(p.cliente_id)?.telefone ?? "",
    endereco: p.endereco_entrega ?? "",
    total: Number(p.total),
    pagamento: p.forma_pagamento,
    observacao: p.observacao ?? "",
    motoboyId: p.motoboy_id,
    motoboyNome: p.motoboy_id ? porId.get(p.motoboy_id)?.nome ?? "" : "",
    itens: (p.itens_pedido ?? []).map((i) => ({
      nome: i.nome_produto,
      quantidade: i.quantidade,
      observacao: i.observacao ?? "",
      opcoes: (i.itens_pedido_opcoes ?? []).map((o) => o.nome_opcao),
    })),
  }));

  const motoboys = perfis
    .filter((p) => p.papel === "motoboy" && p.ativo)
    .map((p) => ({ id: p.id, nome: p.nome ?? "Motoboy" }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-sm text-carvao/60">
            {ativos.length} pedidos ativos • {canceladosHoje} cancelados hoje
          </span>
          <h1 className="font-titulo text-3xl text-oliva">Pedidos</h1>
        </div>
        <AtualizarAuto />
      </div>
      <QuadroPedidos pedidos={pedidos} />
    </div>
  );
}

export default function PaginaPedidosAdmin() {
  return (
    <main className="p-4 md:p-8">
      <Suspense
        fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
      >
        <Conteudo />
      </Suspense>
    </main>
  );
}