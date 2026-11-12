import { unstable_noStore as noStore } from "next/cache";
import { getClasses, getDb, getCurrentAcademicSession, getClassSubjects, invalidateDbCache } from "@/lib/db/store";
import AdminMarksReviewClient from "@/components/marks/AdminMarksReviewClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMarksPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; studentId?: string; mode?: string }>;
}) {
  noStore();
  invalidateDbCache();
  const params = await searchParams;
  const db = await getDb();
  const classes = await getClasses();
  const currentSession = await getCurrentAcademicSession();

  const classSubjectsWithDetails = [];
  for (const cls of classes) {
    const cs = await getClassSubjects(cls.id);
    classSubjectsWithDetails.push(...cs);
  }

  const allStudents = db.students.filter((s) => s.isActive);
  const allMarks = db.marks.filter((m) => m.academicSessionId === currentSession.id);
  const reportCards = db.reportCards.filter((rc) => rc.academicSessionId === currentSession.id);

  return (
    <AdminMarksReviewClient
      classes={classes}
      allStudents={allStudents}
      allMarks={allMarks}
      classSubjects={classSubjectsWithDetails}
      reportCards={reportCards}
      currentSession={currentSession}
      initialClassId={params.classId}
      initialStudentId={params.studentId}
      initialMode={params.mode === "entry" ? "entry" : "review"}
    />
  );
}
