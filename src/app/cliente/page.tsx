import BotaoSair from "@/components/BotaoSair";

export default function ClientePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-titulo text-3xl font-bold text-oliva">
        Área do Cliente
      </h1>
      <BotaoSair />
    </main>
  );
}