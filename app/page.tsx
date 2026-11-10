import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  UserCheck,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { getDb } from "@/lib/db/store";

export default async function HomePage() {
  const db = await getDb();
  const studentCount = db.students.filter((s) => s.isActive).length;
  const classCount = db.classes.length;
  const teacherCount = db.users.filter((u) => u.role === "teacher").length;
  const currentSession = db.academicSessions.find((s) => s.isCurrent)?.name || "2025-2026";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Notice Bar */}
      <div className="bg-[#0f2537] text-amber-300 text-xs py-2 px-4 border-b border-amber-500/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">S.B.B. CHILDREN SCHOOL</span>
            <span>•</span>
            <span>Estd. 1988</span>
            <span>•</span>
            <span>Gandhi Nagar Kunda, Pratapgarh (U.P.)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-[11px]">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-amber-300" /> 9451275030, 9792066753
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-amber-300" /> sbbkunda@gmail.com
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative flex-shrink-0">
              <Image
                src="/images/school-emblem.png"
                alt="S.B.B Emblem"
                width={48}
                height={48}
                priority
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f2537] font-serif leading-tight">
                S.B.B CHILDREN SCHOOL
              </h1>
              <p className="text-xs text-slate-500">School ERP & Report Card Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Academic Session {currentSession} • Active
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2537] font-serif tracking-tight leading-tight">
              Official Examination, Marks & Report Card Portal
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Designed specifically for S.B.B Children School to manage student records, streamline teacher marks entry, automatically calculate accurate totals, and reproduce the school&apos;s authentic printed report card with high-resolution emblem, clustered bar chart, and official grading metrics.
            </p>

            {/* Role Access Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Administrative Portal</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Manage 410+ student records, teacher assignments, bulk Excel imports, and publish official report cards.
                </p>
                <Link
                  href="/login?role=admin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f2537] hover:text-amber-700 transition"
                >
                  <span>Admin Login</span> <ArrowRight className="w-3 h-3 text-amber-600" />
                </Link>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Teacher Marks Portal</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  View assigned classes, enter unit test and term marks, save drafts, and submit results for review.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f2537] hover:text-amber-700"
                >
                  Teacher Login <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Live Statistics & Highlights */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                School Snapshot • Live Database
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0f2537]">{studentCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Students</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0f2537]">{classCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Classes</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-[#0f2537]">{teacherCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Teachers</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Exact reproduction of official S.B.B. Children School report card template.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Scholastic (U.T-1, Half Yearly, U.T-2, Annual) & Co-Scholastic tracking.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Integrated visual comparison chart, attendance, and official 8-tier grade scale.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 1988–2026 S.B.B Children School. All rights reserved.</p>
          <p className="text-slate-400">Gandhi Nagar Kunda, Pratapgarh • Phone: 9451275030</p>
        </div>
      </footer>
    </div>
  );
}
