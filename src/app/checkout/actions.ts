"use server";

import { createClient } from "@/lib/supabase/server";
import { statusRestaurante } from "@/lib/horario";

type Id = string | number;

type ItemEntrada = {
  produtoId: Id;
  quantidade: number;
  observacao: string;
  opcaoIds: Id[];
};

type NovoEndereco = {
  rotulo: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  referencia: string;
};

export type EntradaPedido = {
  itens: ItemEntrada[];
  enderecoId: Id | null;
  novoEndereco: NovoEndereco | null;
  formaPagamento: "pix" | "cartao" | "dinheiro";
  troco: string;
  telefone: string;
};

export type ResultadoPedido = { erro: string } | { pedidoId: Id };

type OpcaoDb = {
  id: Id;
  nome: string;
  preco_extra: number | string;
  disponivel: boolean;
  grupos_opcao: { produto_id: Id } | { produto_id: Id }[] | null;
};

const arred = (n: number) => Math.round(n * 100) / 100;

export async function criarPedido(
  entrada: EntradaPedido
): Promise<ResultadoPedido> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Você precisa entrar na conta para pedir." };

  if (!Array.isArray(entrada.itens) || entrada.itens.length === 0) {
    return { erro: "Sua sacola está vazia." };
  }
  for (const i of entrada.itens) {
    if (!Number.isInteger(i.quantidade) || i.quantidade < 1 || i.quantidade > 99) {
      return { erro: "Quantidade inválida em um dos itens." };
    }
  }
  if (!["pix", "cartao", "dinheiro"].includes(entrada.formaPagamento)) {
    return { erro: "Escolha a forma de pagamento." };
  }
  const telefone = (entrada.telefone ?? "").trim();
  if (telefone.length < 8) return { erro: "Informe um telefone para contato." };

  const { data: restaurante } = await supabase
    .from("restaurante")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (!restaurante) return { erro: "Restaurante não configurado." };
  if (!statusRestaurante(restaurante).aberto) {
    return { erro: "O restaurante está fechado no momento." };
  }

  const produtoIds = [...new Set(entrada.itens.map((i) => i.produtoId))];
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, preco, disponivel")
    .in("id", produtoIds);
  const mapaProdutos = new Map(
    (produtos ?? []).map((p) => [String(p.id), p])
  );

  const opcaoIds = [...new Set(entrada.itens.flatMap((i) => i.opcaoIds))];
  const mapaOpcoes = new Map<string, OpcaoDb>();
  if (opcaoIds.length > 0) {
    const { data: opcoes } = await supabase
      .from("opcoes")
      .select("id, nome, preco_extra, disponivel, grupos_opcao(produto_id)")
      .in("id", opcaoIds);
    for (const o of (opcoes ?? []) as unknown as OpcaoDb[]) {
      mapaOpcoes.set(String(o.id), o);
    }
  }

  type GrupoDb = {
    id: Id;
    produto_id: Id;
    nome: string;
    obrigatorio: boolean;
    min_escolhas: number | null;
    max_escolhas: number | null;
    opcoes: { id: Id; disponivel: boolean }[] | null;
  };
  const { data: gruposDb } = await supabase
    .from("grupos_opcao")
    .select(
      "id, produto_id, nome, obrigatorio, min_escolhas, max_escolhas, opcoes(id, disponivel)"
    )
    .in("produto_id", produtoIds);
  const gruposPorProduto = new Map<string, GrupoDb[]>();
  for (const g of (gruposDb ?? []) as unknown as GrupoDb[]) {
    const k = String(g.produto_id);
    gruposPorProduto.set(k, [...(gruposPorProduto.get(k) ?? []), g]);
  }

  let subtotal = 0;
  const linhas: {
    produtoId: Id;
    nome: string;
    unitario: number;
    quantidade: number;
    observacao: string;
    opcoes: { nome: string; preco_extra: number }[];
  }[] = [];

  for (const item of entrada.itens) {
    const produto = mapaProdutos.get(String(item.produtoId));
    if (!produto || !produto.disponivel) {
      return { erro: "Um dos itens não está mais disponível. Revise a sacola." };
    }
    const opcoes: { nome: string; preco_extra: number }[] = [];
    for (const oid of item.opcaoIds) {
      const o = mapaOpcoes.get(String(oid));
      const g = Array.isArray(o?.grupos_opcao)
        ? o?.grupos_opcao[0]
        : o?.grupos_opcao;
      if (!o || !o.disponivel || String(g?.produto_id) !== String(item.produtoId)) {
        return { erro: "Uma das opções não está mais disponível. Revise a sacola." };
      }
      opcoes.push({ nome: o.nome, preco_extra: Number(o.preco_extra) });
    }
    const escolhidas = new Set(item.opcaoIds.map(String));
    for (const g of gruposPorProduto.get(String(item.produtoId)) ?? []) {
      const idsGrupo = (g.opcoes ?? []).map((x) => String(x.id));
      const disponiveis = (g.opcoes ?? []).filter((x) => x.disponivel).length;
      if (disponiveis === 0) continue;
      const qtd = idsGrupo.filter((x) => escolhidas.has(x)).length;
      const min = g.obrigatorio
        ? Math.max(g.min_escolhas ?? 1, 1)
        : (g.min_escolhas ?? 0);
      if (qtd < min) {
        return { erro: `Escolha as opções de "${g.nome}" em ${produto.nome}.` };
      }
      if (g.max_escolhas && qtd > g.max_escolhas) {
        return {
          erro: `Máximo de ${g.max_escolhas} em "${g.nome}" (${produto.nome}).`,
        };
      }
    }
    const unitario = Number(produto.preco);
    const extras = opcoes.reduce((s, o) => s + o.preco_extra, 0);
    subtotal += (unitario + extras) * item.quantidade;
    linhas.push({
      produtoId: item.produtoId,
      nome: produto.nome,
      unitario,
      quantidade: item.quantidade,
      observacao: (item.observacao ?? "").trim().slice(0, 300),
      opcoes,
    });
  }

  let enderecoTexto = "";
  const montar = (e: {
    rua: string;
    numero: string;
    bairro: string;
    complemento?: string | null;
    referencia?: string | null;
  }) =>
    `${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""} - ${e.bairro}${
      e.referencia ? ` (Ref.: ${e.referencia})` : ""
    }`;

  if (entrada.enderecoId) {
    const { data: end } = await supabase
      .from("enderecos")
      .select("rua, numero, bairro, complemento, referencia")
      .eq("id", entrada.enderecoId)
      .eq("cliente_id", user.id)
      .maybeSingle();
    if (!end) return { erro: "Endereço não encontrado." };
    enderecoTexto = montar(end);
  } else if (entrada.novoEndereco) {
    const n = entrada.novoEndereco;
    const rua = n.rua.trim();
    const numero = n.numero.trim();
    const bairro = n.bairro.trim();
    if (!rua || !numero || !bairro) {
      return { erro: "Preencha rua, número e bairro." };
    }
    const { count } = await supabase
      .from("enderecos")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", user.id);
    const { error: erroEnd } = await supabase.from("enderecos").insert({
      cliente_id: user.id,
      rotulo: n.rotulo.trim() || "Casa",
      rua,
      numero,
      bairro,
      complemento: n.complemento.trim() || null,
      referencia: n.referencia.trim() || null,
      padrao: (count ?? 0) === 0,
    });
    if (erroEnd) return { erro: `Não consegui salvar o endereço: ${erroEnd.message}` };
    enderecoTexto = montar({
      rua,
      numero,
      bairro,
      complemento: n.complemento.trim(),
      referencia: n.referencia.trim(),
    });
  } else {
    return { erro: "Escolha ou cadastre um endereço de entrega." };
  }

  const taxa = arred(
    (subtotal * Number(restaurante.taxa_percentual ?? 0)) / 100
  );
  const total = arred(subtotal + taxa);

  const partesObs = [`Contato: ${telefone}`];
  if (entrada.formaPagamento === "dinheiro" && entrada.troco.trim()) {
    partesObs.push(`Troco para R$ ${entrada.troco.trim()}`);
  }

  const { data: pedido, error: erroPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: user.id,
      endereco_entrega: enderecoTexto,
      status: "novo",
      forma_pagamento: entrada.formaPagamento,
      subtotal: arred(subtotal),
      taxa_entrega: taxa,
      total,
      observacao: partesObs.join(" | "),
    })
    .select("id")
    .single();
  if (erroPedido || !pedido) {
    return { erro: `Não consegui criar o pedido: ${erroPedido?.message ?? "erro"}` };
  }

  const { data: itensCriados, error: erroItens } = await supabase
    .from("itens_pedido")
    .insert(
      linhas.map((l) => ({
        pedido_id: pedido.id,
        produto_id: l.produtoId,
        nome_produto: l.nome,
        preco_unitario: l.unitario,
        quantidade: l.quantidade,
        observacao: l.observacao || null,
      }))
    )
    .select("id");
  if (erroItens || !itensCriados) {
    return { erro: `Não consegui salvar os itens: ${erroItens?.message ?? "erro"}` };
  }

  const opcoesInsert = linhas.flatMap((l, idx) =>
    l.opcoes.map((o) => ({
      item_id: itensCriados[idx].id,
      nome_opcao: o.nome,
      preco_extra: o.preco_extra,
    }))
  );
  if (opcoesInsert.length > 0) {
    const { error: erroOpcoes } = await supabase
      .from("itens_pedido_opcoes")
      .insert(opcoesInsert);
    if (erroOpcoes) {
      return { erro: `Não consegui salvar as opções: ${erroOpcoes.message}` };
    }
  }

  await supabase.from("perfis").update({ telefone }).eq("id", user.id);

  return { pedidoId: pedido.id };
}