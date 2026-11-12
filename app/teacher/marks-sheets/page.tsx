import { unstable_noStore as noStore } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getClasses,
  getDb,
  getCurrentAcademicSession,
  getTeacherAssignments,
  getClassSubjects,
  invalidateDbCache,
} from "@/lib/db/store";
import MarksFillingSheetClient from "@/components/marks/MarksFillingSheetClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherMarksFillingSheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  noStore();
  invalidateDbCache();
  const session = await getSession();
  const db = await getDb();
  const allClasses = await getClasses();
  const currentSession = await getCurrentAcademicSession();
  const params = await searchParams;

  const assignments = await getTeacherAssignments(session?.userId);
  const assignedClassIds = new Set(assignments.map((a) => a.classId));

  let classesToShow = allClasses.filter((c) => assignedClassIds.has(c.id));
  if (classesToShow.length === 0) {
    classesToShow = allClasses.slice(0, 1);
  }

  const allClassSubjects = [];
  for (const cls of classesToShow) {
    const cs = await getClassSubjects(cls.id);
    allClassSubjects.push(...cs);
  }

  return (
    <MarksFillingSheetClient
      classes={classesToShow}
      students={db.students.filter((s) => s.isActive)}
      classSubjects={allClassSubjects}
      sessionLabel={currentSession.name}
      isAdmin={false}
      initialClassId={params.classId || classesToShow[0]?.id}
    />
  );
}
