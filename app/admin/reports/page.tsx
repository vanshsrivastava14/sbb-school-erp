import Link from "next/link";
import { getClasses, getDb, getCurrentAcademicSession } from "@/lib/db/store";
import { FileText, Eye, Printer, Award, Search, CheckCircle2 } from "lucide-react";

export default async function AdminReportsListPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; search?: string }>;
}) {
  const db = await getDb();
  const classes = await getClasses();
  const currentSession = await getCurrentAcademicSession();
  const params = await searchParams;

  const selectedClassId = params.classId || classes[1]?.id || classes[0]?.id; // Default to LKG (index 1)
  const searchQuery = (params.search || "").toLowerCase().trim();

  const students = db.students.filter((s) => s.isActive && (selectedClassId === "all" || s.classId === selectedClassId));
  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    return s.studentName.toLowerCase().includes(searchQuery) || s.admissionNo.includes(searchQuery);
  });

  const reportCards = db.reportCards.filter((rc) => rc.academicSessionId === currentSession.id);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Official Report Cards Directory</h1>
          <p className="text-xs text-slate-500">
            Preview, print, and download authenticated school report cards reproducing the official physical format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/marks"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Publish / Recalculate Cards</span>
          </Link>
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        {classes.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          const count = db.students.filter((s) => s.classId === cls.id && s.isActive).length;
          return (
            <Link
              key={cls.id}
              href={`/admin/reports?classId=${cls.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? "bg-[#0f2537] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cls.name} ({count})
            </Link>
          );
        })}
      </div>

      {/* Report Cards Roster */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {selectedClass?.name || "Class"} Report Cards ({filteredStudents.length} Students)
          </span>
          <span className="text-xs text-slate-500">
            A4 Double-Border Printable PDF Format Ready
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">Roll</th>
                <th className="py-3 px-3.5">Admission / S.R.</th>
                <th className="py-3 px-3.5">Student Name</th>
                <th className="py-3 px-3.5 text-center">Grand Total</th>
                <th className="py-3 px-3.5 text-center">Percentage</th>
                <th className="py-3 px-3.5 text-center">Grade</th>
                <th className="py-3 px-3.5 text-center">Class Rank</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No students found for this class.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
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
                      <td className="py-3 px-3.5 text-center">
                        {rc ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-[10px] font-medium">
                            Ready to Generate
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Link
                          href={`/admin/reports/${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg transition shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>View Official Card</span>
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
