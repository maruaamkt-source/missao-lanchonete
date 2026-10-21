import { Suspense } from "react";
import AcessoPapel from "@/components/AcessoPapel";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <AcessoPapel papel="cozinha" titulo="Acesso da cozinha" />
    </Suspense>
  );
}