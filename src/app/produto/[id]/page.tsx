import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProdutoDetalhe, {
  type ProdutoDetalheDados,
} from "@/components/cliente/ProdutoDetalhe";

type OpcaoBruta = {
  id: string | number;
  nome: string;
  preco_extra: number | string;
  disponivel: boolean;
  ordem: number | null;
};

type GrupoBruto = {
  id: string | number;
  nome: string;
  obrigatorio: boolean;
  min_escolhas: number | null;
  max_escolhas: number | null;
  ordem: number | null;
  opcoes: OpcaoBruta[] | null;
};

type ProdutoBruto = {
  id: string | number;
  nome: string;
  descricao: string | null;
  preco: number | string;
  imagem_url: string | null;
  grupos_opcao: GrupoBruto[] | null;
};

async function Detalhe({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("produtos")
    .select(
      "id, nome, descricao, preco, imagem_url, grupos_opcao(id, nome, obrigatorio, min_escolhas, max_escolhas, ordem, opcoes(id, nome, preco_extra, disponivel, ordem))"
    )
    .eq("id", id)
    .eq("disponivel", true)
    .maybeSingle();

  if (!data) notFound();

  const bruto = data as unknown as ProdutoBruto;

  const produto: ProdutoDetalheDados = {
    id: bruto.id,
    nome: bruto.nome,
    descricao: bruto.descricao,
    preco: bruto.preco,
    imagem_url: bruto.imagem_url,
    grupos: (bruto.grupos_opcao ?? [])
      .slice()
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((g) => ({
        id: g.id,
        nome: g.nome,
        obrigatorio: g.obrigatorio,
        min_escolhas: g.min_escolhas,
        max_escolhas: g.max_escolhas,
        opcoes: (g.opcoes ?? [])
          .filter((o) => o.disponivel)
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
          .map((o) => ({
            id: o.id,
            nome: o.nome,
            preco_extra: o.preco_extra,
          })),
      }))
      .filter((g) => g.opcoes.length > 0),
  };

  return <ProdutoDetalhe produto={produto} />;
}

export default function PaginaProduto({
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
          <span className="font-titulo text-lg text-oliva">
            Detalhes do lanche
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-20 md:px-6">
        <Suspense
          fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
        >
          <Detalhe params={params} />
        </Suspense>
      </main>
    </div>
  );
}