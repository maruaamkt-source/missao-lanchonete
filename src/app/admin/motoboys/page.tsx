import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import MotoboysLista, { type Motoboy } from "@/components/admin/MotoboysLista";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const [{ data: perfis }, { data: pedidos }] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, telefone, ativo, taxa_percentual")
      .eq("papel", "motoboy")
      .order("nome"),
    supabase
      .from("pedidos")
      .select("motoboy_id, status")
      .not("motoboy_id", "is", null),
  ]);

  const motoboys: Motoboy[] = (perfis ?? []).map((p) => {
    const meus = (pedidos ?? []).filter((x) => x.motoboy_id === p.id);
    return {
      id: p.id,
      nome: p.nome ?? "Motoboy",
      telefone: p.telefone,
      ativo: p.ativo,
      emRota: meus.some((x) => x.status === "saiu_para_entrega"),
      entregues: meus.filter((x) => x.status === "entregue").length,
      taxa: Number(p.taxa_percentual ?? 10),
    };
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <span className="text-sm text-carvao/60">
          Quem pode pegar entregas
        </span>
        <h1 className="font-titulo text-3xl text-oliva">Motoboys</h1>
      </div>
      <MotoboysLista motoboys={motoboys} />
    </div>
  );
}

export default function Page() {
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