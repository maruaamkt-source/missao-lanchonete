"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ShoppingBag, Package, User } from "lucide-react";
import { useSacola } from "@/lib/sacola";

const abas = [
  { href: "/", rotulo: "Cardápio", Icone: UtensilsCrossed },
  { href: "/sacola", rotulo: "Sacola", Icone: ShoppingBag },
  { href: "/pedidos", rotulo: "Pedidos", Icone: Package },
  { href: "/perfil", rotulo: "Perfil", Icone: User },
];

function Barra() {
  const caminho = usePathname();
  const itens = useSacola();
  const quantidade = itens.reduce((soma, i) => soma + i.quantidade, 0);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-around">
        {abas.map(({ href, rotulo, Icone }) => {
          const ativa = href === "/" ? caminho === "/" : caminho.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[72px] flex-col items-center gap-0.5 text-xs ${
                ativa ? "font-bold text-oliva" : "text-carvao/60"
              }`}
            >
              <span className="relative">
                <Icone size={24} />
                {href === "/sacola" && quantidade > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-mostarda px-1 text-[10px] font-bold text-carvao">
                    {quantidade}
                  </span>
                )}
              </span>
              {rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function BarraInferior() {
  return (
    <Suspense fallback={null}>
      <Barra />
    </Suspense>
  );
}