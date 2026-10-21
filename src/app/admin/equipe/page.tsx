import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import EquipeLista, { type Membro } from "@/components/admin/EquipeLista";

async function Conteudo() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select(
      "id, nome, email, telefone, papel, cargo_pedido, codigo_acesso, codigo_validado, ativo"
    )
    .or("papel.in.(motoboy,cozinha),cargo_pedido.not.is.null")
    .order("nome");

  return <EquipeLista membros={(data ?? []) as Membro[]} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="py-10 text-center text-sm">Carregando...</p>}
    >
      <Conteudo />
    </Suspense>
  );
}