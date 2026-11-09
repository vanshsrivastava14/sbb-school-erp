import * as XLSX from "xlsx";
import { Student } from "./db/types";
import { getClasses, getSections, getCurrentAcademicSession } from "./db/store";

export interface ImportResult {
  totalProcessed: number;
  imported: number;
  updated: number;
  errors: string[];
}

/**
 * Convert Excel serial date (e.g. 45868) to YYYY-MM-DD
 */
function parseExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number" || (!isNaN(Number(val)) && !String(val).includes("/"))) {
    const num = Number(val);
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  const str = String(val).trim().replace(/^\.+/, ""); // remove leading dot
  return str;
}

/**
 * Standardize Class Name to match school classes
 */
function normalizeClassName(rawClass: string): string {
  const c = (rawClass || "").trim().toUpperCase();
  if (c.includes("PRE") || c.includes("NURSERY")) return "PRE-NURSERY";
  if (c.includes("LOWER") || c === "LKG" || c === "L.K.G.") return "LOWER K.G.";
  if (c.includes("UPPER") || c === "UKG" || c === "U.K.G.") return "UPPER K.G.";
  if (c === "I" || c === "1" || c === "IST" || c === "1ST") return "I";
  if (c === "II" || c === "2" || c === "2ND") return "II";
  if (c === "III" || c === "3" || c === "3RD") return "III";
  if (c === "IV" || c === "4" || c === "4TH") return "IV";
  if (c === "V" || c === "5" || c === "5TH") return "V";
  if (c === "VI" || c === "6" || c === "6TH") return "VI";
  if (c === "VII" || c === "7" || c === "7TH") return "VII";
  if (c === "VIII" || c === "8" || c === "8TH") return "VIII";
  if (c === "IX" || c === "9" || c === "9TH") return "IX";
  return c || "PRE-NURSERY";
}

export async function parseAndValidateStudentExcel(fileBuffer: Buffer): Promise<{
  students: Student[];
  errors: string[];
}> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  const classes = await getClasses();
  const currentSession = await getCurrentAcademicSession();

  const classMap = new Map<string, string>();
  classes.forEach((cls) => {
    classMap.set(cls.name.toUpperCase(), cls.id);
  });

  const students: Student[] = [];
  const errors: string[] = [];

  // Group by class to assign sequential roll numbers
  const classRollTracker = new Map<string, number>();

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNum = idx + 2; // header is row 1

    const rawAdmNo = row["AdmissionNo"] || row["Admission No"] || row["S.R. No."] || row["SR NO"] || row["S#"];
    const admissionNo = String(rawAdmNo).trim();

    if (!admissionNo) {
      // Skip completely empty row
      continue;
    }

    const studentName = String(row["Student"] || row["Student Name"] || row["Name"] || "").trim().toUpperCase();
    if (!studentName) {
      errors.push(`Row ${rowNum}: Student Name is missing for Admission No ${admissionNo}`);
      continue;
    }

    const rawClass = String(row["Class"] || "").trim();
    const normalizedClass = normalizeClassName(rawClass);
    const classId = classMap.get(normalizedClass) || classes[0].id;

    const rawSection = String(row["Section"] || "A").trim().toUpperCase() || "A";
    const sectionId = `sec-${normalizedClass.toLowerCase().replace(/[^a-z0-9]/g, "")}-${rawSection.toLowerCase()}`;

    // Calculate Roll Number
    const classSecKey = `${classId}-${rawSection}`;
    const nextRoll = (classRollTracker.get(classSecKey) || 0) + 1;
    classRollTracker.set(classSecKey, nextRoll);

    const fatherName = String(row["Father"] || row["FatherName"] || row["Father's Name"] || "").trim().toUpperCase();
    const motherName = String(row["Mother"] || row["MotherName"] || row["Mother's Name"] || "").trim().toUpperCase();
    const mobile = String(row["Mobile"] || row["Phone1"] || row["Phone2"] || "").trim();
    const address = String(row["Address"] || row["AddCorr1"] || "Kunda Pratapgarh").trim().toUpperCase();
    const dob = parseExcelDate(row["DOB"]);
    const doa = parseExcelDate(row["DOA"]);
    const genderRaw = String(row["Gender"] || "M").trim().toUpperCase();
    const gender: "M" | "F" | "Other" = genderRaw.startsWith("F") ? "F" : "M";

    const student: Student = {
      id: `student-${admissionNo}`,
      admissionNo,
      rollNo: nextRoll,
      studentName,
      gender,
      dob: dob || "01/01/2020",
      doa: doa || new Date().toISOString().split("T")[0],
      aadharNo: String(row["AadharNo"] || "").trim(),
      fatherName: fatherName ? (fatherName.startsWith("MR") ? fatherName : `MR. ${fatherName}`) : "MR. N/A",
      motherName: motherName ? (motherName.startsWith("MRS") ? motherName : `MRS. ${motherName}`) : "MRS. N/A",
      mobile: mobile || "9451275030",
      address: address || "KUNDA PRATAPGARH",
      religion: String(row["Religion"] || "Hindu").trim(),
      casteCategory: String(row["Caste Category"] || row["Caste"] || "GEN").trim().toUpperCase(),
      studentType: String(row["Student Type"] || "Day Scholar").trim(),
      classId,
      sectionId: `sec-${normalizedClass.toLowerCase().replace(/[^a-z0-9]/g, "")}-a`,
      academicSessionId: currentSession.id,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    students.push(student);
  }

  return { students, errors };
}
