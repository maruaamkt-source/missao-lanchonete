"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DiaHorario = {
  abre?: string;
  fecha?: string;
  "24h"?: boolean;
  fechado?: boolean;
};

export async function salvarConfig(d: {
  taxa_percentual: number;
  horario: Record<string, DiaHorario>;
  status_manual: string | null;
  status_manual_ate: string | null;
}) {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurante")
    .select("id")
    .limit(1)
    .single();
  if (!r) return { erro: "Restaurante não encontrado." };

  const { data, error } = await supabase
    .from("restaurante")
    .update({
      taxa_percentual: d.taxa_percentual,
      horario_funcionamento: d.horario,
      status_manual: d.status_manual,
      status_manual_ate: d.status_manual ? d.status_manual_ate : null,
    })
    .eq("id", r.id)
    .select("id");
  if (error) return { erro: error.message };
  if (!data?.length) return { erro: "Sem permissão pra salvar." };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  return {};
}