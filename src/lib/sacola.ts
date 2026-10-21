"use client";

import { useSyncExternalStore } from "react";

type Id = string | number;

export type OpcaoEscolhida = {
  grupoId: Id;
  opcaoId: Id;
  nome: string;
  precoExtra: number;
};

export type ItemSacola = {
  chave: string;
  produtoId: Id;
  nome: string;
  precoBase: number;
  quantidade: number;
  observacao: string;
  opcoes: OpcaoEscolhida[];
};

const CHAVE_STORAGE = "missao-sacola";
const VAZIO: ItemSacola[] = [];

let itens: ItemSacola[] = VAZIO;
let carregado = false;
const ouvintes = new Set<() => void>();

function carregar() {
  if (carregado || typeof window === "undefined") return;
  carregado = true;
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (bruto) itens = JSON.parse(bruto);
  } catch {}
}

function salvar(novos: ItemSacola[]) {
  itens = novos;
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(itens));
  } catch {}
  ouvintes.forEach((f) => f());
}

function assinar(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

export function useSacola() {
  return useSyncExternalStore(
    assinar,
    () => {
      carregar();
      return itens;
    },
    () => VAZIO
  );
}

export function adicionarItem(novo: Omit<ItemSacola, "chave">) {
  carregar();
  const chave = [
    novo.produtoId,
    novo.opcoes
      .map((o) => String(o.opcaoId))
      .sort()
      .join("-"),
    novo.observacao.trim(),
  ].join("|");
  const existente = itens.find((i) => i.chave === chave);
  if (existente) {
    salvar(
      itens.map((i) =>
        i.chave === chave
          ? { ...i, quantidade: i.quantidade + novo.quantidade }
          : i
      )
    );
  } else {
    salvar([...itens, { ...novo, chave }]);
  }
}

export function alterarQuantidade(chave: string, quantidade: number) {
  carregar();
  if (quantidade <= 0) {
    salvar(itens.filter((i) => i.chave !== chave));
    return;
  }
  salvar(itens.map((i) => (i.chave === chave ? { ...i, quantidade } : i)));
}

export function removerItem(chave: string) {
  carregar();
  salvar(itens.filter((i) => i.chave !== chave));
}

export function limparSacola() {
  carregar();
  salvar(VAZIO);
}

export function precoUnitario(item: ItemSacola) {
  return (
    item.precoBase + item.opcoes.reduce((soma, o) => soma + o.precoExtra, 0)
  );
}

export function totalItem(item: ItemSacola) {
  return precoUnitario(item) * item.quantidade;
}

export function subtotalSacola(lista: ItemSacola[]) {
  return lista.reduce((soma, i) => soma + totalItem(i), 0);
}