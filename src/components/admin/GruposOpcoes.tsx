"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  criarGrupo,
  salvarGrupo,
  excluirGrupo,
  type GrupoDados,
} from "@/app/admin/cardapio/opcoes-actions";

type Insumo = { id: string; nome: string; unidade: string };

const campo =
  "w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-carvao";

export default function GruposOpcoes({
  produtoId,
  insumos,
  inicial,
}: {
  produtoId: string;
  insumos: Insumo[];
  inicial: GrupoDados[];
}) {
  const [grupos, setGrupos] = useState<GrupoDados[]>(inicial);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  const mudaGrupo = (gid: string, p: Partial<GrupoDados>) =>
    setGrupos((gs) => gs.map((g) => (g.id === gid ? { ...g, ...p } : g)));

  const mudaOpcao = (
    gid: string,
    oi: number,
    fn: (o: GrupoDados["opcoes"][number]) => GrupoDados["opcoes"][number]
  ) =>
    setGrupos((gs) =>
      gs.map((g) =>
        g.id === gid
          ? { ...g, opcoes: g.opcoes.map((o, i) => (i === oi ? fn(o) : o)) }
          : g
      )
    );

  function novoGrupo() {
    iniciar(async () => {
      const r = await criarGrupo(produtoId, grupos.length);
      if (r.id) {
        setGrupos((gs) => [
          ...gs,
          {
            id: r.id!,
            nome: "Novo grupo",
            obrigatorio: false,
            min_escolhas: 0,
            max_escolhas: 1,
            ordem: gs.length,
            opcoes: [],
          },
        ]);
      }
    });
  }

  function salvar(g: GrupoDados) {
    iniciar(async () => {
      const r = await salvarGrupo(produtoId, g);
      if (r.erro) return setMsg((m) => ({ ...m, [g.id]: r.erro! }));
      setGrupos((gs) =>
        gs.map((x) =>
          x.id === g.id
            ? { ...x, opcoes: x.opcoes.map((o, i) => ({ ...o, id: r.ids![i] })) }
            : x
        )
      );
      setMsg((m) => ({ ...m, [g.id]: "Salvo." }));
    });
  }

  function excluir(g: GrupoDados) {
    if (!confirm(`Excluir o grupo "${g.nome}"?`)) return;
    iniciar(async () => {
      const r = await excluirGrupo(produtoId, g.id);
      if (r.erro) return setMsg((m) => ({ ...m, [g.id]: r.erro! }));
      setGrupos((gs) => gs.filter((x) => x.id !== g.id));
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo text-xl text-oliva">Grupos e opções</h2>
        <button
          onClick={novoGrupo}
          disabled={pendente}
          className="inline-flex items-center gap-1 rounded-lg border border-oliva/30 px-3 py-1 text-sm text-oliva disabled:opacity-50"
        >
          <Plus size={16} /> Grupo
        </button>
      </div>

      {grupos.length === 0 && (
        <p className="text-sm text-carvao/50">Nenhum grupo.</p>
      )}

      {grupos.map((g) => (
        <div key={g.id} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_90px_90px]">
            <div>
              <label className="mb-1 block text-sm text-carvao/70">
                Nome do grupo
              </label>
              <input
                className={campo}
                value={g.nome}
                onChange={(e) => mudaGrupo(g.id, { nome: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-carvao/70">Mín.</label>
              <input
                className={campo}
                inputMode="numeric"
                value={g.min_escolhas}
                onChange={(e) =>
                  mudaGrupo(g.id, { min_escolhas: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-carvao/70">Máx.</label>
              <input
                className={campo}
                inputMode="numeric"
                value={g.max_escolhas}
                onChange={(e) =>
                  mudaGrupo(g.id, { max_escolhas: Number(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-carvao">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={g.obrigatorio}
              onChange={(e) =>
                mudaGrupo(g.id, {
                  obrigatorio: e.target.checked,
                  min_escolhas: e.target.checked
                    ? Math.max(g.min_escolhas, 1)
                    : g.min_escolhas,
                })
              }
            />
            Obrigatório
          </label>

          <div className="space-y-3">
            {g.opcoes.map((o, oi) => (
              <div key={oi} className="space-y-2 rounded-xl bg-areia p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={`${campo} min-w-40 flex-1`}
                    placeholder="Nome da opção"
                    value={o.nome}
                    onChange={(e) =>
                      mudaOpcao(g.id, oi, (x) => ({ ...x, nome: e.target.value }))
                    }
                  />
                  <input
                    className={`${campo} w-28`}
                    inputMode="decimal"
                    placeholder="+ R$"
                    value={o.preco_extra || ""}
                    onChange={(e) =>
                      mudaOpcao(g.id, oi, (x) => ({
                        ...x,
                        preco_extra: Number(e.target.value.replace(",", ".")) || 0,
                      }))
                    }
                  />
                  <label className="flex items-center gap-1 text-sm text-carvao">
                    <input
                      type="checkbox"
                      checked={o.disponivel}
                      onChange={(e) =>
                        mudaOpcao(g.id, oi, (x) => ({
                          ...x,
                          disponivel: e.target.checked,
                        }))
                      }
                    />
                    Disp.
                  </label>
                  <button
                    type="button"
                    aria-label="Remover opção"
                    className="text-tijolo"
                    onClick={() =>
                      mudaGrupo(g.id, {
                        opcoes: g.opcoes.filter((_, i) => i !== oi),
                      })
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {o.insumos.map((l, li) => {
                  const ins = insumos.find((x) => x.id === l.insumo_id);
                  return (
                    <div key={li} className="flex flex-wrap items-center gap-2 pl-3">
                      <select
                        className={`${campo} min-w-40 flex-1`}
                        value={l.insumo_id}
                        onChange={(e) =>
                          mudaOpcao(g.id, oi, (x) => ({
                            ...x,
                            insumos: x.insumos.map((y, i) =>
                              i === li ? { ...y, insumo_id: e.target.value } : y
                            ),
                          }))
                        }
                      >
                        <option value="">Insumo...</option>
                        {insumos.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nome} ({x.unidade})
                          </option>
                        ))}
                      </select>
                      <input
                        className={`${campo} w-24`}
                        inputMode="decimal"
                        placeholder="Qtd"
                        value={l.quantidade || ""}
                        onChange={(e) =>
                          mudaOpcao(g.id, oi, (x) => ({
                            ...x,
                            insumos: x.insumos.map((y, i) =>
                              i === li
                                ? {
                                    ...y,
                                    quantidade:
                                      Number(e.target.value.replace(",", ".")) || 0,
                                  }
                                : y
                            ),
                          }))
                        }
                      />
                      <span className="w-10 text-sm text-carvao/60">
                        {ins?.unidade ?? ""}
                      </span>
                      <button
                        type="button"
                        aria-label="Remover insumo"
                        className="text-tijolo"
                        onClick={() =>
                          mudaOpcao(g.id, oi, (x) => ({
                            ...x,
                            insumos: x.insumos.filter((_, i) => i !== li),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="pl-3 text-sm text-oliva underline"
                  onClick={() =>
                    mudaOpcao(g.id, oi, (x) => ({
                      ...x,
                      insumos: [...x.insumos, { insumo_id: "", quantidade: 0 }],
                    }))
                  }
                >
                  + Insumo consumido
                </button>
              </div>
            ))}

            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-oliva underline"
              onClick={() =>
                mudaGrupo(g.id, {
                  opcoes: [
                    ...g.opcoes,
                    { nome: "", preco_extra: 0, disponivel: true, insumos: [] },
                  ],
                })
              }
            >
              <Plus size={14} /> Opção
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-oliva/10 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => salvar(g)}
                disabled={pendente}
                className="rounded-xl bg-mostarda px-5 py-2 font-semibold text-carvao shadow-sm disabled:opacity-50"
              >
                Salvar grupo
              </button>
              {msg[g.id] && (
                <span
                  className={`text-sm ${
                    msg[g.id] === "Salvo." ? "text-oliva" : "text-tijolo"
                  }`}
                >
                  {msg[g.id]}
                </span>
              )}
            </div>
            <button
              onClick={() => excluir(g)}
              className="text-sm text-tijolo underline"
            >
              Excluir grupo
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}