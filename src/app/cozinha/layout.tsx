import GuardaPapel from "@/components/GuardaPapel";

export default function CozinhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuardaPapel papel="cozinha">
      <div className="min-h-screen bg-areia text-carvao">{children}</div>
    </GuardaPapel>
  );
}