import { Suspense } from "react";
import { redirect } from "next/navigation";
import { obterPerfil, rotaDoPapel } from "@/lib/auth";
import CodigoAcesso from "@/components/CodigoAcesso";

async function Conteudo() {
  const perfil = await obterPerfil();
  if (!perfil || !perfil.ativo) redirect("/login");
  if (perfil.codigo_validado) redirect(rotaDoPapel[perfil.papel]);
  return <CodigoAcesso nome={perfil.nome} />;
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <Conteudo />
    </Suspense>
  );
}