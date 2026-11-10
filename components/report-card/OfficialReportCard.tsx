"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Student,
  SchoolClass,
  Subject,
  ClassSubject,
  MarksEntry,
  ReportCard,
} from "@/lib/db/types";
import {
  calculateTerm1Total,
  calculateTerm2Total,
  calculateGrandTotal,
  calculateSubjectGrade,
  calculateOverallPercentage,
  getGradeFromPercentage,
  OFFICIAL_GRADE_SCALE,
} from "@/lib/grading";
import { Printer, Download, ArrowLeft, ShieldCheck, Edit3, X, Check } from "lucide-react";

interface OfficialReportCardProps {
  student: Student;
  schoolClass: SchoolClass;
  scholasticSubjects: (ClassSubject & { subject: Subject })[];
  coScholasticSubjects: (ClassSubject & { subject: Subject })[];
  marks: MarksEntry[];
  reportCard: ReportCard | null;
  teacherName?: string;
  onUpdateMetadata?: (metadata: {
    attendanceDays: number;
    totalAttendanceDays: number;
    teacherRemark: string;
    resultDate: string;
  }) => void;
  backHref?: string;
}

export default function OfficialReportCard({
  student,
  schoolClass,
  scholasticSubjects,
  coScholasticSubjects,
  marks,
  reportCard,
  teacherName = "Swati",
  onUpdateMetadata,
  backHref,
}: OfficialReportCardProps) {
  // Local editable metadata (Attendance, remarks, date)
  const [attendanceDays, setAttendanceDays] = useState(reportCard?.attendanceDays ?? 138);
  const [totalAttendanceDays, setTotalAttendanceDays] = useState(reportCard?.totalAttendanceDays ?? 200);
  const [teacherRemark, setTeacherRemark] = useState(reportCard?.teacherRemark || "Good");
  const [resultDate, setResultDate] = useState(reportCard?.resultDate || "04/04/2026");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);

  // Compute Subject Rows
  let cumulativeTerm1Total = 0;
  let cumulativeHalfYearly = 0;
  let cumulativeUt1 = 0;
  let cumulativeUt2 = 0;
  let cumulativeAnnual = 0;
  let cumulativeTerm2Total = 0;
  let cumulativeGrandTotal = 0;
  let cumulativeMaxMarks = 0;

  const subjectData = scholasticSubjects.map((cs) => {
    const m = marks.find((mark) => mark.subjectId === cs.subjectId);
    const ut1 = m?.ut1Marks ?? 0;
    const halfYearly = m?.halfYearlyMarks ?? 0;
    const term1 = calculateTerm1Total(m?.ut1Marks, m?.halfYearlyMarks);

    const ut2 = m?.ut2Marks ?? 0;
    const annual = m?.annualMarks ?? 0;
    const term2 = calculateTerm2Total(m?.ut2Marks, m?.annualMarks);

    const grandTotal = calculateGrandTotal(m?.ut1Marks, m?.halfYearlyMarks, m?.ut2Marks, m?.annualMarks);
    const maxSubjectMarks = cs.maxUt1 + cs.maxHalfYearly + cs.maxUt2 + cs.maxAnnual;
    const grade = calculateSubjectGrade(grandTotal, maxSubjectMarks);

    cumulativeUt1 += ut1;
    cumulativeHalfYearly += halfYearly;
    cumulativeTerm1Total += term1;

    cumulativeUt2 += ut2;
    cumulativeAnnual += annual;
    cumulativeTerm2Total += term2;

    cumulativeGrandTotal += grandTotal;
    cumulativeMaxMarks += maxSubjectMarks;

    return {
      name: cs.subject.name,
      code: cs.subject.code,
      maxUt1: cs.maxUt1,
      maxHalfYearly: cs.maxHalfYearly,
      maxUt2: cs.maxUt2,
      maxAnnual: cs.maxAnnual,
      maxSubjectMarks,
      ut1,
      halfYearly,
      term1,
      ut2,
      annual,
      term2,
      grandTotal,
      grade,
    };
  });

  const overallPercentage = calculateOverallPercentage(cumulativeGrandTotal, cumulativeMaxMarks);
  const overallGrade = reportCard?.grade || getGradeFromPercentage(overallPercentage);
  const classRank = reportCard?.classRank || 24;
  const resultStatus = reportCard?.resultStatus || (overallPercentage >= 33 ? "PASSED" : "FAILED");

  // Chart Dimensions & Calculations
  const chartMax = 125;
  const chartHeight = 110;
  const chartWidth = 560;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar (Hidden during Print) */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {backHref && (
            <a
              href={backHref}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </a>
          )}
          <span className="text-xs font-bold text-[#0f2537]">
            Official Report Card • {student.studentName} ({schoolClass.name} - Sec A)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer mr-2">
            <input
              type="checkbox"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="rounded text-[#0f2537]"
            />
            <span>Official Hologram Seal</span>
          </label>

          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Attendance / Remarks</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official A4 Card</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          THE OFFICIAL S.B.B. CHILDREN SCHOOL REPORT CARD CONTAINER
          Double Border: Outer Gold, Inner Navy Blue.
          Exact replica of WhatsApp Image 2026-11-09 at 10.06.39 PM (1).jpeg
          ========================================================================= */}
      <div className="flex justify-center p-0 sm:p-2 bg-slate-200/60 rounded-xl overflow-x-auto">
        <div
          id="official-report-card-sheet"
          className="report-card-page bg-[#fcfbf7] text-slate-900 shadow-2xl relative"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "8mm",
            boxSizing: "border-box",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          {/* OUTER GOLDEN/YELLOW BORDER */}
          <div
            className="w-full h-full relative"
            style={{
              border: "6px solid #d4a742", // School golden frame
              padding: "4px",
              boxSizing: "border-box",
              backgroundColor: "#fcfbf7",
            }}
          >
            {/* INNER NAVY BLUE BORDER */}
            <div
              className="w-full h-full relative flex flex-col justify-between"
              style={{
                border: "2px solid #0f2537", // School navy inner frame
                padding: "8px 12px",
                boxSizing: "border-box",
              }}
            >
              {/* Central Faded Security Watermark / Hologram Seal */}
              {showWatermark && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] z-0"
                  style={{ transform: "scale(0.85)" }}
                >
                  <Image
                    src="/images/school-emblem.png"
                    alt="Official Hologram Watermark"
                    width={480}
                    height={480}
                    className="object-contain"
                  />
                </div>
              )}

              {/* 1. SCHOOL BRANDING HEADER */}
              <div className="relative z-10 flex items-center justify-between pb-1.5 border-b-2 border-[#0f2537]">
                {/* School Emblem (Left) */}
                <div className="w-[84px] h-[84px] relative flex-shrink-0">
                  <Image
                    src="/images/school-emblem.png"
                    alt="S.B.B Children School Emblem"
                    width={84}
                    height={84}
                    priority
                    className="object-contain"
                  />
                </div>

                {/* School Name & Official Details (Center) */}
                <div className="text-center flex-1 px-2">
                  <h1
                    className="font-bold text-[#0f2537] tracking-tight uppercase"
                    style={{ fontSize: "22px", fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    SBB CHILDREN SCHOOL
                  </h1>
                  <p className="text-[12px] font-semibold text-slate-800 tracking-wide mt-0.5">
                    Add.- Gandhi Nagar Kunda PBH.
                  </p>
                  <p className="text-[11px] font-medium text-slate-700">
                    Mobile- 9451275030, 9792066753
                  </p>
                  <p className="text-[11px] font-medium text-slate-700">
                    Mail- sbbkunda@gmail.com
                  </p>
                </div>

                {/* Student Photo Placeholder Box (Right) */}
                <div
                  className="w-[74px] h-[92px] border border-slate-700 flex flex-col items-center justify-center bg-slate-100 flex-shrink-0 text-slate-400 text-[10px] text-center p-1"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-300 mb-1" />
                  <span className="font-semibold text-[9px] uppercase">Photo</span>
                </div>
              </div>

              {/* 2. STUDENT PROFILE METADATA SECTION (2-Column Exact Layout) */}
              <div className="relative z-10 text-[11px] font-bold text-slate-900 py-1.5 leading-snug">
                <div className="grid grid-cols-12 gap-x-2">
                  {/* Left Column */}
                  <div className="col-span-7 space-y-0.5">
                    <div className="flex">
                      <span className="w-28 text-slate-800">NAME :</span>
                      <span className="uppercase text-black">{student.studentName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-800">FATHER&apos;S NAME :</span>
                      <span className="uppercase text-black">{student.fatherName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-800">MOTHER&apos;S NAME :</span>
                      <span className="uppercase text-black">{student.motherName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-800">ADDRESS :</span>
                      <span className="uppercase text-black truncate">{student.address}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-800">S.R NO. :</span>
                      <span className="text-black font-mono">{student.admissionNo}</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="col-span-5 space-y-0.5 pl-4">
                    <div className="flex">
                      <span className="w-24 text-slate-800">ROLL NO. :</span>
                      <span className="text-black">{student.rollNo}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-800">MOBILE NO :</span>
                      <span className="text-black font-mono">{student.mobile}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-800">DOB :</span>
                      <span className="text-black">{student.dob}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-800">CLASS :</span>
                      <span className="text-black uppercase">
                        {schoolClass.code === "LKG" ? "LKG - A" : schoolClass.code === "UKG" ? "UKG - A" : `${schoolClass.name} - A`}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-slate-800">SESSION :</span>
                      <span className="text-black uppercase font-semibold">
                        {reportCard?.academicSessionId?.replace("session-", "") || "2026-2027"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SCHOLASTIC AREAS TABLE */}
              <div className="relative z-10 border border-slate-700">
                <table className="w-full text-center text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-[#e9e6df] border-b border-slate-700 text-black font-bold">
                      <th rowSpan={2} className="border-r border-slate-700 py-1 px-1.5 text-left w-24">
                        SCHOLASTIC AREAS<br />
                        <span className="font-normal text-[9px]">SUBJECTS</span>
                      </th>
                      <th colSpan={3} className="border-r border-slate-700 py-0.5">
                        TERM1
                      </th>
                      <th colSpan={3} className="border-r border-slate-700 py-0.5">
                        TERM2
                      </th>
                      <th rowSpan={2} className="border-r border-slate-700 py-1 px-1 w-14">
                        Grand<br />Total (250)
                      </th>
                      <th rowSpan={2} className="py-1 px-1 w-12">
                        Grade
                      </th>
                    </tr>
                    <tr className="bg-[#f0ede6] border-b border-slate-700 font-bold text-slate-800 text-[9px]">
                      <th className="border-r border-slate-700 py-0.5 px-1">U.T-1 (25)</th>
                      <th className="border-r border-slate-700 py-0.5 px-1">HALF YEARLY (100/50)</th>
                      <th className="border-r border-slate-700 py-0.5 px-1 font-bold">Marks Obt. (125)</th>
                      <th className="border-r border-slate-700 py-0.5 px-1">U.T-2 (25)</th>
                      <th className="border-r border-slate-700 py-0.5 px-1">ANNUAL EXAMINATION (100/50)</th>
                      <th className="border-r border-slate-700 py-0.5 px-1 font-bold">Marks Obt. (125)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectData.map((sub, idx) => (
                      <tr key={idx} className="border-b border-slate-400 font-medium text-slate-900">
                        <td className="border-r border-slate-700 py-1 px-1.5 text-left font-bold uppercase">
                          {sub.name}
                        </td>
                        <td className="border-r border-slate-700 py-1">{sub.ut1}</td>
                        <td className="border-r border-slate-700 py-1">{sub.halfYearly}</td>
                        <td className="border-r border-slate-700 py-1 font-bold bg-[#f5f3ec]">{sub.term1}</td>
                        <td className="border-r border-slate-700 py-1">{sub.ut2}</td>
                        <td className="border-r border-slate-700 py-1">{sub.annual}</td>
                        <td className="border-r border-slate-700 py-1 font-bold bg-[#f5f3ec]">{sub.term2}</td>
                        <td className="border-r border-slate-700 py-1 font-bold">{sub.grandTotal}</td>
                        <td className="py-1 font-bold">{sub.grade}</td>
                      </tr>
                    ))}
                    {/* TOTAL ROW */}
                    <tr className="bg-[#eae7df] font-bold text-black border-t border-slate-700">
                      <td className="border-r border-slate-700 py-1 px-1.5 text-center uppercase">
                        Total
                      </td>
                      <td className="border-r border-slate-700 py-1">{cumulativeUt1}</td>
                      <td className="border-r border-slate-700 py-1">{cumulativeHalfYearly}</td>
                      <td className="border-r border-slate-700 py-1 bg-[#dedad1]">{cumulativeTerm1Total}</td>
                      <td className="border-r border-slate-700 py-1">{cumulativeUt2}</td>
                      <td className="border-r border-slate-700 py-1">{cumulativeAnnual}</td>
                      <td className="border-r border-slate-700 py-1 bg-[#dedad1]">{cumulativeTerm2Total}</td>
                      <td className="border-r border-slate-700 py-1 text-black font-extrabold">{cumulativeGrandTotal}</td>
                      <td className="py-1">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. CO-SCHOLASTIC AREAS TABLE */}
              <div className="relative z-10 border border-slate-700 text-[10px]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#e9e6df] border-b border-slate-700 font-bold text-black">
                      <th className="border-r border-slate-700 py-0.5 px-2 text-left w-1/3">
                        Grade Scale
                      </th>
                      <th className="border-r border-slate-700 py-0.5 w-1/3">Subjects</th>
                      <th className="border-r border-slate-700 py-0.5 w-1/6">Half Yearly</th>
                      <th className="py-0.5 w-1/6">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coScholasticSubjects.length === 0 ? (
                      <tr>
                        <td className="border-r border-slate-700 py-1 font-semibold text-left px-2" rowSpan={4}>
                          Co-Scholastic Areas
                        </td>
                        <td className="border-r border-slate-700 py-0.5 font-bold">ART</td>
                        <td className="border-r border-slate-700 py-0.5">-</td>
                        <td className="py-0.5 font-bold">A2</td>
                      </tr>
                    ) : (
                      coScholasticSubjects.map((cs, idx) => {
                        const m = marks.find((mark) => mark.subjectId === cs.subjectId);
                        const grade = m?.coScholasticGrade || (cs.subject.name === "ART" ? "A2" : cs.subject.name === "PT" ? "A1" : cs.subject.name === "URDU" ? "-" : "A1");

                        return (
                          <tr key={cs.id} className="border-b border-slate-300">
                            {idx === 0 && (
                              <td
                                rowSpan={coScholasticSubjects.length}
                                className="border-r border-slate-700 py-1 font-bold text-center px-2 bg-[#f4f2eb] align-middle"
                              >
                                Co-Scholastic Areas
                              </td>
                            )}
                            <td className="border-r border-slate-700 py-0.5 font-bold uppercase text-slate-800">
                              {cs.subject.name}
                            </td>
                            <td className="border-r border-slate-700 py-0.5 text-slate-600">-</td>
                            <td className="py-0.5 font-bold text-slate-900">{grade}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. SUMMARY / ATTENDANCE / REMARKS BOXES */}
              <div className="relative z-10 border border-slate-700 text-[10px]">
                {/* Metric Strip 1: Marks, Percentage, Grade, Rank */}
                <div className="grid grid-cols-4 border-b border-slate-700 text-center font-bold bg-[#fbf6ec]">
                  <div className="border-r border-slate-700 py-1 px-1">
                    <span className="text-slate-600 font-semibold block text-[9px]">Over All Marks</span>
                    <span className="text-[#0f2537]">Total: {cumulativeGrandTotal}/{cumulativeMaxMarks}</span>
                  </div>
                  <div className="border-r border-slate-700 py-1 px-1">
                    <span className="text-slate-600 font-semibold block text-[9px]">Over All Percentage</span>
                    <span className="text-[#0f2537]">{overallPercentage}%</span>
                  </div>
                  <div className="border-r border-slate-700 py-1 px-1">
                    <span className="text-slate-600 font-semibold block text-[9px]">Over All Grade</span>
                    <span className="text-[#0f2537]">Grade: {overallGrade}</span>
                  </div>
                  <div className="py-1 px-1">
                    <span className="text-slate-600 font-semibold block text-[9px]">Class Rank</span>
                    <span className="text-[#0f2537] font-extrabold">{classRank}</span>
                  </div>
                </div>

                {/* Metric Strip 2: Attendance, Result, Result Date */}
                <div className="grid grid-cols-12 border-b border-slate-700 text-center font-bold text-[10px]">
                  <div className="col-span-4 border-r border-slate-700 py-1 bg-[#f4f2eb] flex items-center justify-center gap-1.5">
                    <span className="font-semibold text-slate-700">Attendance</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-400 rounded text-black font-mono">
                      {attendanceDays} / {totalAttendanceDays}
                    </span>
                  </div>
                  <div className="col-span-4 border-r border-slate-700 py-1 bg-[#f4f2eb] flex items-center justify-center gap-2">
                    <span className="font-semibold text-slate-700">Result</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-400 rounded text-black">
                      {resultStatus}
                    </span>
                  </div>
                  <div className="col-span-4 py-1 bg-[#f4f2eb] flex items-center justify-center gap-2">
                    <span className="font-semibold text-slate-700">Result Date</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-400 rounded text-black font-mono">
                      {resultDate}
                    </span>
                  </div>
                </div>

                {/* Metric Strip 3: Teacher's Remark */}
                <div className="py-1 px-3 bg-white flex items-center gap-4">
                  <span className="font-bold text-slate-700 text-[10px]">Teacher&apos;s Remark</span>
                  <span className="font-bold text-black text-[11px] font-serif italic">{teacherRemark}</span>
                </div>
              </div>

              {/* 6. SUBJECT PERFORMANCE CLUSTERED BAR CHART */}
              <div className="relative z-10 border border-slate-700 bg-white p-2">
                {/* Chart Header & Legend */}
                <div className="flex items-center justify-center gap-6 mb-1 text-[9px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-2.5 bg-[#4ea8a0] inline-block border border-slate-400" />
                    <span className="text-slate-700">Term-1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-2.5 bg-[#17466f] inline-block border border-slate-600" />
                    <span className="text-slate-700">Term-2</span>
                  </div>
                </div>

                {/* SVG Vector Bar Chart */}
                <div className="flex items-center justify-center">
                  <svg
                    width="100%"
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="overflow-visible"
                  >
                    {/* Gridlines */}
                    {[0, 50, 100, 125].map((level) => {
                      const y = chartHeight - 20 - (level / chartMax) * (chartHeight - 30);
                      return (
                        <g key={level}>
                          <line
                            x1="30"
                            y1={y}
                            x2={chartWidth - 10}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray={level === 0 ? "none" : "2,2"}
                          />
                          <text
                            x="22"
                            y={y + 3}
                            fontSize="8"
                            fill="#64748b"
                            textAnchor="end"
                            fontFamily="sans-serif"
                          >
                            {level}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars per Subject */}
                    {subjectData.map((sub, idx) => {
                      const groupWidth = (chartWidth - 60) / Math.max(subjectData.length, 1);
                      const groupX = 35 + idx * groupWidth;
                      const barWidth = Math.min(26, groupWidth / 2.5);

                      // Term 1 Bar
                      const h1 = Math.max(2, (sub.term1 / chartMax) * (chartHeight - 30));
                      const y1 = chartHeight - 20 - h1;

                      // Term 2 Bar
                      const h2 = Math.max(2, (sub.term2 / chartMax) * (chartHeight - 30));
                      const y2 = chartHeight - 20 - h2;

                      return (
                        <g key={idx}>
                          {/* Term 1 Bar (Teal) */}
                          <rect
                            x={groupX + groupWidth / 2 - barWidth - 1}
                            y={y1}
                            width={barWidth}
                            height={h1}
                            fill="#4ea8a0"
                            rx="1"
                          />
                          <text
                            x={groupX + groupWidth / 2 - barWidth / 2 - 1}
                            y={y1 - 2}
                            fontSize="8"
                            fontWeight="bold"
                            fill="#0f766e"
                            textAnchor="middle"
                          >
                            {sub.term1}
                          </text>

                          {/* Term 2 Bar (Navy) */}
                          <rect
                            x={groupX + groupWidth / 2 + 1}
                            y={y2}
                            width={barWidth}
                            height={h2}
                            fill="#17466f"
                            rx="1"
                          />
                          <text
                            x={groupX + groupWidth / 2 + barWidth / 2 + 1}
                            y={y2 - 2}
                            fontSize="8"
                            fontWeight="bold"
                            fill="#0f2537"
                            textAnchor="middle"
                          >
                            {sub.term2}
                          </text>

                          {/* Subject Code on X Axis */}
                          <text
                            x={groupX + groupWidth / 2}
                            y={chartHeight - 6}
                            fontSize="9"
                            fontWeight="bold"
                            fill="#334155"
                            textAnchor="middle"
                          >
                            {sub.code || sub.name.substring(0, 3)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* 7. SIGNATURES SECTION */}
              <div className="relative z-10 border border-slate-700 bg-white">
                <div className="grid grid-cols-3 text-center text-[10px] font-bold text-slate-800 divide-x divide-slate-700">
                  {/* Parent's Signature */}
                  <div className="p-2 pt-6 flex flex-col justify-end">
                    <div className="border-t border-slate-400 pt-1">
                      Parent&apos;s Signature
                    </div>
                  </div>

                  {/* Class Teacher's Signature */}
                  <div className="p-2 pt-2 flex flex-col justify-end items-center">
                    <span className="font-serif italic text-base text-blue-900 pb-0.5">
                      {teacherName}
                    </span>
                    <div className="border-t border-slate-400 pt-1 w-full">
                      Class Teacher&apos;s Signature
                    </div>
                  </div>

                  {/* Principal's Signature */}
                  <div className="p-2 pt-2 flex flex-col justify-end items-center">
                    <span className="font-serif italic text-base text-slate-800 pb-0.5">
                      Principal
                    </span>
                    <div className="border-t border-slate-400 pt-1 w-full">
                      Principal
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. GRADING SCALE LEGEND TABLE */}
              <div className="relative z-10 border border-slate-700 text-center text-[9px]">
                <div className="bg-[#b34f36] text-white font-bold py-0.5 tracking-wider uppercase">
                  Grading Scale For Scholastic Areas
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-400 font-bold bg-[#fbf6ec]">
                      <td className="border-r border-slate-700 py-0.5 px-1 font-semibold text-slate-700 w-24">Mark Range</td>
                      {OFFICIAL_GRADE_SCALE.map((g, i) => (
                        <td key={i} className="border-r border-slate-700 last:border-r-0 py-0.5 font-mono">
                          {g.range}
                        </td>
                      ))}
                    </tr>
                    <tr className="font-bold bg-[#f4ede2]">
                      <td className="border-r border-slate-700 py-0.5 px-1 font-semibold text-slate-700">Grade</td>
                      {OFFICIAL_GRADE_SCALE.map((g, i) => (
                        <td key={i} className="border-r border-slate-700 last:border-r-0 py-0.5 text-[#0f2537]">
                          {g.grade}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Edit Attendance & Remarks</h3>
              <button onClick={() => setIsEditOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Days Attended</label>
                  <input
                    type="number"
                    value={attendanceDays}
                    onChange={(e) => setAttendanceDays(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total Days</label>
                  <input
                    type="number"
                    value={totalAttendanceDays}
                    onChange={(e) => setTotalAttendanceDays(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Teacher&apos;s Remark</label>
                <input
                  type="text"
                  value={teacherRemark}
                  onChange={(e) => setTeacherRemark(e.target.value)}
                  placeholder="e.g. Good, Excellent, Hardworking"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Result Date</label>
                <input
                  type="text"
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateMetadata) {
                      onUpdateMetadata({
                        attendanceDays,
                        totalAttendanceDays,
                        teacherRemark,
                        resultDate,
                      });
                    }
                    setIsEditOpen(false);
                  }}
                  className="px-3.5 py-1.5 bg-[#0f2537] hover:bg-[#183e60] text-white text-xs font-semibold rounded-lg"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
