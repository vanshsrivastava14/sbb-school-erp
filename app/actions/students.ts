"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  getDb,
  createStudent,
  updateStudent,
  deleteOrArchiveStudent,
  bulkImportStudents,
  logAudit,
  getCurrentAcademicSession,
} from "@/lib/db/store";
import { parseAndValidateStudentExcel } from "@/lib/excel-import";
import { Student } from "@/lib/db/types";

export interface StudentActionResult {
  success?: boolean;
  message?: string;
  error?: string;
  importedCount?: number;
  updatedCount?: number;
  errorsList?: string[];
}

/**
 * One-click import from the official school dataset in reference/student data.xlsx
 */
export async function importReferenceDatasetAction(): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized. Admin privileges required." };
  }

  const filePath = path.join(process.cwd(), "reference", "student data.xlsx");
  if (!fs.existsSync(filePath)) {
    return { error: "Reference file 'reference/student data.xlsx' was not found on server." };
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const { students, errors } = await parseAndValidateStudentExcel(fileBuffer);

    const { imported, updated } = await bulkImportStudents(students);

    await logAudit(
      session.userId,
      session.fullName,
      "IMPORT_STUDENTS_EXCEL",
      "students",
      "bulk",
      `Imported ${imported} new students, updated ${updated} existing records from reference file.`
    );

    revalidatePath("/admin/students");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Successfully processed ${students.length} records (${imported} new, ${updated} updated).`,
      importedCount: imported,
      updatedCount: updated,
      errorsList: errors,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to parse student data spreadsheet." };
  }
}

/**
 * Import custom uploaded Excel/CSV file
 */
export async function uploadStudentsAction(formData: FormData): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const file = formData.get("excelFile") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please select an Excel (.xlsx, .xls) or CSV file." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { students, errors } = await parseAndValidateStudentExcel(buffer);
    const { imported, updated } = await bulkImportStudents(students);

    await logAudit(
      session.userId,
      session.fullName,
      "UPLOAD_STUDENTS_EXCEL",
      "students",
      "bulk",
      `Uploaded and processed ${file.name}: ${imported} added, ${updated} updated.`
    );

    revalidatePath("/admin/students");
    revalidatePath("/admin");

    return {
      success: true,
      message: `File processed successfully. ${imported} added, ${updated} updated.`,
      importedCount: imported,
      updatedCount: updated,
      errorsList: errors,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to process uploaded file." };
  }
}

/**
 * Create a single student record
 */
export async function createStudentAction(formData: FormData): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const admissionNo = (formData.get("admissionNo") as string)?.trim();
  const studentName = (formData.get("studentName") as string)?.trim().toUpperCase();
  const classId = formData.get("classId") as string;
  const sectionId = (formData.get("sectionId") as string) || "sec-a";
  const rollNo = Number(formData.get("rollNo")) || 1;
  const fatherName = (formData.get("fatherName") as string)?.trim().toUpperCase();
  const motherName = (formData.get("motherName") as string)?.trim().toUpperCase();
  const mobile = (formData.get("mobile") as string)?.trim();
  const address = (formData.get("address") as string)?.trim().toUpperCase();
  const dob = (formData.get("dob") as string)?.trim();
  const gender = (formData.get("gender") as "M" | "F" | "Other") || "M";

  if (!admissionNo || !studentName || !classId || !fatherName || !motherName) {
    return { error: "Please fill in all mandatory fields (Admission No, Name, Class, Father, Mother)." };
  }

  const currentSession = await getCurrentAcademicSession();

  try {
    const student: Student = {
      id: `student-${Date.now()}`,
      admissionNo,
      rollNo,
      studentName,
      gender,
      dob: dob || "01/01/2020",
      doa: new Date().toISOString().split("T")[0],
      fatherName: fatherName.startsWith("MR") ? fatherName : `MR. ${fatherName}`,
      motherName: motherName.startsWith("MRS") ? motherName : `MRS. ${motherName}`,
      mobile: mobile || "9451275030",
      address: address || "KUNDA PRATAPGARH",
      classId,
      sectionId,
      academicSessionId: currentSession.id,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await createStudent(student);

    await logAudit(
      session.userId,
      session.fullName,
      "CREATE_STUDENT",
      "students",
      student.id,
      `Registered student ${student.studentName} (Adm No: ${student.admissionNo})`
    );

    revalidatePath("/admin/students");
    revalidatePath("/admin");

    return { success: true, message: `Student ${studentName} created successfully.` };
  } catch (err: any) {
    return { error: err.message || "Failed to create student." };
  }
}

/**
 * Update an existing student record
 */
export async function updateStudentAction(studentId: string, formData: FormData): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  try {
    const updates: Partial<Student> = {
      admissionNo: (formData.get("admissionNo") as string)?.trim(),
      rollNo: Number(formData.get("rollNo")) || 1,
      studentName: (formData.get("studentName") as string)?.trim().toUpperCase(),
      fatherName: (formData.get("fatherName") as string)?.trim().toUpperCase(),
      motherName: (formData.get("motherName") as string)?.trim().toUpperCase(),
      mobile: (formData.get("mobile") as string)?.trim(),
      address: (formData.get("address") as string)?.trim().toUpperCase(),
      dob: (formData.get("dob") as string)?.trim(),
      gender: (formData.get("gender") as "M" | "F" | "Other") || "M",
      classId: (formData.get("classId") as string),
    };

    const updated = await updateStudent(studentId, updates);

    await logAudit(
      session.userId,
      session.fullName,
      "UPDATE_STUDENT",
      "students",
      studentId,
      `Updated student profile: ${updated.studentName} (${updated.admissionNo})`
    );

    revalidatePath("/admin/students");
    return { success: true, message: "Student updated successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to update student." };
  }
}

/**
 * Archive student record
 */
export async function archiveStudentAction(studentId: string): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  await deleteOrArchiveStudent(studentId);
  await logAudit(
    session.userId,
    session.fullName,
    "ARCHIVE_STUDENT",
    "students",
    studentId,
    `Archived student ID: ${studentId}`
  );

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { success: true, message: "Student record archived." };
}
