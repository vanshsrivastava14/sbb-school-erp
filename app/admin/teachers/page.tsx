import { getAllUsers, getClasses, getSections, getTeacherAssignments } from "@/lib/db/store";
import TeacherManagementClient from "@/components/teachers/TeacherManagementClient";

export default async function AdminTeachersPage() {
  const allUsers = await getAllUsers();
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
    />
  );
}
