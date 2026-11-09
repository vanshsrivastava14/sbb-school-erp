import { getDb, getClasses, getSections } from "@/lib/db/store";
import StudentTableClient from "@/components/students/StudentTableClient";

export default async function AdminStudentsPage() {
  const db = await getDb();
  const classes = await getClasses();
  const sections = await getSections();
  const students = db.students.filter((s) => s.isActive);

  return (
    <StudentTableClient
      initialStudents={students}
      classes={classes}
      sections={sections}
    />
  );
}
