import { getSession } from "@/lib/auth/session";
import { getDb, getTeacherAssignments } from "@/lib/db/store";
import { Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default async function TeacherSubmissionsPage() {
  const session = await getSession();
  const db = await getDb();
  const assignments = await getTeacherAssignments(session?.userId);
  const classIds = new Set(assignments.map((a) => a.classId));
  if (classIds.size === 0 && session?.role === "teacher") {
    classIds.add("class-lkg");
  }

  const marks = db.marks.filter((m) => m.enteredByTeacherId === session?.userId || classIds.has(m.studentId));
  const draftCount = marks.filter((m) => m.status === "draft").length;
  const submittedCount = marks.filter((m) => m.status === "submitted").length;
  const publishedCount = marks.filter((m) => m.status === "published" || m.status === "approved").length;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-lg font-bold text-[#0f2537] font-serif">Marks Submissions & Status Tracking</h1>
        <p className="text-xs text-slate-500">
          Track the lifecycle of your recorded marks from draft to administrator approval and official report card publication.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{draftCount}</p>
              <p className="text-xs text-slate-500">Draft Entries (In Progress)</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{submittedCount}</p>
              <p className="text-xs text-slate-500">Submitted for Admin Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{publishedCount}</p>
              <p className="text-xs text-slate-500">Approved & Published Cards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
