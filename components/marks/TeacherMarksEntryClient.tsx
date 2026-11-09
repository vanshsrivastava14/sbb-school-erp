"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SchoolClass,
  Section,
  Student,
  Subject,
  ClassSubject,
  MarksEntry,
  AcademicSession,
} from "@/lib/db/types";
import { saveMarksAction, submitClassMarksAction } from "@/app/actions/marks";
import {
  calculateTerm1Total,
  calculateTerm2Total,
  calculateGrandTotal,
  calculateSubjectGrade,
  calculateOverallPercentage,
  getGradeFromPercentage,
} from "@/lib/grading";
import {
  Save,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ClipboardEdit,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";

interface TeacherMarksEntryClientProps {
  assignedClasses: SchoolClass[];
  allStudents: Student[];
  classSubjects: (ClassSubject & { subject: Subject })[];
  existingMarks: MarksEntry[];
  currentSession: AcademicSession;
  initialClassId?: string;
  initialStudentId?: string;
}

export default function TeacherMarksEntryClient({
  assignedClasses,
  allStudents,
  classSubjects,
  existingMarks,
  currentSession,
  initialClassId,
  initialStudentId,
}: TeacherMarksEntryClientProps) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || assignedClasses[0]?.id || ""
  );

  const studentsInClass = useMemo(() => {
    return allStudents.filter((s) => s.classId === selectedClassId && s.isActive);
  }, [allStudents, selectedClassId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || studentsInClass[0]?.id || ""
  );
  const [studentSearch, setStudentSearch] = useState("");

  const currentStudent = useMemo(() => {
    return studentsInClass.find((s) => s.id === selectedStudentId) || studentsInClass[0] || null;
  }, [studentsInClass, selectedStudentId]);

  // Scholastic & Co-scholastic subjects for the selected class
  const currentClassSubjects = useMemo(() => {
    return classSubjects.filter((cs) => cs.classId === selectedClassId);
  }, [classSubjects, selectedClassId]);

  const scholasticSubjects = currentClassSubjects.filter((cs) => cs.subject.type === "scholastic");
  const coScholasticSubjects = currentClassSubjects.filter((cs) => cs.subject.type === "co_scholastic");

  // Local state for the selected student's marks
  const [marksState, setMarksState] = useState<Record<string, {
    ut1?: number | null;
    halfYearly?: number | null;
    ut2?: number | null;
    annual?: number | null;
    coGrade?: string | null;
  }>>(() => {
    const initial: Record<string, any> = {};
    existingMarks.forEach((m) => {
      initial[`${m.studentId}_${m.subjectId}`] = {
        ut1: m.ut1Marks,
        halfYearly: m.halfYearlyMarks,
        ut2: m.ut2Marks,
        annual: m.annualMarks,
        coGrade: m.coScholasticGrade,
      };
    });
    return initial;
  });

  // Keep marksState synced whenever existingMarks changes from server
  useEffect(() => {
    const updated: Record<string, any> = {};
    existingMarks.forEach((m) => {
      updated[`${m.studentId}_${m.subjectId}`] = {
        ut1: m.ut1Marks,
        halfYearly: m.halfYearlyMarks,
        ut2: m.ut2Marks,
        annual: m.annualMarks,
        coGrade: m.coScholasticGrade,
      };
    });
    setMarksState((prev) => ({ ...updated, ...prev }));
  }, [existingMarks]);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const newStudents = allStudents.filter((s) => s.classId === newClassId && s.isActive);
    if (newStudents.length > 0) {
      setSelectedStudentId(newStudents[0].id);
    } else {
      setSelectedStudentId("");
    }
    router.push(`/teacher/marks?classId=${newClassId}`);
  };

  const handleMarkChange = (
    subjectId: string,
    field: "ut1" | "halfYearly" | "ut2" | "annual",
    valStr: string,
    maxVal: number
  ) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}_${subjectId}`;

    let val: number | null = valStr === "" ? null : Number(valStr);
    if (val !== null) {
      if (isNaN(val)) return;
      if (val < 0) val = 0;
      if (val > maxVal) val = maxVal; // Prevent exceeding max marks
    }

    setMarksState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
  };

  const handleCoGradeChange = (subjectId: string, grade: string) => {
    if (!currentStudent) return;
    const key = `${currentStudent.id}_${subjectId}`;
    setMarksState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        coGrade: grade,
      },
    }));
  };

  // Compute live totals for current student
  const studentTotals = useMemo(() => {
    if (!currentStudent) return { totalObtained: 0, totalMax: 0, percentage: 0, grade: "-" };
    let totalObtained = 0;
    let totalMax = 0;

    scholasticSubjects.forEach((cs) => {
      const key = `${currentStudent.id}_${cs.subjectId}`;
      const m = marksState[key] || {};
      const grandTotal = calculateGrandTotal(m.ut1, m.halfYearly, m.ut2, m.annual);
      const subjectMax = cs.maxUt1 + cs.maxHalfYearly + cs.maxUt2 + cs.maxAnnual;
      totalObtained += grandTotal;
      totalMax += subjectMax;
    });

    const percentage = calculateOverallPercentage(totalObtained, totalMax);
    const grade = getGradeFromPercentage(percentage);
    return { totalObtained, totalMax, percentage, grade };
  }, [currentStudent, scholasticSubjects, marksState]);

  // Save marks for current student
  const handleSaveMarks = (status: "draft" | "submitted") => {
    if (!currentStudent) return;
    setNotification(null);

    if (currentClassSubjects.length === 0) {
      setNotification({
        type: "error",
        text: "No subjects configured for this class yet. Please contact administrator.",
      });
      return;
    }

    const entriesToSave = currentClassSubjects.map((cs) => {
      const key = `${currentStudent.id}_${cs.subjectId}`;
      const m = marksState[key] || {};
      return {
        studentId: currentStudent.id,
        subjectId: cs.subjectId,
        academicSessionId: currentSession.id,
        ut1Marks: m.ut1 !== undefined ? m.ut1 : null,
        halfYearlyMarks: m.halfYearly !== undefined ? m.halfYearly : null,
        ut2Marks: m.ut2 !== undefined ? m.ut2 : null,
        annualMarks: m.annual !== undefined ? m.annual : null,
        coScholasticGrade: m.coGrade !== undefined ? m.coGrade : null,
        status,
      };
    });

    startTransition(async () => {
      const res = await saveMarksAction(entriesToSave);
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({
          type: "success",
          text: `Marks for ${currentStudent.studentName} saved as ${status.toUpperCase()}!`,
        });
        router.refresh();
      }
    });
  };

  // Submit entire class for admin review
  const handleSubmitClass = () => {
    if (!confirm("Are you sure you want to submit all class marks for administrator approval?")) return;
    setNotification(null);

    startTransition(async () => {
      const res = await submitClassMarksAction(selectedClassId, "sec-a");
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({
          type: "success",
          text: "All class marks have been submitted for administrator approval!",
        });
      }
    });
  };

  const filteredStudents = studentsInClass.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.studentName.toLowerCase().includes(q) || s.admissionNo.includes(q) || String(s.rollNo).includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Class Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Teacher Marks Entry & Evaluation</h1>
          <p className="text-xs text-slate-500">
            Select student, enter examination scores with instant calculations, and submit for admin publication.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2537] focus:outline-none focus:ring-2 focus:ring-[#0f2537]"
            >
              {assignedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Sec A)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmitClass}
            disabled={isPending}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition ml-auto disabled:opacity-50"
            title="Submit all marks in this class for administrator approval"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Class Results</span>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Main Workspace: Left Student Drawer + Right Marks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Student Selector Drawer */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-[700px]">
          <div className="pb-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Students ({studentsInClass.length})
              </span>
              <span className="text-[10px] text-slate-400">Click to enter marks</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f2537]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No students found in this class.
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = s.id === currentStudent?.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition ${
                      isSelected
                        ? "bg-[#0f2537] text-white shadow-xs"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected ? "bg-amber-400 text-[#0f2537]" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.rollNo}
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase truncate max-w-[150px] ${isSelected ? "text-white" : "text-slate-800"}`}>
                          {s.studentName}
                        </p>
                        <p className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                          S.R. No: {s.admissionNo}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-slate-300"}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Student Marks Entry Sheet */}
        <div className="lg:col-span-8 space-y-4">
          {currentStudent ? (
            <>
              {/* Student Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-lg">
                    {currentStudent.rollNo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#0f2537] uppercase">{currentStudent.studentName}</h2>
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[11px] font-semibold">
                        S.R. No: {currentStudent.admissionNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Father: <strong>{currentStudent.fatherName}</strong> • Mother: <strong>{currentStudent.motherName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/teacher/reports/${currentStudent.id}`}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>View Report Card</span>
                  </Link>
                </div>
              </div>

              {/* Scholastic Marks Entry Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scholastic Areas Marks Entry
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Auto-validates against Max Marks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-2 text-center">U.T-1 (25)</th>
                        <th className="py-2.5 px-2 text-center">Half Yearly (100/50)</th>
                        <th className="py-2.5 px-2 text-center bg-slate-200/50">Term-1 (125)</th>
                        <th className="py-2.5 px-2 text-center">U.T-2 (25)</th>
                        <th className="py-2.5 px-2 text-center">Annual Exam (100/50)</th>
                        <th className="py-2.5 px-2 text-center bg-slate-200/50">Term-2 (125)</th>
                        <th className="py-2.5 px-2 text-center bg-amber-100/50 font-bold">Grand Total</th>
                        <th className="py-2.5 px-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scholasticSubjects.map((cs) => {
                        const key = `${currentStudent.id}_${cs.subjectId}`;
                        const m = marksState[key] || {};
                        const term1 = calculateTerm1Total(m.ut1, m.halfYearly);
                        const term2 = calculateTerm2Total(m.ut2, m.annual);
                        const grandTotal = calculateGrandTotal(m.ut1, m.halfYearly, m.ut2, m.annual);
                        const maxSubject = cs.maxUt1 + cs.maxHalfYearly + cs.maxUt2 + cs.maxAnnual;
                        const grade = calculateSubjectGrade(grandTotal, maxSubject);

                        return (
                          <tr key={cs.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {cs.subject.name}
                              <div className="text-[10px] text-slate-400 font-normal">
                                Max: {maxSubject}
                              </div>
                            </td>

                            {/* U.T-1 (Max 25) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={cs.maxUt1}
                                value={m.ut1 ?? ""}
                                onChange={(e) => handleMarkChange(cs.subjectId, "ut1", e.target.value, cs.maxUt1)}
                                placeholder="0-25"
                                className="w-16 p-1.5 text-center text-xs border border-slate-200 rounded-md font-mono focus:ring-2 focus:ring-[#0f2537] focus:outline-none"
                              />
                            </td>

                            {/* Half Yearly (Max 100 or 50) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={cs.maxHalfYearly}
                                value={m.halfYearly ?? ""}
                                onChange={(e) => handleMarkChange(cs.subjectId, "halfYearly", e.target.value, cs.maxHalfYearly)}
                                placeholder={`0-${cs.maxHalfYearly}`}
                                className="w-16 p-1.5 text-center text-xs border border-slate-200 rounded-md font-mono focus:ring-2 focus:ring-[#0f2537] focus:outline-none"
                              />
                            </td>

                            {/* Term-1 Total (Calculated) */}
                            <td className="py-2 px-2 text-center bg-slate-100/60 font-mono font-bold text-slate-700">
                              {term1}
                            </td>

                            {/* U.T-2 (Max 25) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={cs.maxUt2}
                                value={m.ut2 ?? ""}
                                onChange={(e) => handleMarkChange(cs.subjectId, "ut2", e.target.value, cs.maxUt2)}
                                placeholder="0-25"
                                className="w-16 p-1.5 text-center text-xs border border-slate-200 rounded-md font-mono focus:ring-2 focus:ring-[#0f2537] focus:outline-none"
                              />
                            </td>

                            {/* Annual Exam (Max 100 or 50) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min={0}
                                max={cs.maxAnnual}
                                value={m.annual ?? ""}
                                onChange={(e) => handleMarkChange(cs.subjectId, "annual", e.target.value, cs.maxAnnual)}
                                placeholder={`0-${cs.maxAnnual}`}
                                className="w-16 p-1.5 text-center text-xs border border-slate-200 rounded-md font-mono focus:ring-2 focus:ring-[#0f2537] focus:outline-none"
                              />
                            </td>

                            {/* Term-2 Total (Calculated) */}
                            <td className="py-2 px-2 text-center bg-slate-100/60 font-mono font-bold text-slate-700">
                              {term2}
                            </td>

                            {/* Grand Total */}
                            <td className="py-2 px-2 text-center bg-amber-50 font-mono font-extrabold text-[#0f2537]">
                              {grandTotal}
                            </td>

                            {/* Grade */}
                            <td className="py-2 px-2 text-center font-bold text-slate-800">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Cumulative Total Row */}
                      <tr className="bg-amber-50/70 font-bold border-t-2 border-slate-200 text-slate-800">
                        <td className="py-3 px-3 uppercase text-xs">Total Summary</td>
                        <td colSpan={6} className="py-3 px-3 text-right text-xs">
                          Overall Score:
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-sm text-[#0f2537] font-extrabold">
                          {studentTotals.totalObtained} / {studentTotals.totalMax}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-2.5 py-1 bg-[#0f2537] text-white rounded font-bold text-xs">
                            {studentTotals.grade} ({studentTotals.percentage}%)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Co-Scholastic Areas */}
              {coScholasticSubjects.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Co-Scholastic Areas (Grades: A1, A2, B1, B2, C1, C2, D, E, -)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {coScholasticSubjects.map((cs) => {
                      const key = `${currentStudent.id}_${cs.subjectId}`;
                      const m = marksState[key] || {};
                      const grade = m.coGrade || "-";

                      return (
                        <div key={cs.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                          <label className="block text-[11px] font-bold text-slate-700">{cs.subject.name}</label>
                          <select
                            value={grade}
                            onChange={(e) => handleCoGradeChange(cs.subjectId, e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold focus:ring-1 focus:ring-[#0f2537]"
                          >
                            <option value="-">-</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Status: <strong>Editing for {currentStudent.studentName}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveMarks("draft")}
                    disabled={isPending}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => handleSaveMarks("submitted")}
                    disabled={isPending}
                    className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                    <span>Save & Mark Complete</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a student from the left panel to begin marks entry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
