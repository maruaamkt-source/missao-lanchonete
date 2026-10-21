"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  salvarProduto,
  excluirProduto,
  type DadosProduto,
} from "@/app/admin/cardapio/produto-actions";

type Categoria = { id: string; nome: string };
type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  custo_unitario: number | string;
};
type Inicial = {
  id?: string;
  nome: string;
  categoria_id: string;
  codigo: string;
  descricao: string;
  preco: number;
  disponivel: boolean;
  imagem_url: string | null;
  ficha: { insumo_id: string; quantidade: number }[];
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProdutoForm({
  categorias,
  insumos,
  inicial,
}: {
  categorias: Categoria[];
  insumos: Insumo[];
  inicial: Inicial;
}) {
  const [f, setF] = useState(inicial);
  const [preco, setPreco] = useState(String(inicial.preco || ""));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pendente, iniciar] = useTransition();

  const precoNum = Number(preco.replace(",", ".")) || 0;
  const custo = f.ficha.reduce((soma, l) => {
    const ins = insumos.find((i) => i.id === l.insumo_id);
    return soma + (ins ? Number(ins.custo_unitario) * (l.quantidade || 0) : 0);
  }, 0);
  const lucro = precoNum - custo;
  const margem = precoNum > 0 ? (lucro / precoNum) * 100 : 0;

  async function subirFoto(file: File) {
    setEnviando(true);
    setErro("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const caminho = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("produtos")
      .upload(caminho, file, { contentType: file.type });
    if (error) {
      setErro("Erro no upload: " + error.message);
    } else {
      const { data } = supabase.storage.from("produtos").getPublicUrl(caminho);
      setF((x) => ({ ...x, imagem_url: data.publicUrl }));
    }
    setEnviando(false);
  }

  function mudaLinha(i: number, campo: "insumo_id" | "quantidade", v: string) {
    setF((x) => ({
      ...x,
      ficha: x.ficha.map((l, idx) =>
        idx === i
          ? {
              ...l,
              [campo]: campo === "quantidade" ? Number(v.replace(",", ".")) || 0 : v,
            }
          : l
      ),
    }));
  }

  function salvar() {
    setErro("");
    if (!f.nome.trim()) return setErro("Põe o nome.");
    if (!f.categoria_id) return setErro("Escolhe a categoria.");
    if (precoNum <= 0) return setErro("Põe o preço.");
    iniciar(async () => {
      const dados: DadosProduto = { ...f, preco: precoNum };
      const r = await salvarProduto(dados);
      if (r?.erro) setErro(r.erro);
    });
  }

  const campo =
    "w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-carvao";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-titulo text-2xl text-oliva sm:text-3xl">
          {f.id ? "Editar produto" : "Novo produto"}
        </h1>
        <Link href="/admin/cardapio" className="text-sm text-oliva underline">
          Voltar
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-white shadow-sm">
            {f.imagem_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.imagem_url}
                alt="Foto"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-carvao/40">
                Sem foto
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-oliva px-4 py-2 text-sm font-semibold text-white">
            <Upload size={16} />
            {enviando ? "Enviando..." : "Enviar foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subirFoto(file);
              }}
            />
          </label>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-sm text-carvao/70">Nome</label>
            <input
              className={campo}
              value={f.nome}
              onChange={(e) => setF({ ...f, nome: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-carvao/70">
                Categoria
              </label>
              <select
                className={campo}
                value={f.categoria_id}
                onChange={(e) => setF({ ...f, categoria_id: e.target.value })}
              >
                <option value="">Escolher...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-carvao/70">Código</label>
              <input
                className={campo}
                value={f.codigo}
                onChange={(e) => setF({ ...f, codigo: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-carvao/70">Descrição</label>
            <textarea
              rows={3}
              className={campo}
              value={f.descricao}
              onChange={(e) => setF({ ...f, descricao: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-carvao/70">
                Preço (R$)
              </label>
              <input
                className={campo}
                inputMode="decimal"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-carvao">
              <input
                type="checkbox"
                checked={f.disponivel}
                onChange={(e) => setF({ ...f, disponivel: e.target.checked })}
                className="h-5 w-5"
              />
              Disponível
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-titulo text-xl text-oliva">Ficha técnica</h2>
          <button
            type="button"
            onClick={() =>
              setF({
                ...f,
                ficha: [...f.ficha, { insumo_id: "", quantidade: 0 }],
              })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-oliva/30 px-3 py-1 text-sm text-oliva"
          >
            <Plus size={16} /> Insumo
          </button>
        </div>

        {f.ficha.length === 0 && (
          <p className="text-sm text-carvao/50">Nenhum insumo na ficha.</p>
        )}

        {f.ficha.map((l, i) => {
          const ins = insumos.find((x) => x.id === l.insumo_id);
          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                className={`${campo} min-w-48 flex-1`}
                value={l.insumo_id}
                onChange={(e) => mudaLinha(i, "insumo_id", e.target.value)}
              >
                <option value="">Insumo...</option>
                {insumos.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nome} ({x.unidade})
                  </option>
                ))}
              </select>
              <input
                className={`${campo} w-28`}
                inputMode="decimal"
                placeholder="Qtd"
                value={l.quantidade || ""}
                onChange={(e) => mudaLinha(i, "quantidade", e.target.value)}
              />
              <span className="w-10 text-sm text-carvao/60">
                {ins?.unidade ?? ""}
              </span>
              <button
                type="button"
                onClick={() =>
                  setF({ ...f, ficha: f.ficha.filter((_, idx) => idx !== i) })
                }
                className="text-tijolo"
                aria-label="Remover"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}

        <div className="grid gap-3 border-t border-oliva/10 pt-4 sm:grid-cols-3">
          <div className="rounded-xl bg-areia p-3">
            <p className="text-xs text-carvao/60">Custo</p>
            <p className="font-semibold text-carvao">{brl(custo)}</p>
          </div>
          <div className="rounded-xl bg-areia p-3">
            <p className="text-xs text-carvao/60">Lucro</p>
            <p className="font-semibold text-carvao">{brl(lucro)}</p>
          </div>
          <div className="rounded-xl bg-areia p-3">
            <p className="text-xs text-carvao/60">Margem</p>
            <p
              className={`font-semibold ${
                margem < 30 ? "text-tijolo" : "text-oliva"
              }`}
            >
              {margem.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {erro && <p className="text-sm text-tijolo">{erro}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={salvar}
          disabled={pendente || enviando}
          className="rounded-xl bg-mostarda px-6 py-2.5 font-semibold text-carvao shadow-sm disabled:opacity-50"
        >
          {pendente ? "Salvando..." : "Salvar produto"}
        </button>
        {f.id && (
          <button
            onClick={() => {
              if (!confirm("Excluir esse produto?")) return;
              iniciar(async () => {
                const r = await excluirProduto(f.id!);
                if (r?.erro) setErro(r.erro);
              });
            }}
            className="text-sm text-tijolo underline"
          >
            Excluir produto
          </button>
        )}
      </div>
    </div>
  );
}