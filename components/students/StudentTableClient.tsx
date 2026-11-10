"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Student,
  SchoolClass,
  Section,
} from "@/lib/db/types";
import {
  importReferenceDatasetAction,
  uploadStudentsAction,
  createStudentAction,
  updateStudentAction,
  archiveStudentAction,
} from "@/app/actions/students";
import {
  Search,
  Filter,
  FileSpreadsheet,
  Upload,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  RefreshCw,
} from "lucide-react";

interface StudentTableClientProps {
  initialStudents: Student[];
  classes: SchoolClass[];
  sections: Section[];
}

export default function StudentTableClient({
  initialStudents,
  classes,
  sections,
}: StudentTableClientProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Filter students
  const filtered = students.filter((s) => {
    if (selectedClass !== "all" && s.classId !== selectedClass) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        (s.mobile && s.mobile.includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageIndex = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls?.name || classId;
  };

  // One-click import reference dataset handler
  const handleImportReference = () => {
    setNotification(null);
    startTransition(async () => {
      const res = await importReferenceDatasetAction();
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Reference dataset imported successfully!" });
        window.location.reload();
      }
    });
  };

  // Handle custom upload form
  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await uploadStudentsAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Excel file imported successfully!" });
        setIsUploadOpen(false);
        window.location.reload();
      }
    });
  };

  // Handle add student form
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createStudentAction(formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Student added!" });
        setIsAddOpen(false);
        window.location.reload();
      }
    });
  };

  // Handle edit student form
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await updateStudentAction(editingStudent.id, formData);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Student updated!" });
        setEditingStudent(null);
        window.location.reload();
      }
    });
  };

  // Handle archive student
  const handleArchive = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to archive student ${name}?`)) return;
    startTransition(async () => {
      const res = await archiveStudentAction(studentId);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: "Student archived." });
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Student Information Management</h1>
          <p className="text-xs text-slate-500">
            {students.length} Total Registered Students • Showing {filtered.length} matching filters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImportReference}
            disabled={isPending}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            title="Import all 410 students directly from reference/student data.xlsx"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isPending ? "animate-spin" : ""}`} />
            <span>Load Reference Dataset (410)</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Excel</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by student name, admission no (S.R.), father's name, or mobile..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2537] transition"
          />
        </div>

        <div className="sm:col-span-4 relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2537] transition appearance-none cursor-pointer"
          >
            <option value="all">All Classes ({students.length})</option>
            {classes.map((cls) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              return (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-14">Roll</th>
                <th className="py-3 px-3.5">Admission / S.R.</th>
                <th className="py-3 px-3.5">Student Name</th>
                <th className="py-3 px-3.5">Class & Section</th>
                <th className="py-3 px-3.5">Parents / Guardian</th>
                <th className="py-3 px-3.5">Contact & Address</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-3.5 text-center font-bold text-slate-600 bg-slate-50/40">
                      {student.rollNo}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-[#0f2537]">
                      {student.admissionNo}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-800 uppercase">{student.studentName}</div>
                      <div className="text-[10px] text-slate-400">DOB: {student.dob} • {student.gender}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded font-semibold text-[11px]">
                        {getClassName(student.classId)}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="text-slate-700 font-medium">{student.fatherName}</div>
                      <div className="text-[10px] text-slate-400">{student.motherName}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="text-slate-700 font-mono">{student.mobile || "—"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{student.address}</div>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/reports/${student.id}`}
                          title="View Official Report Card"
                          className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingStudent(student)}
                          title="Edit Details"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(student.id, student.studentName)}
                          title="Archive Student"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page {pageIndex} of {totalPages} ({filtered.length} total students)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pageIndex <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">{pageIndex}</span>
              <button
                disabled={pageIndex >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Upload Student Data Spreadsheet</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Upload an Excel (.xlsx, .xls) or CSV file with school student records. Columns like AdmissionNo, Student, Class, Father, Mother will be automatically mapped.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <input
                type="file"
                name="excelFile"
                accept=".xlsx,.xls,.csv"
                required
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {isPending ? "Processing..." : "Import File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Register New Student</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Admission No (S.R.) *</label>
                  <input
                    type="text"
                    name="admissionNo"
                    required
                    placeholder="e.g. 1501"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Roll Number</label>
                  <input
                    type="number"
                    name="rollNo"
                    defaultValue={1}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Student Full Name *</label>
                <input
                  type="text"
                  name="studentName"
                  required
                  placeholder="e.g. AARAV KUMAR"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Class *</label>
                  <select name="classId" required className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Gender *</label>
                  <select name="gender" className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Father&apos;s Name *</label>
                  <input
                    type="text"
                    name="fatherName"
                    required
                    placeholder="MR. ..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mother&apos;s Name *</label>
                  <input
                    type="text"
                    name="motherName"
                    required
                    placeholder="MRS. ..."
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="text"
                    name="dob"
                    placeholder="DD/MM/YYYY"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="10-digit mobile"
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Residential Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="KUNDA PRATAPGARH"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Edit Student Record</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Admission No (S.R.)</label>
                  <input
                    type="text"
                    name="admissionNo"
                    defaultValue={editingStudent.admissionNo}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Roll Number</label>
                  <input
                    type="number"
                    name="rollNo"
                    defaultValue={editingStudent.rollNo}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  name="studentName"
                  defaultValue={editingStudent.studentName}
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Class</label>
                  <select
                    name="classId"
                    defaultValue={editingStudent.classId}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Gender</label>
                  <select
                    name="gender"
                    defaultValue={editingStudent.gender}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Father&apos;s Name</label>
                  <input
                    type="text"
                    name="fatherName"
                    defaultValue={editingStudent.fatherName}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mother&apos;s Name</label>
                  <input
                    type="text"
                    name="motherName"
                    defaultValue={editingStudent.motherName}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="text"
                    name="dob"
                    defaultValue={editingStudent.dob}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    defaultValue={editingStudent.mobile}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingStudent.address}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
