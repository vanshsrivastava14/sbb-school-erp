import { unstable_noStore as noStore } from "next/cache";
import { getDb, getClasses, getSections, invalidateDbCache } from "@/lib/db/store";
import StudentTableClient from "@/components/students/StudentTableClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminStudentsPage() {
  noStore();
  invalidateDbCache();
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
