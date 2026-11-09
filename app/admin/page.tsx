import Link from "next/link";
import {
  Users,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
} from "lucide-react";
import { getDb } from "@/lib/db/store";

export default async function AdminDashboardPage() {
  const db = await getDb();
  const currentSession = db.academicSessions.find((s) => s.isCurrent)?.name || "2025-2026";

  const totalStudents = db.students.filter((s) => s.isActive).length;
  const totalClasses = db.classes.length;
  const totalSections = db.sections.length;
  const totalTeachers = db.users.filter((u) => u.role === "teacher" && u.isActive).length;

  const marksEntries = db.marks.filter((m) => m.academicSessionId.includes("2025-2026"));
  const pendingSubmissions = marksEntries.filter((m) => m.status === "submitted").length;
  const draftMarks = marksEntries.filter((m) => m.status === "draft").length;
  const publishedMarks = marksEntries.filter((m) => m.status === "published").length;
  const totalReportCards = db.reportCards.length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f2537] via-[#153e63] to-[#0f2537] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2">
            Academic Session {currentSession}
          </div>
          <h1 className="text-2xl font-bold font-serif">Administrative Command Center</h1>
          <p className="text-xs text-slate-300 mt-1">
            Overview of student enrollments, teacher marks progress, and published report cards.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/students"
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#0f2537] text-xs font-bold rounded-xl shadow-xs transition"
          >
            Manage Students
          </Link>
          <Link
            href="/admin/marks"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/20 transition"
          >
            Review Marks
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0f2537]">{totalStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active across all 12 classes</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Classes & Sections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0f2537]">{totalClasses} / {totalSections}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pre-Nursery through Class IX</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Teaching Staff</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0f2537]">{totalTeachers}</p>
          <p className="text-[11px] text-slate-400 mt-1">With active class assignments</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Published Cards</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0f2537]">{totalReportCards}</p>
          <p className="text-[11px] text-slate-400 mt-1">Official printable PDFs ready</p>
        </div>
      </div>

      {/* Marks & Submissions Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Examination Marks Entry Workflow Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{draftMarks}</p>
              <p className="text-xs text-slate-500">Draft Marks (In Progress)</p>
            </div>
          </div>

          <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{pendingSubmissions}</p>
              <p className="text-xs text-slate-500">Pending Admin Review</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{publishedMarks}</p>
              <p className="text-xs text-slate-500">Approved & Published Marks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/students"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#0f2537] hover:shadow transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-[#0f2537] group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f2537] transition" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Student Directory & Excel Import</h3>
          <p className="text-xs text-slate-500 mt-1">
            Import all 410 student records from student data.xlsx, view profiles, and update admission details.
          </p>
        </Link>

        <Link
          href="/admin/marks"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#0f2537] hover:shadow transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-[#0f2537] group-hover:text-white transition">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f2537] transition" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Marks Review & Verification</h3>
          <p className="text-xs text-slate-500 mt-1">
            Audit teacher marks submissions, verify Term 1 and Term 2 calculations, and approve class results.
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#0f2537] hover:shadow transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-[#0f2537] group-hover:text-white transition">
              <FileText className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f2537] transition" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Report Cards & Printable PDFs</h3>
          <p className="text-xs text-slate-500 mt-1">
            Generate and preview official report cards with high-res emblem, bar charts, and signatures.
          </p>
        </Link>
      </div>
    </div>
  );
}
