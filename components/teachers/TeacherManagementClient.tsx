"use client";

import { useState, useTransition } from "react";
import { User, SchoolClass, Section, TeacherAssignment } from "@/lib/db/types";
import {
  createTeacherAction,
  assignTeacherAction,
  updateTeacherAction,
  updateAdminCredentialsAction,
  deleteTeacherAction,
} from "@/app/actions/teachers";
import {
  GraduationCap,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  Layers,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";

interface TeacherManagementClientProps {
  teachers: User[];
  classes: SchoolClass[];
  sections: Section[];
  assignments: TeacherAssignment[];
  currentAdmin?: User | null;
}

export default function TeacherManagementClient({
  teachers,
  classes,
  sections,
  assignments,
  currentAdmin,
}: TeacherManagementClientProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState<string>("");

  // Editing Teacher State
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPasswords, setShowAdminPasswords] = useState(false);

  const filteredTeachers = teachers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.fullName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.phone && t.phone.includes(q));
  });

  const handleCreateTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTeacherAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Teacher created successfully!" });
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
        setNotification({ type: "success", text: res.message || "Class assignment updated!" });
        setIsAssignOpen(false);
        window.location.reload();
      }
    });
  };

  const handleUpdateTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateTeacherAction(formData);
      if (res.error) {
        setModalError(res.error);
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Teacher account updated successfully!" });
        setEditingTeacher(null);
        window.location.reload();
      }
    });
  };

  const handleUpdateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateAdminCredentialsAction(formData);
      if (res.error) {
        setModalError(res.error);
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Admin credentials updated successfully!" });
        setIsAdminModalOpen(false);
        window.location.reload();
      }
    });
  };

  const handleDeleteTeacher = async (teacher: User) => {
    if (!confirm(`Are you sure you want to remove teacher account for "${teacher.fullName}"?`)) {
      return;
    }
    const formData = new FormData();
    formData.set("teacherId", teacher.id);
    startTransition(async () => {
      const res = await deleteTeacherAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Teacher account removed." });
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Faculty & Teacher Account Management</h1>
          <p className="text-xs text-slate-500">
            Manage teacher usernames, login credentials, passwords, phone numbers, and designated Class Teacher assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentAdmin && (
            <button
              onClick={() => {
                setModalError(null);
                setShowAdminPasswords(false);
                setIsAdminModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Password &amp; Login</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Faculty Account</span>
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

      {/* Search & Quick Stats */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search teacher name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f2537]"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredTeachers.length}</span> of {teachers.length} registered faculty members
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => {
          const teacherAssignments = assignments.filter((a) => a.teacherId === teacher.id);
          const classTeacherAssignment = teacherAssignments.find((a) => a.isClassTeacher);
          const ctClass = classTeacherAssignment ? classes.find((c) => c.id === classTeacherAssignment.classId) : null;

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0f2537] text-amber-300 flex items-center justify-center font-bold font-serif text-sm">
                      {teacher.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{teacher.fullName}</span>
                      </h3>
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400" /> {teacher.email}
                        </span>
                        {teacher.phone && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" /> {teacher.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      teacher.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {teacher.isActive ? "Active" : "Suspended"}
                  </span>
                </div>

                {/* Designated Class Teacher Status */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Class Teacher Role
                  </p>
                  {ctClass ? (
                    <div className="px-2.5 py-1.5 bg-amber-50 text-amber-950 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span>Class Teacher: <strong>{ctClass.name}</strong></span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-xs italic">
                      Subject Faculty (No Class Teacher assigned)
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteTeacher(teacher)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Teacher Account"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedTeacherForAssign(teacher.id);
                      setIsAssignOpen(true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Assign</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setShowPassword(false);
                    }}
                    className="px-3 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Edit className="w-3 h-3 text-amber-300" />
                    <span>Edit / Reset Pass</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT TEACHER MODAL (Full Name, Username/Email, Password, Phone, Class) */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Teacher Credentials</h3>
                  <p className="text-[11px] text-slate-500">Update faculty name, login email, password, and assignments</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setModalError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTeacher} className="space-y-3.5 text-xs">
              <input type="hidden" name="teacherId" value={editingTeacher.id} />

              {/* Full Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={editingTeacher.fullName}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
              </div>

              {/* Login Email / Username */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Username / Login Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editingTeacher.email}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">This email address is used by the teacher to log in.</p>
              </div>

              {/* Password Reset */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold">
                    Reset Password <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Enter new password (min. 6 chars) to reset..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Leave completely blank if you do <strong>not</strong> want to change their current password.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingTeacher.phone || ""}
                    placeholder="e.g. 9451275030"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                  />
                </div>

                {/* Class Teacher Assignment */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Class Teacher</label>
                  <select
                    name="classId"
                    defaultValue={
                      assignments.find((a) => a.teacherId === editingTeacher.id && a.isClassTeacher)?.classId || ""
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                  >
                    <option value="">-- No Class Teacher role --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  name="isActive"
                  defaultChecked={editingTeacher.isActive}
                  className="rounded border-slate-300 text-[#0f2537] focus:ring-[#0f2537]"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700">
                  Account Active (Teacher can log in to enter marks)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Account Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Teacher Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Add New Faculty Account</h3>
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
                <label className="block text-slate-600 font-semibold mb-1">Login Email / Username *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="teacher@sbbschool.com"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Initial Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  defaultValue="teacher123"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default is teacher123</p>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. 9451275030"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3.5 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white font-semibold rounded-lg text-xs"
                >
                  {isPending ? "Creating..." : "Create Account"}
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Assign Teacher to Class</h3>
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Teacher *</label>
                <select
                  name="teacherId"
                  required
                  defaultValue={selectedTeacherForAssign}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Class *</label>
                <select name="classId" required className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white">
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  name="isClassTeacher"
                  id="isCtModal"
                  defaultChecked
                  className="rounded border-slate-300 text-[#0f2537]"
                />
                <label htmlFor="isCtModal" className="font-semibold text-slate-700">
                  Designate as Class Teacher (Authorized to enter all subject marks)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3.5 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white font-semibold rounded-lg text-xs"
                >
                  {isPending ? "Assigning..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CREDENTIALS & PASSWORD MODAL */}
      {isAdminModalOpen && currentAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Admin Account &amp; Password</h3>
                  <p className="text-[11px] text-slate-500">Update administrator login username and password</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setModalError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Admin Display Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={currentAdmin.fullName}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Admin Login Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={currentAdmin.email}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={currentAdmin.phone || ""}
                  placeholder="Optional"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Admin Password *</label>
                <input
                  type={showAdminPasswords ? "text" : "password"}
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                  placeholder="Enter current password to confirm..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold">
                    New Admin Password <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPasswords(!showAdminPasswords)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    {showAdminPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAdminPasswords ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showAdminPasswords ? "text" : "password"}
                  name="newPassword"
                  autoComplete="new-password"
                  placeholder="Enter new password (min. 6 chars)..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
                <input
                  type={showAdminPasswords ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm new password..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0f2537] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setModalError(null);
                  }}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Update Admin Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
