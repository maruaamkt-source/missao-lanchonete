"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  removerInsumo,
  reporEstoque,
  salvarInsumo,
} from "@/app/admin/insumos/actions";

export type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  estoque: number;
  estoque_minimo: number;
  custo_unitario: number;
};

type Form = {
  id?: string;
  nome: string;
  unidade: string;
  estoque: string;
  estoqueMinimo: string;
  custoUnitario: string;
};

const vazio: Form = {
  nome: "",
  unidade: "un",
  estoque: "",
  estoqueMinimo: "",
  custoUnitario: "",
};

const campo =
  "h-12 w-full rounded-xl bg-areia px-4 text-sm outline-none focus:ring-2 focus:ring-oliva/30";

const numero = (v: string) => Number(v.replace(",", ".")) || 0;

const qtd = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

const dinheiro = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

function situacao(i: Insumo) {
  if (i.estoque <= 0) return { texto: "Zerado", cor: "bg-tijolo/10 text-tijolo" };
  if (i.estoque <= i.estoque_minimo)
    return { texto: "Baixo", cor: "bg-mostarda/40 text-carvao" };
  return { texto: "Ok", cor: "bg-green-100 text-green-800" };
}

export default function InsumosLista({ insumos }: { insumos: Insumo[] }) {
  const [pendente, iniciar] = useTransition();
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState("");
  const [reporId, setReporId] = useState<string | null>(null);
  const [reporQtd, setReporQtd] = useState("");
  const [erroRepor, setErroRepor] = useState("");

  function abrir(i?: Insumo) {
    setErro("");
    setForm(
      i
        ? {
            id: i.id,
            nome: i.nome,
            unidade: i.unidade,
            estoque: String(i.estoque).replace(".", ","),
            estoqueMinimo: String(i.estoque_minimo).replace(".", ","),
            custoUnitario: String(i.custo_unitario).replace(".", ","),
          }
        : vazio
    );
  }

  function guardar() {
    if (!form) return;
    setErro("");
    iniciar(async () => {
      const r = await salvarInsumo({
        id: form.id,
        nome: form.nome,
        unidade: form.unidade,
        estoque: numero(form.estoque),
        estoqueMinimo: numero(form.estoqueMinimo),
        custoUnitario: numero(form.custoUnitario),
      });
      if (r.erro) setErro(r.erro);
      else setForm(null);
    });
  }

  function repor(id: string) {
    setErroRepor("");
    iniciar(async () => {
      const r = await reporEstoque(id, numero(reporQtd));
      if (r.erro) setErroRepor(r.erro);
      else {
        setReporId(null);
        setReporQtd("");
      }
    });
  }

  function remover(i: Insumo) {
    if (!confirm(`Remover "${i.nome}"? Ele sai de todas as fichas.`)) return;
    iniciar(async () => {
      await removerInsumo(i.id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => abrir()}
          className="flex items-center gap-1.5 rounded-lg bg-mostarda px-4 py-2.5 text-sm font-bold text-carvao shadow-sm"
        >
          <Plus size={18} />
          Novo insumo
        </button>
      </div>

      {form && (
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:p-6">
          <h2 className="font-titulo text-xl text-oliva">
            {form.id ? "Editar insumo" : "Novo insumo"}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className={campo}
              placeholder="Nome (ex: Pão brioche, Bacon, Coca lata)"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <input
              className={campo}
              list="unidades"
              placeholder="Unidade (un, g, kg, ml, fatia)"
              value={form.unidade}
              onChange={(e) => setForm({ ...form, unidade: e.target.value })}
            />
            <datalist id="unidades">
              <option value="un" />
              <option value="g" />
              <option value="kg" />
              <option value="ml" />
              <option value="l" />
              <option value="fatia" />
            </datalist>
            <input
              className={campo}
              inputMode="decimal"
              placeholder="Estoque atual"
              value={form.estoque}
              onChange={(e) => setForm({ ...form, estoque: e.target.value })}
            />
            <input
              className={campo}
              inputMode="decimal"
              placeholder="Alerta de estoque mínimo"
              value={form.estoqueMinimo}
              onChange={(e) =>
                setForm({ ...form, estoqueMinimo: e.target.value })
              }
            />
            <input
              className={campo}
              inputMode="decimal"
              placeholder="Custo por unidade (R$)"
              value={form.custoUnitario}
              onChange={(e) =>
                setForm({ ...form, custoUnitario: e.target.value })
              }
            />
          </div>
          {erro && (
            <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
              {erro}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 md:max-w-sm">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="h-12 rounded-xl bg-areia font-bold text-oliva"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={pendente}
              className="h-12 rounded-xl bg-mostarda font-bold text-carvao disabled:opacity-50"
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {insumos.length === 0 ? (
          <p className="p-8 text-center text-sm text-carvao/60">
            Nenhum insumo cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-areia/60 text-xs uppercase tracking-wider text-carvao/60">
                  <th className="px-4 py-3">Insumo</th>
                  <th className="px-4 py-3">Estoque</th>
                  <th className="px-4 py-3">Mínimo</th>
                  <th className="px-4 py-3">Custo unit.</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carvao/10">
                {insumos.map((i) => {
                  const s = situacao(i);
                  return (
                    <tr key={i.id} className="hover:bg-areia/40">
                      <td className="px-4 py-3 font-semibold">{i.nome}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {qtd(i.estoque)} {i.unidade}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold ${s.cor}`}
                          >
                            {s.texto}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-carvao/70">
                        {qtd(i.estoque_minimo)} {i.unidade}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-carvao/70">
                        {dinheiro(i.custo_unitario)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {reporId === i.id ? (
                            <>
                              <input
                                autoFocus
                                inputMode="decimal"
                                placeholder="Qtd"
                                value={reporQtd}
                                onChange={(e) => setReporQtd(e.target.value)}
                                className="h-9 w-20 rounded-lg bg-areia px-2 text-sm outline-none"
                              />
                              <button
                                type="button"
                                disabled={pendente}
                                onClick={() => repor(i.id)}
                                className="h-9 rounded-lg bg-mostarda px-3 text-xs font-bold text-carvao disabled:opacity-50"
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                onClick={() => setReporId(null)}
                                className="h-9 rounded-lg bg-areia px-3 text-xs font-bold text-oliva"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReporId(i.id);
                                setReporQtd("");
                                setErroRepor("");
                              }}
                              className="h-9 rounded-lg bg-oliva/10 px-3 text-xs font-bold text-oliva"
                            >
                              Repor
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Editar"
                            onClick={() => abrir(i)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-oliva hover:bg-areia"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            aria-label="Remover"
                            disabled={pendente}
                            onClick={() => remover(i)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-tijolo hover:bg-tijolo/10 disabled:opacity-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {erroRepor && (
        <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
          {erroRepor}
        </p>
      )}
    </div>
  );
}