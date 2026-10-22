import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { moeda } from "@/lib/formatar";
import AtualizarAuto from "@/components/admin/AtualizarAuto";
import GraficoFaturamento from "@/components/admin/GraficoFaturamento";
import FiltroPeriodo from "@/components/admin/FiltroPeriodo";
import GraficoPico from "@/components/admin/GraficoPico";
type Pedido = {
  id: string | number;
  status: string;
  total: number | string;
  cliente_id: string;
  motoboy_id: string | null;
  forma_pagamento: string;
  endereco_entrega: string | null;
  criado_em?: string | null;
  created_at?: string | null;
  itens_pedido:
    | { nome_produto: string; quantidade: number; preco_unitario: number | string }[]
    | null;
};

type Perfil = {
  id: string;
  nome: string | null;
  papel: string;
  ativo: boolean;
};

const fuso = "America/Sao_Paulo";

const rotulos: Record<string, string> = {
  novo: "Novo",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_para_entrega: "Em rota",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const coresStatus: Record<string, string> = {
  novo: "bg-mostarda text-carvao",
  em_preparo: "bg-mostarda/40 text-carvao",
  pronto: "bg-oliva/15 text-oliva",
  saiu_para_entrega: "bg-oliva text-white",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-tijolo/10 text-tijolo",
};

const pagamentos: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

function dataDe(p: Pedido) {
  return p.criado_em ?? p.created_at ?? null;
}

function dia(valor: string | number | null | undefined) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(
    new Date(valor)
  );
}

