"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function AtualizarAuto() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => iniciar(() => router.refresh())}
      className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-carvao shadow-sm hover:bg-areia"
    >
      <RefreshCw size={16} className={pendente ? "animate-spin" : ""} />
      Atualizar
    </button>
  );
}