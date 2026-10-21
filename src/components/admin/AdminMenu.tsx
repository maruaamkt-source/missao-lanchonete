"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { sair } from "@/app/login/actions";
import { contarPendentes } from "@/app/admin/equipe/actions";

const itens = [
  { href: "/admin", rotulo: "Dashboard", Icone: LayoutDashboard },
  { href: "/admin/pedidos", rotulo: "Pedidos", Icone: ClipboardList },
  { href: "/admin/cardapio", rotulo: "Cardápio", Icone: UtensilsCrossed },
  { href: "/admin/insumos", rotulo: "Insumos", Icone: Boxes },
  { href: "/admin/equipe", rotulo: "Equipe", Icone: Users },
  { href: "/admin/configuracoes", rotulo: "Configurações", Icone: Settings },
];

function Menu() {
  const caminho = usePathname();
  const [pendentes, setPendentes] = useState(0);
  useEffect(() => {
    const buscar = () => contarPendentes().then(setPendentes).catch(() => {});
    buscar();
    const t = setInterval(buscar, 15000);
    return () => clearInterval(t);
  }, [caminho]);
  const ativo = (href: string) =>
    href === "/admin" ? caminho === "/admin" : caminho.startsWith(href);

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col justify-between bg-oliva px-3 py-5 text-white lg:flex">
        <div className="flex flex-col gap-6">
          <div className="px-3">
            <span className="font-titulo text-xl">Missão Lanchonete</span>
            <span className="block text-xs uppercase tracking-wider text-white/60">
              Painel administrativo
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {itens.map(({ href, rotulo, Icone }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  ativo(href)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icone size={20} />
                {rotulo}
                {href === "/admin/equipe" && pendentes > 0 && (
                  <span className="ml-auto rounded-full bg-mostarda px-2 py-0.5 text-xs font-bold text-carvao">
                    {pendentes}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={20} />
            Sair
          </button>
        </form>
      </aside>

      <nav className="sticky top-0 z-50 flex items-center gap-1 overflow-x-auto bg-oliva px-3 py-2 text-white lg:hidden">
        {itens.map(({ href, rotulo, Icone }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
              ativo(href) ? "bg-white/15" : "text-white/70"
            }`}
          >
            <Icone size={18} />
            {rotulo}
            {href === "/admin/equipe" && pendentes > 0 && (
              <span className="rounded-full bg-mostarda px-2 py-0.5 text-xs font-bold text-carvao">
                {pendentes}
              </span>
            )}
          </Link>
        ))}
        <form action={sair} className="ml-auto">
          <button
            type="submit"
            aria-label="Sair"
            className="flex-shrink-0 rounded-lg px-3 py-2 text-white/70"
          >
            <LogOut size={18} />
          </button>
        </form>
      </nav>
    </>
  );
}

export default function AdminMenu() {
  return (
    <Suspense fallback={null}>
      <Menu />
    </Suspense>
  );
}