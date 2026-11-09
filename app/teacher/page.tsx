import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDb, getTeacherAssignments, getClassSubjects } from "@/lib/db/store";
import {
  Users,
  ClipboardEdit,
  Send,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function TeacherDashboardPage() {
  const session = await getSession();
  const db = await getDb();
  const currentSession = db.academicSessions.find((s) => s.isCurrent)?.name || "2025-2026";

  const assignments = await getTeacherAssignments(session?.userId);
  const assignedClassIds = new Set(assignments.map((a) => a.classId));

  const assignedClasses = db.classes.filter((c) => assignedClassIds.has(c.id));
  const assignedStudents = db.students.filter((s) => assignedClassIds.has(s.classId) && s.isActive);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f2537] via-[#1a446c] to-[#0f2537] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2">
            Teacher Marks Portal • Session {currentSession}
          </div>
          <h1 className="text-2xl font-bold font-serif">Welcome, {session?.fullName}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Access assigned classes, record unit test and term examination marks, and submit for admin publication.
          </p>
        </div>
        <Link
          href="/teacher/marks"
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0f2537] text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2"
        >
          <ClipboardEdit className="w-4 h-4" />
          <span>Enter Class Marks</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Assigned Classes</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <ClipboardEdit className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0f2537]">{assignedClasses.length}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {assignedClasses.map((cls) => (
              <span key={cls.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                {cls.name}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0f2537]">{assignedStudents.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Eligible for marks evaluation</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Marks Submission Workflow</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4" /> Draft & Submit Ready
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Real-time calculations enabled</p>
        </div>
      </div>

      {/* Assigned Classes Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Assigned Classes & Immediate Actions
          </h2>
          <span className="text-xs text-slate-400">Class Teacher Responsibilities</span>
        </div>

        <div className="divide-y divide-slate-100">
          {assignedClasses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No classes currently assigned to your account. Please contact the administrator.
            </div>
          ) : (
            assignedClasses.map((cls) => {
              const studentsInClass = assignedStudents.filter((s) => s.classId === cls.id);
              return (
                <div key={cls.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0f2537]">{cls.name}</h3>
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[11px] font-semibold">
                        Section A
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px]">
                        Class Teacher
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {studentsInClass.length} Students enrolled • Hindi, English, Maths, G.K., Co-Scholastics
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/teacher/marks?classId=${cls.id}`}
                      className="px-3.5 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
                    >
                      <ClipboardEdit className="w-3.5 h-3.5" />
                      <span>Enter Marks</span>
                    </Link>
                    <Link
                      href={`/teacher/reports?classId=${cls.id}`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report Cards</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
