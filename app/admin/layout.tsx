import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentAcademicSession } from "@/lib/db/store";
import AdminShell from "@/components/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const currentSession = await getCurrentAcademicSession();

  return (
    <AdminShell
      user={{
        fullName: session.fullName,
        email: session.email,
        role: session.role,
      }}
      currentSessionName={currentSession.name}
    >
      {children}
    </AdminShell>
  );
}
