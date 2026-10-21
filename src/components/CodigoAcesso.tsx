"use client";

import { useActionState } from "react";
import { validarCodigo, sair } from "@/app/login/actions";

type Estado = { erro?: string; ok?: string };

export default function CodigoAcesso({ nome }: { nome: string }) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    validarCodigo,
    {}
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-areia p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <h1 className="font-titulo text-center text-3xl font-bold text-oliva">
          Missão Lanchonete
        </h1>
        <p className="mt-1 text-center text-sm text-carvao/70">
          Olá, {nome}. Digite o seu código de acesso.
        </p>

        <form action={acao} className="mt-6 space-y-4">
          <input
            name="codigo"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            required
            autoFocus
            className="w-full rounded-xl border border-oliva/20 bg-areia px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-mostarda"
          />
          {estado.erro && (
            <p className="rounded-lg bg-tijolo/10 px-3 py-2 text-sm text-tijolo">
              {estado.erro}
            </p>
          )}
          <button
            type="submit"
            disabled={pendente}
            className="w-full rounded-xl bg-mostarda px-6 py-3 font-semibold text-carvao disabled:opacity-60"
          >
            {pendente ? "Validando..." : "Entrar"}
          </button>
        </form>

        <form action={sair} className="mt-4">
          <button
            type="submit"
            className="block w-full text-center text-sm font-semibold text-oliva underline"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}