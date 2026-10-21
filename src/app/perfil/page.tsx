import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import BarraInferior from "@/components/cliente/BarraInferior";
import PerfilConteudo from "@/components/cliente/PerfilConteudo";

async function Conteudo() {
  await connection();
  const perfil = await exigirPapel("cliente");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: extra } = await supabase
    .from("perfis")
    .select("telefone")
    .eq("id", perfil.id)
    .single();

  const { data: enderecos } = await supabase
    .from("enderecos")
    .select("*")
    .eq("cliente_id", perfil.id)
    .order("padrao", { ascending: false })
    .order("id");

  return (
    <PerfilConteudo
      nome={perfil.nome ?? ""}
      telefone={extra?.telefone ?? ""}
      email={user?.email ?? ""}
      enderecos={enderecos ?? []}
    />
  );
}

export default function PaginaPerfil() {
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
          <span className="font-titulo text-lg text-oliva">Meu perfil</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-24 pt-20 md:px-6">
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