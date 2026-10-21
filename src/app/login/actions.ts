"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Estado = { erro?: string; ok?: string };

export async function entrar(_: Estado, formData: FormData): Promise<Estado> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("senha") ?? ""),
  });

  if (error) return { erro: "E-mail ou senha incorretos." };
  redirect("/painel");
}

export async function cadastrar(
  _: Estado,
  formData: FormData
): Promise<Estado> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (nome.length < 2) return { erro: "Digite seu nome." };
  if (senha.length < 6)
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) {
    return {
      erro: error.message.toLowerCase().includes("already")
        ? "Este e-mail já tem conta."
        : "Não foi possível criar a conta. Confira os dados.",
    };
  }

  if (data.user && telefone) {
    await supabase.from("perfis").update({ telefone }).eq("id", data.user.id);
  }

  redirect("/painel");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
export async function entrarPapel(
  _: Estado,
  formData: FormData
): Promise<Estado> {
  const papel = String(formData.get("papel") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("senha") ?? ""),
  });

  if (error || !data.user) return { erro: "E-mail ou senha incorretos." };

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel, ativo, cargo_pedido")
    .eq("id", data.user.id)
    .single();

  if (perfil?.papel === "cliente" && perfil.cargo_pedido === papel) {
    await supabase.auth.signOut();
    return { erro: "Sua conta ainda não foi aprovada pelo administrador." };
  }

  if (!perfil || !perfil.ativo || perfil.papel !== papel) {
    await supabase.auth.signOut();
    return { erro: "Esta conta não tem acesso a esta área." };
  }

  redirect("/painel");
}

export async function cadastrarPapel(
  _: Estado,
  formData: FormData
): Promise<Estado> {
  const papel = String(formData.get("papel") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (papel !== "motoboy" && papel !== "cozinha")
    return { erro: "Cargo inválido." };
  if (nome.length < 2) return { erro: "Digite seu nome." };
  if (senha.length < 6)
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, papel } },
  });

  if (error || !data.user) {
    return {
      erro: error?.message.toLowerCase().includes("already")
        ? "Este e-mail já tem conta."
        : "Não foi possível criar a conta. Confira os dados.",
    };
  }

  if (telefone) {
    await supabase.from("perfis").update({ telefone }).eq("id", data.user.id);
  }

  await supabase.auth.signOut();
  return {
    ok: "Conta criada! Agora espere o administrador aprovar e te passar o seu código.",
  };
}

export async function validarCodigo(
  _: Estado,
  formData: FormData
): Promise<Estado> {
  const codigo = String(formData.get("codigo") ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { erro: "O código tem 6 números." };

  const supabase = await createClient();
  const { data } = await supabase.rpc("validar_codigo", { p_codigo: codigo });

  if (data === "ok") redirect("/painel");
  if (data === "bloqueado")
    return { erro: "Muitas tentativas. Peça um novo código ao administrador." };
  if (data === "errado") return { erro: "Código incorreto." };
  return { erro: "Não foi possível validar. Entre de novo." };
}