import GuardaPapel from "@/components/GuardaPapel";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuardaPapel papel="cliente">{children}</GuardaPapel>;
}