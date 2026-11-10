import { notFound } from "next/navigation";
import {
  getDb,
  getStudentById,
  getClasses,
  getClassSubjects,
  getMarksForStudent,
  getReportCard,
  getCurrentAcademicSession,
} from "@/lib/db/store";
import { ReportCard, AcademicSession } from "@/lib/db/types";
import OfficialReportCard from "@/components/report-card/OfficialReportCard";

export default async function AdminStudentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { studentId } = await params;
  const { sessionId } = await searchParams;
  const student = await getStudentById(studentId);
  if (!student) {
    notFound();
  }

  const db = await getDb();
  const classes = await getClasses();
  const currentSession = await getCurrentAcademicSession();

  // Pick requested session, or session that has a report card, or current session
  let targetSessionId = sessionId;
  if (!targetSessionId) {
    const existingRc = db.reportCards.find((rc: ReportCard) => rc.studentId === student.id);
    targetSessionId = existingRc ? existingRc.academicSessionId : currentSession.id;
  }
  const activeSession = db.academicSessions.find((s: AcademicSession) => s.id === targetSessionId) || currentSession;

  const schoolClass = classes.find((c) => c.id === student.classId) || classes[0];

  const classSubjs = await getClassSubjects(student.classId);
  const scholasticSubjects = classSubjs.filter((cs) => cs.subject.type === "scholastic");
  const coScholasticSubjects = classSubjs.filter((cs) => cs.subject.type === "co_scholastic");

  const marks = await getMarksForStudent(student.id, activeSession.id);
  const reportCard = await getReportCard(student.id, activeSession.id);

  return (
    <OfficialReportCard
      student={student}
      schoolClass={schoolClass}
      scholasticSubjects={scholasticSubjects}
      coScholasticSubjects={coScholasticSubjects}
      marks={marks}
      reportCard={reportCard}
      backHref="/admin/reports"
    />
  );
}
