import {
  getClasses,
  getSections,
  getSubjects,
  getDb,
  getAllUsers,
  getTeacherAssignments,
  getClassSubjects,
} from "@/lib/db/store";
import ClassManagementClient from "@/components/classes/ClassManagementClient";

export default async function AdminClassesPage() {
  const db = await getDb();
  const classes = await getClasses();
  const sections = await getSections();
  const subjects = await getSubjects();
  const allUsers = await getAllUsers();
  const teachers = allUsers.filter((u) => u.role === "teacher" && u.isActive);
  const assignments = await getTeacherAssignments();

  // Load all class subjects with joined subjects
  const classSubjectsWithDetails = [];
  for (const cls of classes) {
    const cs = await getClassSubjects(cls.id);
    classSubjectsWithDetails.push(...cs);
  }

  // Count enrolled students per class
  const studentCounts: Record<string, number> = {};
  for (const cls of classes) {
    studentCounts[cls.id] = db.students.filter((s) => s.classId === cls.id && s.isActive).length;
  }

  return (
    <ClassManagementClient
      classes={classes}
      sections={sections}
      subjects={subjects}
      classSubjects={classSubjectsWithDetails}
      teachers={teachers}
      assignments={assignments}
      studentCounts={studentCounts}
    />
  );
}
