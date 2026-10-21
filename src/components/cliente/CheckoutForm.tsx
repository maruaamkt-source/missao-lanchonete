"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { moeda } from "@/lib/formatar";
import { limparSacola, subtotalSacola, totalItem, useSacola } from "@/lib/sacola";
import { criarPedido } from "@/app/checkout/actions";

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

type Pagamento = "pix" | "cartao" | "dinheiro";

const campo =
  "h-12 w-full rounded-xl bg-areia px-4 text-sm outline-none focus:ring-2 focus:ring-oliva/30";

const cartao = "rounded-xl bg-white p-4 shadow-sm md:p-6 flex flex-col gap-3";

const opcaoClasse =
  "flex cursor-pointer items-start gap-3 rounded-xl bg-areia p-3 transition-colors has-[:checked]:bg-oliva has-[:checked]:text-white";

function useMontado() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function CheckoutForm({
  taxaPercentual,
  aberto,
  enderecos,
  telefoneInicial,
}: {
  taxaPercentual: number;
  aberto: boolean;
  enderecos: Endereco[];
  telefoneInicial: string;
}) {
  const router = useRouter();
  const montado = useMontado();
  const itens = useSacola();

  const [enderecoSel, setEnderecoSel] = useState<Id | "novo">(
    enderecos[0]?.id ?? "novo"
  );
  const [novo, setNovo] = useState({
    rotulo: "Casa",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    referencia: "",
  });
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [troco, setTroco] = useState("");
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!montado) {
    return <p className="py-10 text-center text-sm">Carregando...</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-10 text-center shadow-sm">
        <h1 className="font-titulo text-2xl text-oliva">Sacola vazia</h1>
        <Link
          href="/"
          className="rounded-xl bg-mostarda px-6 py-3 font-bold text-carvao"
        >
          Ver cardápio
        </Link>
      </div>
    );
  }

  const subtotal = subtotalSacola(itens);
  const taxaEntrega = Math.round(subtotal * taxaPercentual) / 100;
  const total = subtotal + taxaEntrega;

  async function confirmar() {
    setErro("");
    if (enderecoSel === "novo" && (!novo.rua.trim() || !novo.numero.trim() || !novo.bairro.trim())) {
      setErro("Preencha rua, número e bairro.");
      return;
    }
    if (telefone.trim().length < 8) {
      setErro("Informe um telefone para contato.");
      return;
    }
    setEnviando(true);
    try {
      const resultado = await criarPedido({
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
          observacao: i.observacao,
          opcaoIds: i.opcoes.map((o) => o.opcaoId),
        })),
        enderecoId: enderecoSel === "novo" ? null : enderecoSel,
        novoEndereco: enderecoSel === "novo" ? novo : null,
        formaPagamento: pagamento,
        troco,
        telefone,
      });
      if ("erro" in resultado) {
        setErro(resultado.erro);
        setEnviando(false);
        return;
      }
      limparSacola();
      router.push(`/pedidos/${resultado.pedidoId}`);
    } catch {
      setErro("Algo deu errado. Tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <section className={cartao}>
          <h2 className="font-titulo text-xl text-oliva">Endereço de entrega</h2>
          {enderecos.map((e) => (
            <label key={e.id} className={opcaoClasse}>
              <input
                type="radio"
                name="endereco"
                checked={enderecoSel === e.id}
                onChange={() => setEnderecoSel(e.id)}
                className="mt-1 h-5 w-5 accent-mostarda"
              />
              <span className="flex flex-col">
                <span className="font-bold">
                  {e.rotulo || "Endereço"}
                  {e.padrao && " • Principal"}
                </span>
                <span className="text-sm opacity-90">
                  {e.rua}, {e.numero}
                  {e.complemento ? ` - ${e.complemento}` : ""} - {e.bairro}
                </span>
                {e.referencia && (
                  <span className="text-sm opacity-80">Ref.: {e.referencia}</span>
                )}
              </span>
            </label>
          ))}
          <label className={opcaoClasse}>
            <input
              type="radio"
              name="endereco"
              checked={enderecoSel === "novo"}
              onChange={() => setEnderecoSel("novo")}
              className="mt-1 h-5 w-5 accent-mostarda"
            />
            <span className="font-bold">Novo endereço</span>
          </label>

          {enderecoSel === "novo" && (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className={campo}
                placeholder="Nome do endereço (Casa, Trabalho)"
                value={novo.rotulo}
                onChange={(e) => setNovo({ ...novo, rotulo: e.target.value })}
              />
              <input
                className={campo}
                placeholder="Bairro"
                value={novo.bairro}
                onChange={(e) => setNovo({ ...novo, bairro: e.target.value })}
              />
              <input
                className={campo}
                placeholder="Rua"
                value={novo.rua}
                onChange={(e) => setNovo({ ...novo, rua: e.target.value })}
              />
              <input
                className={campo}
                placeholder="Número"
                value={novo.numero}
                onChange={(e) => setNovo({ ...novo, numero: e.target.value })}
              />
              <input
                className={campo}
                placeholder="Complemento (opcional)"
                value={novo.complemento}
                onChange={(e) => setNovo({ ...novo, complemento: e.target.value })}
              />
              <input
                className={campo}
                placeholder="Ponto de referência (opcional)"
                value={novo.referencia}
                onChange={(e) => setNovo({ ...novo, referencia: e.target.value })}
              />
            </div>
          )}
        </section>

        <section className={cartao}>
          <h2 className="font-titulo text-xl text-oliva">Forma de pagamento</h2>
          <label className={opcaoClasse}>
            <input
              type="radio"
              name="pagamento"
              checked={pagamento === "pix"}
              onChange={() => setPagamento("pix")}
              className="mt-1 h-5 w-5 accent-mostarda"
            />
            <span className="flex flex-col">
              <span className="font-bold">Pix</span>
              <span className="text-sm opacity-90">Pagamento simulado nesta demo</span>
            </span>
          </label>
          <label className={opcaoClasse}>
            <input
              type="radio"
              name="pagamento"
              checked={pagamento === "cartao"}
              onChange={() => setPagamento("cartao")}
              className="mt-1 h-5 w-5 accent-mostarda"
            />
            <span className="flex flex-col">
              <span className="font-bold">Cartão na entrega</span>
              <span className="text-sm opacity-90">Débito ou crédito na maquininha</span>
            </span>
          </label>
          <label className={opcaoClasse}>
            <input
              type="radio"
              name="pagamento"
              checked={pagamento === "dinheiro"}
              onChange={() => setPagamento("dinheiro")}
              className="mt-1 h-5 w-5 accent-mostarda"
            />
            <span className="flex flex-col">
              <span className="font-bold">Dinheiro na entrega</span>
              <span className="text-sm opacity-90">Pagamento direto ao motoboy</span>
            </span>
          </label>
          {pagamento === "dinheiro" && (
            <input
              className={campo}
              placeholder="Troco para quanto? (ex: 100,00) ou deixe vazio"
              value={troco}
              onChange={(e) => setTroco(e.target.value)}
            />
          )}
        </section>

        <section className={cartao}>
          <h2 className="font-titulo text-xl text-oliva">Contato</h2>
          <input
            className={campo}
            type="tel"
            placeholder="Telefone com DDD"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <p className="text-xs text-carvao/60">
            O motoboy usa esse número pra avisar quando chegar.
          </p>
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:p-6 lg:sticky lg:top-20">
        <h2 className="font-titulo text-xl text-oliva">Resumo</h2>
        {itens.map((i) => (
          <div key={i.chave} className="flex justify-between gap-3 text-sm">
            <span>
              {i.quantidade}x {i.nome}
            </span>
            <span className="whitespace-nowrap font-semibold">
              {moeda(totalItem(i))}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-carvao/10 pt-3 text-sm">
          <span className="text-carvao/70">Taxa de entrega</span>
          <span className="font-semibold">{moeda(taxaEntrega)}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="font-bold">Total</span>
          <span className="font-bold text-oliva">{moeda(total)}</span>
        </div>

        {!aberto && (
          <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">
            Estamos fechados no momento. Só dá pra finalizar quando abrirmos.
          </p>
        )}
        {erro && (
          <p className="rounded-lg bg-tijolo/10 p-3 text-sm text-tijolo">{erro}</p>
        )}

        <button
          type="button"
          onClick={confirmar}
          disabled={!aberto || enviando}
          className="flex h-14 items-center justify-center rounded-xl bg-mostarda font-bold text-carvao shadow-sm disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Confirmar pedido"}
        </button>
      </aside>
    </div>
  );
}