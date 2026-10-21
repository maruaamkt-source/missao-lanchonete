import { Suspense } from "react";
import AcessoPapel from "@/components/AcessoPapel";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <AcessoPapel papel="admin" titulo="Acesso do administrador" />
    </Suspense>
  );
}