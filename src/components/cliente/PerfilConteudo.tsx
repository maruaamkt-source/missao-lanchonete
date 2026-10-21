"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ChevronRight,
  MapPin,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import BotaoSair from "@/components/BotaoSair";
import {
  definirPrincipal,
  removerEndereco,
  salvarEndereco,
  salvarPerfil,
} from "@/app/perfil/actions";

type Id = string | number;

type Endereco = {
  id: Id;
  rotulo: string | null;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  referencia: string | null;
  padrao: boolean;
};

type FormEndereco = {
  id?: Id;
  rotulo: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  referencia: string;
};

const vazio: FormEndereco = {
  rotulo: "Casa",
  rua: "",
  numero: "",
  bairro: "",
  complemento: "",
  referencia: "",
};

const campo =
  "h-12 w-full rounded-xl bg-areia px-4 text-sm outline-none focus:ring-2 focus:ring-oliva/30";

const cartao = "flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm";

export default function PerfilConteudo({
  nome,
  telefone,
  email,
  enderecos,
}: {
  nome: string;
  telefone: string;
  email: string;
  enderecos: Endereco[];
}) {
  const [pendente, iniciar] = useTransition();

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [dados, setDados] = useState({ nome, telefone });
  const [erroPerfil, setErroPerfil] = useState("");

  const [form, setForm] = useState<FormEndereco | null>(null);
  const [erroEnd, setErroEnd] = useState("");

  const iniciais =
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";

  function abrirPerfil() {
    setDados({ nome, telefone });
    setErroPerfil("");
    setEditandoPerfil(true);
  }

  function guardarPerfil() {
    setErroPerfil("");
    iniciar(async () => {
      const r = await salvarPerfil(dados);
      if (r.erro) setErroPerfil(r.erro);
      else setEditandoPerfil(false);
    });
  }

  function abrirEndereco(e?: Endereco) {
    setErroEnd("");
    setForm(
      e
        ? {
            id: e.id,
            rotulo: e.rotulo ?? "",
            rua: e.rua,
            numero: e.numero,
            bairro: e.bairro,
            complemento: e.complemento ?? "",
            referencia: e.referencia ?? "",
          }
        : vazio
    );
  }

  function guardarEndereco() {
    if (!form) return;
    setErroEnd("");
    iniciar(async () => {
      const r = await salvarEndereco(form);
      if (r.erro) setErroEnd(r.erro);
      else setForm(null);
    });
  }

  function tornarPrincipal(id: Id) {
    iniciar(async () => {
      await definirPrincipal(id);
    });
  }

  function remover(id: Id) {
    if (!confirm("Remover este endereço?")) return;
    iniciar(async () => {
      await removerEndereco(id);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className={cartao}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-oliva font-titulo text-xl text-mostarda">
              {iniciais}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-bold">{nome}</span>
              <span className="text-sm text-carvao/70">
                {telefone || "Sem telefone"}
              </span>
              <span className="truncate text-sm text-carvao/70">{email}</span>
            </div>
          </div>
          {!editandoPerfil && (
            <button
              type="button"
              aria-label="Editar dados"
              onClick={abrirPerfil}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-oliva hover:bg-areia"
            >
              <Pencil size={20} />
            </button>
          )}
        </div>

        {editandoPerfil && (
          <div className="flex flex-col gap-3">
            <input
              className={campo}
              placeholder="Nome"
              value={dados.nome}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
            />
            <input
              className={campo}
              type="tel"
              placeholder="Telefone com DDD"
              value={dados.telefone}
              onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
            />
            {erroPerfil && (
              <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
                {erroPerfil}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditandoPerfil(false)}
                className="h-12 rounded-xl bg-areia font-bold text-oliva"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarPerfil}
                disabled={pendente}
                className="h-12 rounded-xl bg-mostarda font-bold text-carvao disabled:opacity-50"
              >
                {pendente ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-titulo text-xl text-oliva">Meus endereços</h2>
          <button
            type="button"
            onClick={() => abrirEndereco()}
            className="flex items-center gap-1 rounded-lg bg-mostarda px-3 py-2 text-sm font-bold text-carvao shadow-sm"
          >
            <Plus size={18} />
            Novo
          </button>
        </div>

        {form && (
          <div className={cartao}>
            <h3 className="font-bold text-oliva">
              {form.id ? "Editar endereço" : "Novo endereço"}
            </h3>
            <input
              className={campo}
              placeholder="Nome do endereço (Casa, Trabalho)"
              value={form.rotulo}
              onChange={(e) => setForm({ ...form, rotulo: e.target.value })}
            />
            <input
              className={campo}
              placeholder="Rua"
              value={form.rua}
              onChange={(e) => setForm({ ...form, rua: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={campo}
                placeholder="Número"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
              <input
                className={campo}
                placeholder="Bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              />
            </div>
            <input
              className={campo}
              placeholder="Complemento (opcional)"
              value={form.complemento}
              onChange={(e) =>
                setForm({ ...form, complemento: e.target.value })
              }
            />
            <input
              className={campo}
              placeholder="Ponto de referência (opcional)"
              value={form.referencia}
              onChange={(e) =>
                setForm({ ...form, referencia: e.target.value })
              }
            />
            {erroEnd && (
              <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
                {erroEnd}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-12 rounded-xl bg-areia font-bold text-oliva"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEndereco}
                disabled={pendente}
                className="h-12 rounded-xl bg-mostarda font-bold text-carvao disabled:opacity-50"
              >
                {pendente ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {enderecos.length === 0 && !form && (
          <div className={`${cartao} items-center py-8 text-center`}>
            <MapPin size={40} className="text-oliva/40" />
            <p className="text-sm text-carvao/70">
              Você ainda não tem endereços salvos.
            </p>
          </div>
        )}

        {enderecos.map((e) => (
          <div key={e.id} className={cartao}>
            <div className="flex items-center justify-between">
              {e.padrao ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-oliva px-2.5 py-0.5 text-xs font-bold uppercase text-white">
                  <Star size={12} fill="currentColor" />
                  Principal
                </span>
              ) : (
                <span className="rounded-full bg-areia px-2.5 py-0.5 text-xs font-bold uppercase text-carvao/70">
                  Secundário
                </span>
              )}
              <span className="text-sm font-bold text-oliva">
                {e.rotulo || "Endereço"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold">
                {e.rua}, {e.numero}
              </span>
              {e.complemento && (
                <span className="text-sm">{e.complemento}</span>
              )}
              <span className="text-sm text-carvao/70">{e.bairro}</span>
              {e.referencia && (
                <span className="mt-2 rounded-lg bg-areia px-3 py-1.5 text-sm text-carvao/70">
                  Ref.: {e.referencia}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => abrirEndereco(e)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-areia text-sm font-bold text-oliva"
              >
                <Pencil size={16} />
                Alterar
              </button>
              <button
                type="button"
                onClick={() => remover(e.id)}
                disabled={pendente}
                className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-tijolo/10 text-sm font-bold text-tijolo disabled:opacity-50"
              >
                <Trash2 size={16} />
                Remover
              </button>
            </div>
            {!e.padrao && (
              <button
                type="button"
                onClick={() => tornarPrincipal(e.id)}
                disabled={pendente}
                className="h-11 rounded-lg bg-areia text-sm font-bold text-oliva disabled:opacity-50"
              >
                Definir como principal
              </button>
            )}
          </div>
        ))}
      </section>

      <Link
        href="/pedidos"
        className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-areia text-oliva">
            <Package size={22} />
          </span>
          <span className="font-bold">Meus pedidos</span>
        </span>
        <ChevronRight size={20} className="text-carvao/40" />
      </Link>

      <BotaoSair />
    </div>
  );
}