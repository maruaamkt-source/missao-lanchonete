import { Suspense } from "react";
import { connection } from "next/server";
import { exigirPapel, type Papel } from "@/lib/auth";

async function Checar({
  papel,
  children,
}: {
  papel: Papel;
  children: React.ReactNode;
}) {
  await connection();
  await exigirPapel(papel);
  return <>{children}</>;
}

export default function GuardaPapel({
  papel,
  children,
}: {
  papel: Papel;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <Checar papel={papel}>{children}</Checar>
    </Suspense>
  );
}