"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  saveMarksEntries,
  submitClassMarks,
  approveClassMarks,
  publishClassReportCards,
  logAudit,
  getCurrentAcademicSession,
} from "@/lib/db/store";

export interface MarksActionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Save marks as draft or submitted for a list of entries
 */
export async function saveMarksAction(
  entries: {
    studentId: string;
    subjectId: string;
    academicSessionId: string;
    ut1Marks?: number | null;
    halfYearlyMarks?: number | null;
    ut2Marks?: number | null;
    annualMarks?: number | null;
    coScholasticGrade?: string | null;
    status: "draft" | "submitted";
  }[]
): Promise<MarksActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Please log in." };
  }

  try {
    await saveMarksEntries(entries, session.userId);

    await logAudit(
      session.userId,
      session.fullName,
      "SAVE_MARKS",
      "marks",
      "batch",
      `Saved ${entries.length} mark entries with status: ${entries[0]?.status || "draft"}`
    );

    revalidatePath("/teacher/marks");
    revalidatePath("/admin/marks");
    return { success: true, message: "Marks saved successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to save marks." };
  }
}

/**
 * Teacher submits class marks for administrator approval
 */
export async function submitClassMarksAction(
  classId: string,
  sectionId: string
): Promise<MarksActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  const currentSession = await getCurrentAcademicSession();

  try {
    await submitClassMarks(classId, sectionId, currentSession.id, session.userId);

    await logAudit(
      session.userId,
      session.fullName,
      "SUBMIT_MARKS_FOR_REVIEW",
      "classes",
      classId,
      `Teacher ${session.fullName} submitted marks for class ${classId} for admin approval`
    );

    revalidatePath("/teacher/marks");
    revalidatePath("/teacher/submissions");
    revalidatePath("/admin/marks");
    return { success: true, message: "Marks submitted for administrative review." };
  } catch (err: any) {
    return { error: err.message || "Failed to submit marks." };
  }
}

/**
 * Admin approves submitted class marks
 */
export async function approveClassMarksAction(
  classId: string,
  sectionId: string
): Promise<MarksActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Only administrators can approve marks." };
  }

  const currentSession = await getCurrentAcademicSession();

  try {
    await approveClassMarks(classId, sectionId, currentSession.id, session.userId);

    await logAudit(
      session.userId,
      session.fullName,
      "APPROVE_MARKS",
      "classes",
      classId,
      `Admin approved marks for class ${classId}`
    );

    revalidatePath("/admin/marks");
    return { success: true, message: "Class marks approved." };
  } catch (err: any) {
    return { error: err.message || "Failed to approve marks." };
  }
}

/**
 * Admin publishes official report cards for a class
 */
export async function publishClassReportCardsAction(
  classId: string,
  sectionId: string
): Promise<MarksActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Only administrators can publish report cards." };
  }

  const currentSession = await getCurrentAcademicSession();

  try {
    const count = await publishClassReportCards(classId, sectionId, currentSession.id, session.userId);

    await logAudit(
      session.userId,
      session.fullName,
      "PUBLISH_REPORT_CARDS",
      "report_cards",
      classId,
      `Published ${count} official report cards for class ${classId}`
    );

    revalidatePath("/admin/marks");
    revalidatePath("/admin/reports");
    revalidatePath("/teacher/reports");
    return { success: true, message: `Successfully published ${count} report cards!` };
  } catch (err: any) {
    return { error: err.message || "Failed to publish report cards." };
  }
}
