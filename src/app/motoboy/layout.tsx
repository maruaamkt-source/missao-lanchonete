import GuardaPapel from "@/components/GuardaPapel";

export default function MotoboyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuardaPapel papel="motoboy">{children}</GuardaPapel>;
}