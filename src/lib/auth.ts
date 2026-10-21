import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Papel = "cliente" | "motoboy" | "admin" | "cozinha";

export const rotaDoPapel: Record<Papel, string> = {
  cliente: "/",
  motoboy: "/motoboy",
  admin: "/admin",
  cozinha: "/cozinha",
};

export async function obterPerfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfis")
    .select("id, nome, papel, ativo, codigo_validado")
    .eq("id", user.id)
    .single();

  return data as {
    id: string;
    nome: string;
    papel: Papel;
    ativo: boolean;
    codigo_validado: boolean;
  } | null;
}

export async function exigirPapel(papel: Papel) {
  const perfil = await obterPerfil();
  if (!perfil || !perfil.ativo) redirect("/login");
  if (perfil.papel !== papel) redirect(rotaDoPapel[perfil.papel]);
  if (!perfil.codigo_validado) redirect("/acesso/codigo");
  return perfil;
}