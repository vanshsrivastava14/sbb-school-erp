import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDb, getTeacherAssignments } from "@/lib/db/store";
import { Users, ClipboardEdit, FileText, ArrowRight, Layers } from "lucide-react";

export default async function TeacherClassesPage() {
  const session = await getSession();
  const db = await getDb();
  const assignments = await getTeacherAssignments(session?.userId);
  const classIds = new Set(assignments.map((a) => a.classId));
  if (classIds.size === 0 && session?.role === "teacher") {
    classIds.add("class-lkg");
  }

  const assignedClasses = db.classes.filter((c) => classIds.has(c.id));

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-lg font-bold text-[#0f2537] font-serif">My Assigned Classes & Student Rosters</h1>
        <p className="text-xs text-slate-500">
          Classes where you are designated as the Class Teacher or Subject Evaluator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignedClasses.map((cls) => {
          const students = db.students.filter((s) => s.classId === cls.id && s.isActive);

          return (
            <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm">
                      {cls.code}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0f2537]">{cls.name}</h2>
                      <p className="text-xs text-slate-500">Section A • {students.length} Students</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-semibold">
                    Class Teacher
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Enrolled Students Preview
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {students.slice(0, 5).map((s) => (
                      <div key={s.id} className="p-1.5 bg-slate-50 rounded text-xs flex justify-between text-slate-700">
                        <span className="font-medium">Roll {s.rollNo}: {s.studentName}</span>
                        <span className="font-mono text-slate-400">SR: {s.admissionNo}</span>
                      </div>
                    ))}
                    {students.length > 5 && (
                      <p className="text-[11px] text-slate-400 text-center pt-1">
                        + {students.length - 5} more students
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Link
                  href={`/teacher/marks?classId=${cls.id}`}
                  className="px-3.5 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                >
                  <ClipboardEdit className="w-3.5 h-3.5" />
                  <span>Enter Marks</span>
                </Link>
                <Link
                  href={`/teacher/reports?classId=${cls.id}`}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report Cards</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
