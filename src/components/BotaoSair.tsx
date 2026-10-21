import { sair } from "@/app/login/actions";

export default function BotaoSair() {
  return (
    <form action={sair}>
      <button
        type="submit"
        className="rounded-xl bg-oliva px-6 py-3 font-semibold text-areia"
      >
        Sair
      </button>
    </form>
  );
}