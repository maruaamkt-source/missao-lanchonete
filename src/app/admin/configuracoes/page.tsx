import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ConfigForm from "@/components/admin/ConfigForm";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurante")
    .select(
      "taxa_percentual, horario_funcionamento, status_manual, status_manual_ate"
    )
    .limit(1)
    .single();
  if (!r) notFound();

  const ate = r.status_manual_ate
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short",
      })
        .format(new Date(r.status_manual_ate))
        .replace(" ", "T")
    : "";

  return (
    <ConfigForm
      inicial={{
        taxa_percentual: Number(r.taxa_percentual ?? 0),
        horario: r.horario_funcionamento ?? {},
        status_manual: r.status_manual ?? null,
        status_manual_ate: ate,
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-carvao/60">Carregando...</p>}>
      <Conteudo />
    </Suspense>
  );
}