function somarDias(d: string, n: number) {
  const x = new Date(d + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

function diasEntre(a: string, b: string) {
  return Math.round(
    (new Date(b + "T12:00:00Z").getTime() -
      new Date(a + "T12:00:00Z").getTime()) /
      86400000
  );
}

function horaNum(valor: string | null) {
  if (!valor) return -1;
  const h = new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date(valor));
  return parseInt(h, 10);
}

function hora(valor: string | null) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function Metrica({
  titulo,
  valor,
  rodape,
}: {
  titulo: string;
  valor: string;
  rodape: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-carvao/60">
          {titulo}
        </span>
        <span className="font-titulo text-4xl text-oliva">{valor}</span>
      </div>
      <span className="text-sm text-carvao/60">{rodape}</span>
    </div>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: dadosPedidos }, { data: dadosPerfis }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, itens_pedido(nome_produto, quantidade, preco_unitario)"),
    supabase.from("perfis").select("id, nome, papel, ativo"),
  ]);

  const pedidos = (dadosPedidos ?? []) as unknown as Pedido[];
  const perfis = (dadosPerfis ?? []) as Perfil[];
  const nomes = new Map(perfis.map((p) => [p.id, p.nome ?? ""]));

  const agora = Date.now();
  const hoje = dia(agora);

  const ehData = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const periodo = sp.periodo ?? "7d";
  let de = somarDias(hoje, -6);
  let ate = hoje;
  if (periodo === "hoje") de = hoje;
  else if (periodo === "30d") de = somarDias(hoje, -29);
  else if (periodo === "6m") de = somarDias(hoje, -182);
  else if (periodo === "custom" && ehData(sp.de)) {
    de = sp.de!;
    ate = ehData(sp.ate) ? sp.ate! : de;
    if (ate < de) [de, ate] = [ate, de];
  }

  const totalDias = diasEntre(de, ate) + 1;
  const deAnt = somarDias(de, -totalDias);
  const ateAnt = somarDias(de, -1);

  const entre = (p: Pedido, a: string, b: string) => {
    const d = dia(dataDe(p));
    return d >= a && d <= b;
  };

  const doPeriodo = pedidos.filter((p) => entre(p, de, ate));
  const validos = doPeriodo.filter((p) => p.status !== "cancelado");
  const validosAnt = pedidos.filter(
    (p) => entre(p, deAnt, ateAnt) && p.status !== "cancelado"
  );
  const faturamento = validos.reduce((s, p) => s + Number(p.total), 0);
  const ticket = validos.length ? faturamento / validos.length : 0;
  const entregues = validos.filter((p) => p.status === "entregue").length;
  const cancelados = doPeriodo.length - validos.length;

  const fmt = (d: string) =>
    `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  const rotulo = de === ate ? fmt(de) : `${fmt(de)} a ${fmt(ate)}`;

  const ativos = pedidos.filter(
    (p) => p.status !== "entregue" && p.status !== "cancelado"
  );
  const qtd = (s: string) => ativos.filter((p) => p.status === s).length;

  const recentes = [...pedidos]
    .sort(
      (a, b) =>
        new Date(dataDe(b) ?? 0).getTime() - new Date(dataDe(a) ?? 0).getTime()
    )
    .slice(0, 6);

  const vendas = new Map<string, { un: number; valor: number }>();
  for (const p of pedidos) {
    if (p.status === "cancelado" || !entre(p, de, ate)) continue;
    for (const i of p.itens_pedido ?? []) {
      const atual = vendas.get(i.nome_produto) ?? { un: 0, valor: 0 };
      atual.un += i.quantidade;
      atual.valor += i.quantidade * Number(i.preco_unitario);
      vendas.set(i.nome_produto, atual);
    }
  }
  const top = [...vendas.entries()].sort((a, b) => b[1].un - a[1].un).slice(0, 4);
  const maior = top[0]?.[1].un ?? 1;

  const porHora = Array.from({ length: 24 }, (_, h) => ({
    hora: `${h}h`,
    pedidos: 0,
  }));
  for (const p of validos) {
    const h = horaNum(dataDe(p));
    if (h >= 0 && h < 24) porHora[h].pedidos += 1;
  }
  const horaPico = porHora.reduce((a, b) => (b.pedidos > a.pedidos ? b : a));

  const porMes = totalDias > 31;
  const chave = (d: string) => (porMes ? d.slice(0, 7) : d);
  const mapa = new Map<string, { fat: number; n: number }>();
  for (let i = 0; i < totalDias; i++) {
    const k = chave(somarDias(de, i));
    if (!mapa.has(k)) mapa.set(k, { fat: 0, n: 0 });
  }
  for (const p of validos) {
    const a = mapa.get(chave(dia(dataDe(p))));
    if (a) {
      a.fat += Number(p.total);
      a.n += 1;
    }
  }
  const serie = [...mapa.entries()].map(([k, a]) => ({
    dia: porMes
      ? k.slice(5, 7) + "/" + k.slice(2, 4)
      : k.slice(8, 10) + "/" + k.slice(5, 7),
    faturamento: Math.round(a.fat * 100) / 100,
    pedidos: a.n,
    ticket: a.n ? Math.round((a.fat / a.n) * 100) / 100 : 0,
  }));

  const motoboys = perfis.filter((p) => p.papel === "motoboy" && p.ativo);
  const emRota = new Map<string, Pedido>();
  for (const p of ativos) {
    if (p.status === "saiu_para_entrega" && p.motoboy_id) {
      emRota.set(p.motoboy_id, p);
    }
  }
  const aguardando = ativos.filter(
    (p) => p.status === "pronto" && !p.motoboy_id
  ).length;

  const dataExtenso = new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    dateStyle: "full",
  }).format(agora);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
        <span className="text-sm text-carvao/60 first-letter:uppercase">
  {dataExtenso}
</span>
          <h1 className="font-titulo text-3xl text-oliva">Visão geral</h1>
        </div>
        <AtualizarAuto />
      </div>

      <FiltroPeriodo periodo={periodo} de={de} ate={ate} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          titulo="Pedidos"
          valor={String(validos.length)}
          rodape={`Período anterior: ${validosAnt.length}`}
        />
        <Metrica
          titulo="Faturamento"
          valor={moeda(faturamento)}
          rodape={`Ticket médio: ${moeda(ticket)}`}
        />
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-carvao/60">
              Em andamento
            </span>
            <span className="font-titulo text-4xl text-oliva">
              {ativos.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            <span className="rounded bg-mostarda px-2 py-0.5">
              {qtd("novo")} novos
            </span>
            <span className="rounded bg-mostarda/40 px-2 py-0.5">
              {qtd("em_preparo")} em preparo
            </span>
            <span className="rounded bg-oliva/15 px-2 py-0.5 text-oliva">
              {qtd("pronto")} prontos
            </span>
            <span className="rounded bg-oliva px-2 py-0.5 text-white">
              {qtd("saiu_para_entrega")} em rota
            </span>
          </div>
        </div>
        <Metrica
          titulo="Entregues"
          valor={String(entregues)}
          rodape={`Cancelados: ${cancelados}`}
        />
      </div>

      <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-titulo text-xl text-oliva">
            Faturamento {porMes ? "por mês" : "por dia"}
          </h2>
          <span className="text-xs font-bold uppercase text-carvao/60">
            {rotulo}
          </span>
        </div>
        <GraficoFaturamento dados={serie} />
      </section>

      <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-titulo text-xl text-oliva">Horário de pico</h2>
          <span className="text-xs font-bold uppercase text-carvao/60">
            {horaPico.pedidos > 0
              ? `Pico: ${horaPico.hora} (${horaPico.pedidos} pedidos) · ${rotulo}`
              : `Sem pedidos · ${rotulo}`}
          </span>
        </div>
        <GraficoPico dados={porHora} />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between bg-areia/60 p-4">
            <h2 className="font-titulo text-xl text-oliva">Últimos pedidos</h2>
            <Link
              href="/admin/pedidos"
              className="flex items-center gap-1 text-sm font-bold text-oliva hover:underline"
            >
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>
          {recentes.length === 0 ? (
            <p className="p-8 text-center text-sm text-carvao/60">
              Nenhum pedido ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-carvao/60">
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Itens</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Motoboy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carvao/10">
                  {recentes.map((p) => (
                    <tr key={p.id} className="hover:bg-areia/40">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">
                            #{String(p.id).slice(0, 6).toUpperCase()}
                          </span>
                          <span className="text-xs text-carvao/60">
                            {hora(dataDe(p))}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-[180px] flex-col">
                          <span className="truncate font-semibold">
                            {nomes.get(p.cliente_id) || "Cliente"}
                          </span>
                          <span className="truncate text-xs text-carvao/60">
                            {p.endereco_entrega}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <span className="line-clamp-2">
                          {(p.itens_pedido ?? [])
                            .map((i) => `${i.quantidade}x ${i.nome_produto}`)
                            .join(", ")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">{moeda(Number(p.total))}</span>
                          <span className="text-xs text-carvao/60">
                            {pagamentos[p.forma_pagamento] ?? p.forma_pagamento}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded px-2.5 py-1 text-xs font-bold ${
                            coresStatus[p.status] ?? "bg-areia"
                          }`}
                        >
                          {rotulos[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {p.motoboy_id ? (
                          nomes.get(p.motoboy_id) || "Motoboy"
                        ) : (
                          <span className="text-carvao/50">Sem motoboy</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-titulo text-xl text-oliva">Mais vendidos</h2>
              <span className="text-xs font-bold uppercase text-carvao/60">
                {rotulo}
              </span>
            </div>
            {top.length === 0 && (
              <p className="text-sm text-carvao/60">Sem vendas no período.</p>
            )}
            {top.map(([nome, v], i) => (
              <div key={nome} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {i + 1}º {nome}
                  </span>
                  <span className="whitespace-nowrap text-sm font-bold text-oliva">
                    {v.un} un
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-areia">
                  <div
                    className="h-full rounded-full bg-oliva"
                    style={{ width: `${(v.un / maior) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-carvao/60">
                  {moeda(v.valor)} faturados
                </span>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-titulo text-xl text-oliva">Motoboys</h2>
              <span className="rounded bg-oliva px-2 py-0.5 text-xs font-bold text-white">
                {motoboys.length} ativos
              </span>
            </div>
            <div className="grid grid-cols-3 rounded-lg bg-areia p-2 text-center">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-oliva">
                  {emRota.size}
                </span>
                <span className="text-[10px] font-bold uppercase text-carvao/60">
                  Em rota
                </span>
              </div>
              <div className="flex flex-col border-x border-carvao/10">
                <span className="text-xl font-bold">
                  {Math.max(motoboys.length - emRota.size, 0)}
                </span>
                <span className="text-[10px] font-bold uppercase text-carvao/60">
                  Livres
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-tijolo">
                  {aguardando}
                </span>
                <span className="text-[10px] font-bold uppercase text-carvao/60">
                  Aguardando
                </span>
              </div>
            </div>
            {motoboys.length === 0 && (
              <p className="text-sm text-carvao/60">Nenhum motoboy ativo.</p>
            )}
            {motoboys.map((m) => {
              const pedido = emRota.get(m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-areia px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">
                      {m.nome}
                    </span>
                    <span className="text-xs text-carvao/60">
                      {pedido
                        ? `Pedido #${String(pedido.id).slice(0, 6).toUpperCase()}`
                        : "Sem entrega"}
                    </span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      pedido
                        ? "bg-oliva text-white"
                        : "bg-mostarda/40 text-carvao"
                    }`}
                  >
                    {pedido ? "Em rota" : "Livre"}
                  </span>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <main className="p-4 md:p-8">
      <Suspense
        fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
      >
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}