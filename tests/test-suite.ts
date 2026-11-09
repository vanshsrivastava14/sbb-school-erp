import fs from "fs";
import path from "path";
import { getDb, compileStudentReportCard } from "../lib/db/store";
import { parseAndValidateStudentExcel } from "../lib/excel-import";
import {
  calculateTerm1Total,
  calculateTerm2Total,
  calculateGrandTotal,
  calculateSubjectGrade,
  calculateOverallPercentage,
  getGradeFromPercentage,
} from "../lib/grading";
import { hashPassword, verifyPassword } from "../lib/auth/passwords";

async function runAllTests() {
  console.log("==================================================================");
  console.log("S.B.B. CHILDREN SCHOOL ERP — AUTOMATED TEST & VERIFICATION SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Password Hashing & Verification
  // -------------------------------------------------------------
  console.log("--- TEST GROUP 1: AUTHENTICATION & SECURITY ---");
  const testPass = "Admin@1988";
  const hash = await hashPassword(testPass);
  const isValid = await verifyPassword(testPass, hash);
  const isInvalid = await verifyPassword("WrongPassword", hash);

  assert(isValid === true, "Password verification succeeds for correct secret");
  assert(isInvalid === false, "Password verification rejects incorrect secret");

  // -------------------------------------------------------------
  // TEST 2: Forensic Verification of Reference Report Card Numbers
  // Student: Mahek Sahu (Class LKG - A)
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: MATHEMATICAL CALCULATION RULES ---");

  // G.K. (UT1: 21, HalfYearly: 40, UT2: 22, Annual: 40)
  const gkTerm1 = calculateTerm1Total(21, 40);
  const gkTerm2 = calculateTerm2Total(22, 40);
  const gkGrand = calculateGrandTotal(21, 40, 22, 40);
  // On the official report card, Grand Total column is out of 250: 123 / 250 = 49.2% -> C-2!
  const gkGrade = calculateSubjectGrade(gkGrand, 250);
  assert(gkTerm1 === 61, `G.K. Term 1 is 61 (Got: ${gkTerm1})`);
  assert(gkTerm2 === 62, `G.K. Term 2 is 62 (Got: ${gkTerm2})`);
  assert(gkGrand === 123, `G.K. Grand Total is 123 (Got: ${gkGrand})`);
  assert(gkGrade === "C-2", `G.K. Subject Grade evaluated on 250 scale is C-2 (Got: ${gkGrade})`);

  // HINDI (UT1: 18, HalfYearly: 76, UT2: 21, Annual: 84)
  const hinTerm1 = calculateTerm1Total(18, 76);
  const hinTerm2 = calculateTerm2Total(21, 84);
  const hinGrand = calculateGrandTotal(18, 76, 21, 84);
  const hinGrade = calculateSubjectGrade(hinGrand, 250);
  assert(hinTerm1 === 94, `HINDI Term 1 is 94 (Got: ${hinTerm1})`);
  assert(hinTerm2 === 105, `HINDI Term 2 is 105 (Got: ${hinTerm2})`);
  assert(hinGrand === 199, `HINDI Grand Total is 199 (Got: ${hinGrand})`);
  assert(hinGrade === "B-1", `HINDI Subject Grade is B-1 (Got: ${hinGrade})`);

  // ENGLISH (UT1: 16, HalfYearly: 78, UT2: 20, Annual: 79)
  const engTerm1 = calculateTerm1Total(16, 78);
  const engTerm2 = calculateTerm2Total(20, 79);
  const engGrand = calculateGrandTotal(16, 78, 20, 79);
  const engGrade = calculateSubjectGrade(engGrand, 250);
  assert(engTerm1 === 94, `ENGLISH Term 1 is 94 (Got: ${engTerm1})`);
  assert(engTerm2 === 99, `ENGLISH Term 2 is 99 (Got: ${engTerm2})`);
  assert(engGrand === 193, `ENGLISH Grand Total is 193 (Got: ${engGrand})`);
  assert(engGrade === "B-1", `ENGLISH Subject Grade is B-1 (Got: ${engGrade})`);

  // MATHS (UT1: 19, HalfYearly: 70, UT2: 22, Annual: 75)
  const matTerm1 = calculateTerm1Total(19, 70);
  const matTerm2 = calculateTerm2Total(22, 75);
  const matGrand = calculateGrandTotal(19, 70, 22, 75);
  const matGrade = calculateSubjectGrade(matGrand, 250);
  assert(matTerm1 === 89, `MATHS Term 1 is 89 (Got: ${matTerm1})`);
  assert(matTerm2 === 97, `MATHS Term 2 is 97 (Got: ${matTerm2})`);
  assert(matGrand === 186, `MATHS Grand Total is 186 (Got: ${matGrand})`);
  assert(matGrade === "B-1", `MATHS Subject Grade is B-1 (Got: ${matGrade})`);

  // Cumulative Overall Totals
  const totalObt = gkGrand + hinGrand + engGrand + matGrand;
  const totalMax = 150 + 250 + 250 + 250;
  const pct = calculateOverallPercentage(totalObt, totalMax);
  const overallGrade = getGradeFromPercentage(pct);

  assert(totalObt === 701, `Total Obtained Marks is 701 (Got: ${totalObt})`);
  assert(totalMax === 900, `Total Maximum Marks is 900 (Got: ${totalMax})`);
  assert(pct === 77.89, `Overall Percentage is 77.89% (Got: ${pct}%)`);
  assert(overallGrade === "B-1", `Overall Grade is B-1 (Got: ${overallGrade})`);

  // -------------------------------------------------------------
  // TEST 3: Student Excel Parsing Engine
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: EXCEL IMPORT & DATA VALIDATION ---");
  const excelPath = path.join(process.cwd(), "reference", "student data.xlsx");
  const fileBuffer = fs.readFileSync(excelPath);
  const { students, errors } = await parseAndValidateStudentExcel(fileBuffer);

  assert(students.length >= 400, `Parsed ${students.length} students from student data.xlsx (Expected >= 400)`);
  assert(errors.length === 0, `Validation encountered 0 critical blocking errors`);

  const sampleStudent = students.find((s) => s.admissionNo === "861");
  assert(sampleStudent !== undefined, "Found sample student 861 (Mahek) in parsed records");
  if (sampleStudent) {
    assert(sampleStudent.fatherName.includes("BABAN"), "Student father name matches MR. BABAN");
    assert(sampleStudent.mobile === "9198132983", "Student mobile matches 9198132983");
  }

  // -------------------------------------------------------------
  // TEST 4: Database Persistence & Report Card Compilation
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: DATABASE & REPORT CARD COMPILATION ---");
  const db = await getDb();
  assert(db.classes.length === 12, `Database initialized with 12 classes`);
  assert(db.academicSessions.length >= 1, `Database initialized with active academic session`);

  const targetStudent = db.students.find((s) => s.admissionNo === "861") || db.students[0];
  const compiledCard = await compileStudentReportCard(
    targetStudent.id,
    "session-2025-2026",
    { attendanceDays: 138, totalAttendanceDays: 200, teacherRemark: "Good" }
  );

  assert(compiledCard.totalMarks === 701, `Compiled Report Card Total is 701 (Got: ${compiledCard.totalMarks})`);
  assert(compiledCard.maxTotalMarks === 900, `Compiled Report Card Max is 900 (Got: ${compiledCard.maxTotalMarks})`);
  assert(compiledCard.percentage === 77.89, `Compiled Percentage is 77.89% (Got: ${compiledCard.percentage}%)`);
  assert(compiledCard.resultStatus === "PASSED", "Compiled Result Status is PASSED");

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
