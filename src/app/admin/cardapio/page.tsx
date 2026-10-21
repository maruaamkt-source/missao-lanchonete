import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import CardapioLista from "@/components/admin/CardapioLista";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nome, ativa")
      .order("ordem", { ascending: true }),
    supabase
      .from("produtos")
      .select("id, categoria_id, nome, preco, disponivel, codigo, imagem_url")
      .order("nome", { ascending: true }),
  ]);

  return (
    <CardapioLista categorias={categorias ?? []} produtos={produtos ?? []} />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-carvao/60">Carregando...</p>}>
      <Conteudo />
    </Suspense>
  );
}