import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { statusRestaurante } from "@/lib/horario";
import SacolaConteudo from "@/components/cliente/SacolaConteudo";
import BarraInferior from "@/components/cliente/BarraInferior";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const { data: restaurante } = await supabase
    .from("restaurante")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!restaurante) {
    return (
      <p className="py-10 text-center text-sm text-carvao/60">
        Restaurante ainda não configurado.
      </p>
    );
  }

  const status = statusRestaurante(restaurante);

  return (
    <SacolaConteudo
      taxaPercentual={Number(restaurante.taxa_percentual ?? 0)}      aberto={status.aberto}
    />
  );
}

export default function PaginaSacola() {
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
          <span className="font-titulo text-lg text-oliva">Sacola</span>
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