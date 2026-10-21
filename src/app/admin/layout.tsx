import GuardaPapel from "@/components/GuardaPapel";
import AdminMenu from "@/components/admin/AdminMenu";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuardaPapel papel="admin">
      <div className="min-h-screen bg-areia text-carvao">
        <AdminMenu />
        <div className="lg:pl-64">{children}</div>
      </div>
    </GuardaPapel>
  );
}