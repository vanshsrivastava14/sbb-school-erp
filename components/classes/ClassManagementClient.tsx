"use client";

import { useState, useTransition } from "react";
import {
  SchoolClass,
  Section,
  Subject,
  ClassSubject,
  TeacherAssignment,
  User,
} from "@/lib/db/types";
import {
  createClassAction,
  assignClassTeacherAction,
  addClassSubjectAction,
} from "@/app/actions/classes";
import {
  Layers,
  Plus,
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Award,
  Settings,
} from "lucide-react";

interface ClassManagementClientProps {
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  classSubjects: (ClassSubject & { subject: Subject })[];
  teachers: User[];
  assignments: TeacherAssignment[];
  studentCounts: Record<string, number>;
}

export default function ClassManagementClient({
  classes,
  sections,
  subjects,
  classSubjects,
  teachers,
  assignments,
  studentCounts,
}: ClassManagementClientProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [subjectModalClassId, setSubjectModalClassId] = useState<string | null>(null);

  // Quick class teacher change handler
  const handleAssignTeacher = (classId: string, teacherId: string) => {
    setNotification(null);
    const formData = new FormData();
    formData.set("classId", classId);
    formData.set("sectionId", "sec-a");
    formData.set("teacherId", teacherId);

    startTransition(async () => {
      const res = await assignClassTeacherAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Class teacher assigned!" });
        window.location.reload();
      }
    });
  };

  // Add new class submit
  const handleAddClassSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setNotification(null);

    startTransition(async () => {
      const res = await createClassAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "New class created!" });
        setIsAddClassOpen(false);
        window.location.reload();
      }
    });
  };

  // Add subject submit
  const handleAddSubjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subjectModalClassId) return;
    const formData = new FormData(e.currentTarget);
    formData.set("classId", subjectModalClassId);
    setNotification(null);

    startTransition(async () => {
      const res = await addClassSubjectAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Subject added!" });
        setSubjectModalClassId(null);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Class & Class Teacher Management</h1>
          <p className="text-xs text-slate-500">
            Designate a dedicated Class Teacher for every class, configure subjects, or create new school classes.
          </p>
        </div>

        <button
          onClick={() => setIsAddClassOpen(true)}
          className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Add New Class</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const subjs = classSubjects.filter((cs) => cs.classId === cls.id);
          const scholastic = subjs.filter((cs) => cs.subject.type === "scholastic");
          const coScholastic = subjs.filter((cs) => cs.subject.type === "co_scholastic");

          // Find current assigned class teacher
          const assignment = assignments.find((a) => a.classId === cls.id && a.isClassTeacher);
          const currentTeacher = teachers.find((t) => t.id === assignment?.teacherId);
          const enrolledCount = studentCounts[cls.id] || 0;

          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                      {cls.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0f2537] uppercase">{cls.name}</h3>
                      <p className="text-[10px] text-slate-400">Order: #{cls.orderIndex} • Section A</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded font-semibold text-[11px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-600" />
                    <span>{enrolledCount} Students</span>
                  </span>
                </div>

                {/* Designated Class Teacher Selector */}
                <div className="mt-3.5 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                      <span>Class Teacher:</span>
                    </span>
                    {currentTeacher ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <select
                    value={currentTeacher?.id || ""}
                    onChange={(e) => handleAssignTeacher(cls.id, e.target.value)}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2537]"
                  >
                    <option value="">-- Assign a Class Teacher --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subjects Preview */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Scholastic Subjects ({scholastic.length})
                    </span>
                    <button
                      onClick={() => setSubjectModalClassId(cls.id)}
                      className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add Subject
                    </button>
                  </div>

                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {scholastic.map((cs) => (
                      <div
                        key={cs.id}
                        className="p-1.5 bg-slate-50 rounded text-[11px] flex items-center justify-between border border-slate-100"
                      >
                        <span className="font-semibold text-slate-700">{cs.subject.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          UT: {cs.maxUt1} | Term: {cs.maxHalfYearly}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Co-Scholastic preview */}
                {coScholastic.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Co-Scholastic
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {coScholastic.map((cs) => (
                        <span
                          key={cs.id}
                          className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium"
                        >
                          {cs.subject.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Add New School Class</h3>
              <button onClick={() => setIsAddClassOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Class Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. CLASS X or NURSERY"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Code / Short Form *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. X or NUR"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    name="orderIndex"
                    defaultValue={classes.length + 1}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Copy Standard Subjects From:
                </label>
                <select
                  name="inheritSubjectsFrom"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="class-1">Standard Primary Curriculum (Hindi, Eng, Math, Sci, SST, GK)</option>
                  <option value="class-9">Secondary Curriculum (Hindi, Eng, Math, Sci, SST, IT)</option>
                  <option value="class-lkg">Pre-Primary Curriculum (Hindi, Eng, Math, GK, Rhymes)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject to Class Modal */}
      {subjectModalClassId && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Add Subject to Class</h3>
              <button onClick={() => setSubjectModalClassId(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Subject *</label>
                <select name="subjectId" required className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max U.T-1</label>
                  <input
                    type="number"
                    name="maxUt1"
                    defaultValue={25}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Half Yearly</label>
                  <input
                    type="number"
                    name="maxHalfYearly"
                    defaultValue={100}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max U.T-2</label>
                  <input
                    type="number"
                    name="maxUt2"
                    defaultValue={25}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Annual</label>
                  <input
                    type="number"
                    name="maxAnnual"
                    defaultValue={100}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubjectModalClassId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
