"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  SchoolClass,
  Student,
  Subject,
  ClassSubject,
  MarksEntry,
  ReportCard,
} from "@/lib/db/types";
import {
  approveClassMarksAction,
  publishClassReportCardsAction,
} from "@/app/actions/marks";
import {
  calculateGrandTotal,
  calculateSubjectGrade,
  calculateOverallPercentage,
  getGradeFromPercentage,
} from "@/lib/grading";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Award,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";

interface AdminMarksReviewClientProps {
  classes: SchoolClass[];
  allStudents: Student[];
  allMarks: MarksEntry[];
  classSubjects: (ClassSubject & { subject: Subject })[];
  reportCards: ReportCard[];
}

export default function AdminMarksReviewClient({
  classes,
  allStudents,
  allMarks,
  classSubjects,
  reportCards,
}: AdminMarksReviewClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const studentsInClass = useMemo(() => {
    return allStudents.filter((s) => s.classId === selectedClassId && s.isActive);
  }, [allStudents, selectedClassId]);

  const currentClassSubjects = useMemo(() => {
    return classSubjects.filter((cs) => cs.classId === selectedClassId && cs.subject.type === "scholastic");
  }, [classSubjects, selectedClassId]);

  // Compute student summary rows
  const studentsSummary = useMemo(() => {
    return studentsInClass.map((student) => {
      const studentMarks = allMarks.filter((m) => m.studentId === student.id);
      let totalObtained = 0;
      let totalMax = 0;
      let isSubmitted = false;
      let isPublished = false;

      currentClassSubjects.forEach((cs) => {
        const m = studentMarks.find((mark) => mark.subjectId === cs.subjectId);
        if (m) {
          if (m.status === "submitted") isSubmitted = true;
          if (m.status === "published" || m.status === "approved") isPublished = true;
          totalObtained += calculateGrandTotal(m.ut1Marks, m.halfYearlyMarks, m.ut2Marks, m.annualMarks);
        }
        totalMax += cs.maxUt1 + cs.maxHalfYearly + cs.maxUt2 + cs.maxAnnual;
      });

      const percentage = calculateOverallPercentage(totalObtained, totalMax);
      const grade = getGradeFromPercentage(percentage);
      const rc = reportCards.find((r) => r.studentId === student.id);

      return {
        student,
        totalObtained,
        totalMax,
        percentage,
        grade,
        classRank: rc?.classRank || "-",
        isSubmitted,
        isPublished,
        hasReportCard: !!rc,
      };
    });
  }, [studentsInClass, allMarks, currentClassSubjects, reportCards]);

  const handleApprove = () => {
    if (!confirm("Approve all marks for this class?")) return;
    setNotification(null);
    startTransition(async () => {
      const res = await approveClassMarksAction(selectedClassId, "sec-a");
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Class marks approved!" });
        window.location.reload();
      }
    });
  };

  const handlePublish = () => {
    if (!confirm("Publish official report cards for all students in this class? This will finalize ranks and generate printable cards.")) return;
    setNotification(null);
    startTransition(async () => {
      const res = await publishClassReportCardsAction(selectedClassId, "sec-a");
      if (res.error) {
        setNotification({ type: "error", text: res.error });
      } else {
        setNotification({ type: "success", text: res.message || "Report cards published successfully!" });
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0f2537] font-serif">Examination Results & Marks Verification</h1>
          <p className="text-xs text-slate-500">
            Review teacher submissions, verify scores, approve results, and publish official report cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2537] focus:outline-none focus:ring-2 focus:ring-[#0f2537]"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Sec A)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleApprove}
            disabled={isPending}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Marks</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPending}
            className="px-4 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-amber-300 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition border border-amber-400/40 disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Publish Report Cards</span>
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

      {/* Class Student Marks Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Class Roster Results ({studentsSummary.length} Students)
          </span>
          <span className="text-xs text-slate-500">
            Term 1 + Term 2 Cumulative Grand Totals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">Roll</th>
                <th className="py-3 px-3">Admission / S.R.</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3 text-center">Grand Total</th>
                <th className="py-3 px-3 text-center">Percentage</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsSummary.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No students enrolled in this class yet. Click &quot;Manage Students&quot; to load student records.
                  </td>
                </tr>
              ) : (
                studentsSummary.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center font-bold text-slate-700 bg-slate-50/50">
                      {item.student.rollNo}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#0f2537]">
                      {item.student.admissionNo}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 uppercase">
                      {item.student.studentName}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {item.totalObtained} / {item.totalMax}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {item.percentage}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[11px]">
                        {item.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700">
                      #{item.classRank}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.isPublished ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                          Published
                        </span>
                      ) : item.isSubmitted ? (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-bold">
                          Submitted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                          Draft / Unsubmitted
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/reports/${item.student.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-xs font-semibold transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        <span>View Card</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
