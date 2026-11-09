"use client";

import { useState, useTransition } from "react";
import { User, SchoolClass, Section, TeacherAssignment } from "@/lib/db/types";
import { createTeacherAction, assignTeacherAction } from "@/app/actions/teachers";
import { GraduationCap, UserPlus, ShieldCheck, Mail, Phone, Layers, Plus, CheckCircle2, AlertCircle, X } from "lucide-react";

interface TeacherManagementClientProps {
  teachers: User[];
  classes: SchoolClass[];
  sections: Section[];
  assignments: TeacherAssignment[];
}

export default function TeacherManagementClient({
  teachers,
  classes,
  sections,
  assignments,
}: TeacherManagementClientProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<string>("");

  const handleCreateTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTeacherAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Teacher created!" });
        setIsCreateOpen(false);
        window.location.reload();
      }
    });
  };

  const handleAssignTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await assignTeacherAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Teacher assigned!" });
        setIsAssignOpen(false);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Teacher Accounts & Class Assignments</h1>
          <p className="text-xs text-slate-500">
            Create teacher credentials, assign class teachers, and configure marks entry permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Teacher Account</span>
          </button>
        </div>
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
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers.map((teacher) => {
          const teacherAssignments = assignments.filter((a) => a.teacherId === teacher.id);

          return (
            <div key={teacher.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
                      {teacher.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{teacher.fullName}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {teacher.email}
                        </span>
                        {teacher.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {teacher.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    Active
                  </span>
                </div>

                {/* Assigned Classes */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Class Assignments
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {teacherAssignments.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No class assigned yet</span>
                    ) : (
                      teacherAssignments.map((a) => {
                        const cls = classes.find((c) => c.id === a.classId);
                        return (
                          <span
                            key={a.id}
                            className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 text-amber-700" />
                            <span>{cls?.name || a.classId}</span>
                            {a.isClassTeacher && (
                              <span className="text-[10px] bg-amber-200/60 text-amber-950 px-1 rounded font-bold">
                                CT
                              </span>
                            )}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedTeacherForAssign(teacher.id);
                    setIsAssignOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Class</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Teacher Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Add New Teacher Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Swati Devi"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="teacher@sbbschool.com"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="10-digit mobile"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Assign Teacher to Class</h3>
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-3 text-xs">
              <input type="hidden" name="teacherId" value={selectedTeacherForAssign} />

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Class *</label>
                <select name="classId" required className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Section</label>
                <select name="sectionId" className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                  <option value="sec-a">Section A</option>
                  <option value="sec-b">Section B</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isClassTeacher"
                  name="isClassTeacher"
                  defaultChecked
                  className="rounded border-slate-300 text-[#0f2537] focus:ring-[#0f2537]"
                />
                <label htmlFor="isClassTeacher" className="text-slate-700 font-medium cursor-pointer">
                  Assign as Primary Class Teacher (Oversees all subject marks)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
