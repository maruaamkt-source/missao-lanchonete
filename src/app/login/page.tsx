"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { entrar, cadastrar } from "./actions";

type Estado = { erro?: string };

const campo =
  "w-full rounded-xl border border-oliva/20 bg-areia px-4 py-3 outline-none focus:border-mostarda";
const botao =
  "w-full rounded-xl bg-mostarda px-6 py-3 font-semibold text-carvao disabled:opacity-60";

export default function LoginPage() {
  const [aba, setAba] = useState<"entrar" | "cadastrar">("entrar");
  const [estadoEntrar, acaoEntrar, pendenteEntrar] = useActionState<
    Estado,
    FormData
  >(entrar, {});
  const [estadoCadastrar, acaoCadastrar, pendenteCadastrar] = useActionState<
    Estado,
    FormData
  >(cadastrar, {});

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <h1 className="font-titulo text-center text-3xl font-bold text-oliva">
          Missão Lanchonete
        </h1>
        <p className="mt-1 text-center text-sm text-carvao/70">
          Entre para pedir mais rápido
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-areia p-1">
          <button
            type="button"
            onClick={() => setAba("entrar")}
            className={`rounded-lg py-2 font-semibold ${
              aba === "entrar" ? "bg-white shadow" : "text-carvao/60"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setAba("cadastrar")}
            className={`rounded-lg py-2 font-semibold ${
              aba === "cadastrar" ? "bg-white shadow" : "text-carvao/60"
            }`}
          >
            Criar conta
          </button>
        </div>

        {aba === "entrar" ? (
          <form action={acaoEntrar} className="mt-6 space-y-4">
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className={campo}
            />
            <input
              name="senha"
              type="password"
              placeholder="Senha"
              required
              className={campo}
            />
            {estadoEntrar.erro && (
              <p className="rounded-lg bg-tijolo/10 px-3 py-2 text-sm text-tijolo">
                {estadoEntrar.erro}
              </p>
            )}
            <button type="submit" disabled={pendenteEntrar} className={botao}>
              {pendenteEntrar ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form action={acaoCadastrar} className="mt-6 space-y-4">
            <input
              name="nome"
              type="text"
              placeholder="Nome"
              required
              className={campo}
            />
            <input
              name="telefone"
              type="tel"
              placeholder="Telefone (opcional)"
              className={campo}
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className={campo}
            />
            <input
              name="senha"
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              required
              minLength={6}
              className={campo}
            />
            {estadoCadastrar.erro && (
              <p className="rounded-lg bg-tijolo/10 px-3 py-2 text-sm text-tijolo">
                {estadoCadastrar.erro}
              </p>
            )}
            <button
              type="submit"
              disabled={pendenteCadastrar}
              className={botao}
            >
              {pendenteCadastrar ? "Criando..." : "Criar conta"}
            </button>
          </form>
        )}

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-oliva underline"
        >
          Só olhar o cardápio
        </Link>
      </div>
    </main>
  );
}