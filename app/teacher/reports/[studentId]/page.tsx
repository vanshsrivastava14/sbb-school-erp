import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getStudentById,
  getClasses,
  getClassSubjects,
  getMarksForStudent,
  getReportCard,
  getCurrentAcademicSession,
} from "@/lib/db/store";
import OfficialReportCard from "@/components/report-card/OfficialReportCard";

export default async function TeacherStudentReportPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSession();
  const { studentId } = await params;
  const student = await getStudentById(studentId);
  if (!student) {
    notFound();
  }

  const classes = await getClasses();
  const schoolClass = classes.find((c) => c.id === student.classId) || classes[0];
  const currentSession = await getCurrentAcademicSession();

  const classSubjs = await getClassSubjects(student.classId);
  const scholasticSubjects = classSubjs.filter((cs) => cs.subject.type === "scholastic");
  const coScholasticSubjects = classSubjs.filter((cs) => cs.subject.type === "co_scholastic");

  const marks = await getMarksForStudent(student.id, currentSession.id);
  const reportCard = await getReportCard(student.id, currentSession.id);

  return (
    <OfficialReportCard
      student={student}
      schoolClass={schoolClass}
      scholasticSubjects={scholasticSubjects}
      coScholasticSubjects={coScholasticSubjects}
      marks={marks}
      reportCard={reportCard}
      teacherName={session?.fullName || "Swati"}
      backHref="/teacher/reports"
    />
  );
}
