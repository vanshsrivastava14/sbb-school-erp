import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getClasses, getDb, getTeacherAssignments, getCurrentAcademicSession } from "@/lib/db/store";
import { FileText, Eye, Printer, Award, Layers } from "lucide-react";

export default async function TeacherReportsListPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await getSession();
  const db = await getDb();
  const currentSession = await getCurrentAcademicSession();
  const params = await searchParams;

  const assignments = await getTeacherAssignments(session?.userId);
  const classIds = new Set(assignments.map((a) => a.classId));
  if (classIds.size === 0 && session?.role === "teacher") {
    classIds.add("class-lkg");
  }

  const assignedClasses = db.classes.filter((c) => classIds.has(c.id));
  const selectedClassId = params.classId || assignedClasses[0]?.id || "class-lkg";

  const students = db.students.filter((s) => s.isActive && s.classId === selectedClassId);
  const reportCards = db.reportCards.filter((rc) => rc.academicSessionId === currentSession.id);
  const selectedClass = db.classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Class Report Cards Preview</h1>
          <p className="text-xs text-slate-500">
            Preview the generated report cards for your assigned class with official branding, marks, and rankings.
          </p>
        </div>

        <Link
          href={`/teacher/marks?classId=${selectedClassId}`}
          className="px-3.5 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg transition shadow-xs"
        >
          Enter / Update Marks
        </Link>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        {assignedClasses.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          const count = db.students.filter((s) => s.classId === cls.id && s.isActive).length;
          return (
            <Link
              key={cls.id}
              href={`/teacher/reports?classId=${cls.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? "bg-[#0f2537] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cls.name} ({count} Students)
            </Link>
          );
        })}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {selectedClass?.name || "Class"} Students ({students.length})
          </span>
          <span className="text-xs text-slate-500">
            Official A4 Preview Available
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">Roll</th>
                <th className="py-3 px-3.5">Admission / S.R.</th>
                <th className="py-3 px-3.5">Student Name</th>
                <th className="py-3 px-3.5 text-center">Score</th>
                <th className="py-3 px-3.5 text-center">Percentage</th>
                <th className="py-3 px-3.5 text-center">Grade</th>
                <th className="py-3 px-3.5 text-center">Class Rank</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No students currently in this class.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const rc = reportCards.find((r) => r.studentId === student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3.5 text-center font-bold text-slate-700 bg-slate-50/50">
                        {student.rollNo}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-[#0f2537]">
                        {student.admissionNo}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 uppercase">
                        {student.studentName}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800">
                        {rc ? `${rc.totalMarks} / ${rc.maxTotalMarks}` : "-"}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-semibold">
                        {rc ? `${rc.percentage}%` : "-"}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {rc ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[11px]">
                            {rc.grade}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-amber-700">
                        {rc ? `#${rc.classRank}` : "-"}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Link
                          href={`/teacher/reports/${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg transition shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>View Card</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
