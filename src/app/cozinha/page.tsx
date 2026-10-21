import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QuadroCozinha, {
  type PedidoCozinha,
} from "@/components/cozinha/QuadroCozinha";

type Linha = {
  id: string | number;
  status: string;
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

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select(
      "*, itens_pedido(nome_produto, quantidade, observacao, itens_pedido_opcoes(nome_opcao))"
    )
    .in("status", ["novo", "em_preparo", "pronto"]);

  const linhas = (data ?? []) as unknown as Linha[];
  const data_ = (l: Linha) => l.criado_em ?? l.created_at ?? null;

  const pedidos: PedidoCozinha[] = linhas
    .sort(
      (a, b) =>
        new Date(data_(a) ?? 0).getTime() - new Date(data_(b) ?? 0).getTime()
    )
    .map((l) => ({
      id: String(l.id),
      codigo: String(l.id).slice(0, 6).toUpperCase(),
      hora: data_(l)
        ? new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(data_(l)!))
        : "",
      status: l.status as PedidoCozinha["status"],
      observacao: l.observacao,
      itens: (l.itens_pedido ?? []).map((i) => ({
        nome: i.nome_produto,
        quantidade: i.quantidade,
        observacao: i.observacao,
        opcoes: (i.itens_pedido_opcoes ?? []).map((o) => o.nome_opcao),
      })),
    }));

  return <QuadroCozinha pedidos={pedidos} />;
}

export default function Page() {
  return (
    <main>
      <Suspense
        fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
      >
        <Conteudo />
      </Suspense>
    </main>
  );
}