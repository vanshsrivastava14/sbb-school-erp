"use client";

import { useState, useMemo } from "react";
import { SchoolClass, Student, Subject, ClassSubject } from "@/lib/db/types";
import { Printer, ClipboardList, Users } from "lucide-react";

type ExamKey = "ut1" | "half_yearly" | "ut2" | "annual";

const EXAMS: {
  key: ExamKey;
  title: string;
  maxField: "maxUt1" | "maxHalfYearly" | "maxUt2" | "maxAnnual";
}[] = [
  { key: "ut1", title: "UT - 1", maxField: "maxUt1" },
  { key: "half_yearly", title: "HALF YEARLY", maxField: "maxHalfYearly" },
  { key: "ut2", title: "UT - 2", maxField: "maxUt2" },
  { key: "annual", title: "ANNUAL", maxField: "maxAnnual" },
];

interface MarksFillingSheetClientProps {
  classes: SchoolClass[];
  students: Student[];
  classSubjects: (ClassSubject & { subject: Subject })[];
  sessionLabel: string;
  isAdmin?: boolean;
  initialClassId?: string;
}

export default function MarksFillingSheetClient({
  classes,
  students,
  classSubjects,
  sessionLabel,
  isAdmin = false,
  initialClassId,
}: MarksFillingSheetClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || classes[0]?.id || ""
  );
  const [selectedExam, setSelectedExam] = useState<ExamKey | "all">("half_yearly");
  const [sortBy, setSortBy] = useState<"name" | "roll">("name");
  const [showMaxMarks, setShowMaxMarks] = useState<boolean>(true);
  const [extraBlankRows, setExtraBlankRows] = useState<number>(0);

  const targetClasses = useMemo(() => {
    if (selectedClassId === "__ALL__") return classes;
    return classes.filter((c) => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  const targetExams = useMemo(() => {
    if (selectedExam === "all") return EXAMS;
    return EXAMS.filter((e) => e.key === selectedExam);
  }, [selectedExam]);

  const sheetPairs = useMemo(() => {
    const pairs: { cls: SchoolClass; exam: (typeof EXAMS)[number] }[] = [];
    for (const cls of targetClasses) {
      for (const exam of targetExams) {
        pairs.push({ cls, exam });
      }
    }
    return pairs;
  }, [targetClasses, targetExams]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 print:space-y-0">
      {/* Control Toolbar (Hidden in Print) */}
      <div className="no-print print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f2537] font-serif">
                Exam Marks Filling Sheets (Printable Register)
              </h1>
              <p className="text-xs text-slate-500">
                Official blank marks-filling sheets for UT-1, Half Yearly, UT-2, and Annual examinations across every class.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0f2537] hover:bg-[#183e60] text-amber-300 text-xs font-bold rounded-lg flex items-center gap-2 transition shadow-xs border border-amber-400/40"
          >
            <Printer className="w-4 h-4" />
            <span>
              Print / Save PDF ({sheetPairs.length} {sheetPairs.length === 1 ? "Sheet" : "Sheets"})
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2537] focus:outline-none focus:ring-2 focus:ring-[#0f2537]"
            >
              {isAdmin && classes.length > 1 && (
                <option value="__ALL__">All {classes.length} Classes (Complete Packet)</option>
              )}
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id && s.isActive).length;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({count} students)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Exam Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {EXAMS.map((ex) => (
              <button
                key={ex.key}
                type="button"
                onClick={() => setSelectedExam(ex.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  selectedExam === ex.key
                    ? "bg-[#0f2537] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {ex.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedExam("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                selectedExam === "all"
                  ? "bg-[#0f2537] text-amber-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All 4 Exams
            </button>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "roll")}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="name">Alphabetical (A–Z)</option>
              <option value="roll">Roll No. (1–N)</option>
            </select>
          </div>

          {/* Extra Blank Rows */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Extra Blank Rows:</span>
            <select
              value={extraBlankRows}
              onChange={(e) => setExtraBlankRows(Number(e.target.value))}
              className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value={0}>0</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>

          {/* Max Marks Toggle */}
          <label className="text-xs text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showMaxMarks}
              onChange={(e) => setShowMaxMarks(e.target.checked)}
              className="rounded text-[#0f2537]"
            />
            <span>Show Max Marks</span>
          </label>
        </div>
      </div>

      {/* Rendered Sheets Container */}
      <div className="space-y-6 print:space-y-0">
        {sheetPairs.map(({ cls, exam }) => {
          const classStudents = students
            .filter((s) => s.classId === cls.id && s.isActive)
            .sort((a, b) => {
              if (sortBy === "roll") {
                const ra = a.rollNo > 0 ? a.rollNo : 99999;
                const rb = b.rollNo > 0 ? b.rollNo : 99999;
                return ra - rb || a.studentName.localeCompare(b.studentName);
              }
              return a.studentName.localeCompare(b.studentName);
            });

          const subjectsForClass = classSubjects
            .filter((cs) => cs.classId === cls.id)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          const scholastic = subjectsForClass.filter((cs) => cs.subject.type === "scholastic");
          const coScholastic = subjectsForClass.filter((cs) => cs.subject.type === "co_scholastic");
          const totalCols = 3 + scholastic.length + coScholastic.length + 2;

          return (
            <div
              key={`${cls.id}_${exam.key}`}
              className="marks-filling-sheet bg-white border border-slate-200 shadow-xs p-5 print:p-0 print:border-none print:shadow-none"
            >
              <div className="no-print print:hidden flex items-center justify-between text-[11px] text-slate-500 pb-2 mb-3 border-b border-slate-100">
                <span className="font-bold text-[#0f2537]">
                  Preview: Class {cls.name} — {exam.title}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {classStudents.length} Students
                </span>
              </div>

              <table
                className="marks-filling-table w-full border-collapse text-black"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                <thead>
                  {/* School Banner repeated on every printed page */}
                  <tr>
                    <td colSpan={totalCols} className="p-0 pb-1.5 border-0">
                      <div className="border border-black text-center py-1 px-2">
                        <div className="text-[14px] font-bold uppercase tracking-wide leading-tight">
                          SBB CHILDREN SCHOOL
                        </div>
                        <div className="text-[9.5px] font-bold leading-tight mt-0.5">
                          GANDHI NAGAR KUNDA PBH. 9451275030, 9792066753
                        </div>
                      </div>
                      <div className="border-x border-b border-black px-2 py-0.5 text-[10px] font-bold flex items-center justify-between bg-slate-50 print:bg-transparent">
                        <span>Marks Filling Sheet : Academic Session - {sessionLabel}</span>
                        <span>Class: {cls.name} (Sec A)</span>
                      </div>
                    </td>
                  </tr>

                  {/* Top Group Header Row matching official sheet */}
                  <tr className="text-[9.5px] font-bold bg-slate-100 print:bg-transparent">
                    <th colSpan={3} className="border border-black px-1.5 py-1 text-center leading-tight">
                      <div>Class</div>
                      <div className="text-[10.5px]">{cls.name}</div>
                      <div className="text-[9px] font-semibold">Section A</div>
                    </th>
                    {scholastic.length > 0 && (
                      <th
                        colSpan={scholastic.length}
                        className="border border-black px-1.5 py-1 text-center text-[11px] uppercase tracking-wider"
                      >
                        {exam.title}
                      </th>
                    )}
                    {coScholastic.length > 0 && (
                      <th
                        colSpan={coScholastic.length}
                        className="border border-black px-1 py-1 text-center"
                      >
                        Part 2
                      </th>
                    )}
                    <th colSpan={2} className="border border-black px-1 py-1 text-center">
                      Remarks
                    </th>
                  </tr>

                  {/* Individual Subject Columns Row */}
                  <tr className="text-[8.5px] font-bold bg-slate-50 print:bg-transparent">
                    <th className="border border-black px-1 py-1 text-center w-[32px]">
                      Roll<br />No.
                    </th>
                    <th className="border border-black px-1 py-1 text-center w-[48px]">
                      Adm.<br />No.
                    </th>
                    <th className="border border-black px-1.5 py-1 text-left min-w-[115px]">
                      Student Name
                    </th>
                    {scholastic.map((cs) => (
                      <th key={cs.id} className="border border-black px-1 py-1 text-center leading-tight">
                        <div>{cs.subject.name}</div>
                        {showMaxMarks && (
                          <div className="text-[7.5px] font-normal text-slate-600 print:text-black">
                            ({cs[exam.maxField]})
                          </div>
                        )}
                      </th>
                    ))}
                    {coScholastic.map((cs) => (
                      <th key={cs.id} className="border border-black px-1 py-1 text-center leading-tight">
                        <div>{cs.subject.name}</div>
                        {showMaxMarks && (
                          <div className="text-[7.5px] font-normal text-slate-600 print:text-black">
                            (Gr)
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="border border-black px-1 py-1 text-center w-[52px]">
                      Attendance
                    </th>
                    <th className="border border-black px-1 py-1 text-center w-[46px]">
                      Position
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {classStudents.map((s) => (
                    <tr key={s.id} className="text-[9px]">
                      <td className="border border-black px-1 py-1.5 text-center font-semibold">
                        {s.rollNo > 0 ? s.rollNo : ""}
                      </td>
                      <td className="border border-black px-1 py-1.5 text-center font-mono text-[8.5px]">
                        {s.admissionNo}
                      </td>
                      <td className="border border-black px-1.5 py-1.5 text-left font-semibold uppercase leading-tight">
                        {s.studentName}
                      </td>
                      {scholastic.map((cs) => (
                        <td key={cs.id} className="border border-black px-1 py-1.5 min-w-[38px]" />
                      ))}
                      {coScholastic.map((cs) => (
                        <td key={cs.id} className="border border-black px-1 py-1.5 min-w-[30px]" />
                      ))}
                      <td className="border border-black px-1 py-1.5" />
                      <td className="border border-black px-1 py-1.5" />
                    </tr>
                  ))}

                  {Array.from({ length: extraBlankRows }).map((_, idx) => (
                    <tr key={`blank-${idx}`} className="text-[9px]">
                      <td className="border border-black px-1 py-2.5">&nbsp;</td>
                      <td className="border border-black px-1 py-2.5" />
                      <td className="border border-black px-1.5 py-2.5" />
                      {scholastic.map((cs) => (
                        <td key={cs.id} className="border border-black px-1 py-2.5" />
                      ))}
                      {coScholastic.map((cs) => (
                        <td key={cs.id} className="border border-black px-1 py-2.5" />
                      ))}
                      <td className="border border-black px-1 py-2.5" />
                      <td className="border border-black px-1 py-2.5" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
