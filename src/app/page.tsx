import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Bike, Clock, User, UtensilsCrossed } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { statusRestaurante } from "@/lib/horario";
import { moeda } from "@/lib/formatar";
import CardapioLista from "@/components/cliente/CardapioLista";
import BarraInferior from "@/components/cliente/BarraInferior";

async function Cardapio() {
  await connection();
  const supabase = await createClient();

  const [{ data: restaurante }, { data: categorias }, { data: produtos }] =
    await Promise.all([
      supabase.from("restaurante").select("*").limit(1).maybeSingle(),
      supabase
        .from("categorias")
        .select("id, nome")
        .eq("ativa", true)
        .order("ordem"),
      supabase
        .from("produtos")
        .select("id, categoria_id, nome, descricao, preco, imagem_url")
        .eq("disponivel", true)
        .order("nome"),
    ]);

  if (!restaurante) {
    return (
      <p className="py-10 text-center text-sm text-carvao/60">
        Restaurante ainda não configurado.
      </p>
    );
  }

  const status = statusRestaurante(restaurante);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-col gap-2 lg:max-w-xl">
          <div className="flex items-center gap-3">
            <h1 className="font-titulo text-2xl text-oliva md:text-3xl">
              {restaurante.nome}
            </h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                status.aberto
                  ? "bg-green-100 text-green-800"
                  : "bg-tijolo/10 text-tijolo"
              }`}
            >
              {status.aberto ? "Aberto agora" : "Fechado"}
            </span>
          </div>
          {restaurante.descricao && (
            <p className="text-sm text-carvao/70">{restaurante.descricao}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-[320px] lg:shrink-0">
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-areia p-2 text-center">
            <Bike size={20} className="text-oliva" />
            <span className="text-[11px] text-carvao/60">Entrega</span>
            <span className="text-sm font-bold">
              {moeda(restaurante.taxa_entrega ?? 0)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-areia p-2 text-center">
            <Clock size={20} className="text-oliva" />
            <span className="text-[11px] text-carvao/60">Hoje</span>
            <span className="text-sm font-bold">{status.textoHoje}</span>
          </div>
        </div>
      </section>

      {!status.aberto && (
        <div className="rounded-xl bg-tijolo/10 p-4 text-sm text-tijolo">
          Estamos fechados no momento. Dá pra ver o cardápio, mas só é possível
          finalizar o pedido quando abrirmos.
        </div>
      )}

      <CardapioLista categorias={categorias ?? []} produtos={produtos ?? []} />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-areia text-carvao">
      <header className="fixed inset-x-0 top-0 z-50 bg-areia/90 shadow-[0_1px_8px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-oliva text-mostarda">
              <UtensilsCrossed size={20} />
            </div>
            <span className="font-titulo text-lg text-oliva">
              Missão Lanchonete
            </span>
          </div>
          <Link
            href="/painel"
            aria-label="Minha conta"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-oliva text-white"
          >
            <User size={18} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-20 md:px-6">
        <Suspense
          fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
        >
          <Cardapio />
        </Suspense>
      </main>

      <BarraInferior />
    </div>
  );
}