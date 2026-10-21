import { Suspense } from "react";
import { redirect } from "next/navigation";
import { obterPerfil, rotaDoPapel } from "@/lib/auth";

async function Redirecionar() {
  const perfil = await obterPerfil();
  if (!perfil) return redirect("/login");
  return redirect(rotaDoPapel[perfil.papel]);
}

export default function Painel() {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <Redirecionar />
    </Suspense>
  );
}