import { unstable_noStore as noStore } from "next/cache";
import { getAllUsers, getClasses, getSections, getTeacherAssignments } from "@/lib/db/store";
import { getSession } from "@/lib/auth/session";
import TeacherManagementClient from "@/components/teachers/TeacherManagementClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTeachersPage() {
  noStore();
  const session = await getSession();
  const allUsers = await getAllUsers();
  const currentAdmin =
    (session ? allUsers.find((u) => u.id === session.userId) : undefined) ||
    allUsers.find((u) => u.role === "admin") ||
    null;
  const teachers = allUsers.filter((u) => u.role === "teacher");
  const classes = await getClasses();
  const sections = await getSections();
  const assignments = await getTeacherAssignments();

  return (
    <TeacherManagementClient
      teachers={teachers}
      classes={classes}
      sections={sections}
      assignments={assignments}
      currentAdmin={currentAdmin}
    />
  );
}
