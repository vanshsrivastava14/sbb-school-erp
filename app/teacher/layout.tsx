import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCurrentAcademicSession } from "@/lib/db/store";
import TeacherShell from "@/components/layout/TeacherShell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentSession = await getCurrentAcademicSession();

  return (
    <TeacherShell
      user={{
        fullName: session.fullName,
        email: session.email,
        role: session.role,
      }}
      currentSessionName={currentSession.name}
    >
      {children}
    </TeacherShell>
  );
}
