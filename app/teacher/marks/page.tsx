import { unstable_noStore as noStore } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getDb,
  getTeacherAssignments,
  getClasses,
  getStudents,
  getClassSubjects,
  getCurrentAcademicSession,
  invalidateDbCache,
} from "@/lib/db/store";
import TeacherMarksEntryClient from "@/components/marks/TeacherMarksEntryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherMarksPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; studentId?: string }>;
}) {
  noStore();
  invalidateDbCache();
  const session = await getSession();
  const db = await getDb();
  const currentSession = await getCurrentAcademicSession();

  const params = await searchParams;
  const assignments = await getTeacherAssignments(session?.userId);

  // If admin is viewing, allow all classes; if teacher, show assigned classes
  let accessibleClassIds = new Set<string>();
  if (session?.role === "admin") {
    db.classes.forEach((c) => accessibleClassIds.add(c.id));
  } else {
    assignments.forEach((a) => accessibleClassIds.add(a.classId));
    // Default to at least class-lkg if none assigned
    if (accessibleClassIds.size === 0) {
      accessibleClassIds.add("class-lkg");
    }
  }

  const assignedClasses = db.classes.filter((c) => accessibleClassIds.has(c.id));
  const allStudents = db.students.filter((s) => accessibleClassIds.has(s.classId) && s.isActive);

  // Load class subjects for all accessible classes
  const classSubjectsWithDetails = [];
  for (const cls of assignedClasses) {
    const cs = await getClassSubjects(cls.id);
    classSubjectsWithDetails.push(...cs);
  }

  const existingMarks = db.marks.filter((m) => m.academicSessionId === currentSession.id);

  return (
    <TeacherMarksEntryClient
      assignedClasses={assignedClasses}
      allStudents={allStudents}
      classSubjects={classSubjectsWithDetails}
      existingMarks={existingMarks}
      currentSession={currentSession}
      initialClassId={params.classId}
      initialStudentId={params.studentId}
    />
  );
}
