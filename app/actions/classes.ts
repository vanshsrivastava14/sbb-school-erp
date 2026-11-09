"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  createClass,
  addClassSubject,
  setClassTeacher,
  logAudit,
  getSubjects,
  getClasses,
} from "@/lib/db/store";
import { SchoolClass, ClassSubject } from "@/lib/db/types";

export interface ClassActionResult {
  success?: boolean;
  message?: string;
  error?: string;
}

/**
 * Admin creates a new class
 */
export async function createClassAction(formData: FormData): Promise<ClassActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized. Admin privileges required." };
  }

  const name = (formData.get("name") as string)?.trim().toUpperCase();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const orderIndex = Number(formData.get("orderIndex")) || 13;
  const inheritSubjectsFrom = formData.get("inheritSubjectsFrom") as string;

  if (!name || !code) {
    return { error: "Class name and class code are required." };
  }

  try {
    const classId = `class-${code.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const newClass: SchoolClass = {
      id: classId,
      name,
      code,
      orderIndex,
    };

    await createClass(newClass);

    // Optionally copy subjects from an existing class
    if (inheritSubjectsFrom) {
      const allSubjects = await getSubjects();
      const existingClasses = await getClasses();
      const baseClass = existingClasses.find((c) => c.id === inheritSubjectsFrom);

      if (baseClass) {
        // Standard subjects: Hindi, English, Maths, Science, S.ST, GK, Art, PT
        const standardSubjects = [
          { code: "HIN", ut: 25, term: 100 },
          { code: "ENG", ut: 25, term: 100 },
          { code: "MAT", ut: 25, term: 100 },
          { code: "SCI", ut: 25, term: 100 },
          { code: "SST", ut: 25, term: 100 },
          { code: "GK", ut: 25, term: 50 },
          { code: "ART", ut: 0, term: 0 },
          { code: "PT", ut: 0, term: 0 },
        ];

        let order = 1;
        for (const item of standardSubjects) {
          const s = allSubjects.find((sub) => sub.code === item.code);
          if (s) {
            await addClassSubject({
              id: `cs-${classId}-${s.id}`,
              classId,
              subjectId: s.id,
              maxUt1: item.ut,
              maxHalfYearly: item.term,
              maxUt2: item.ut,
              maxAnnual: item.term,
              orderIndex: order++,
            });
          }
        }
      }
    }

    await logAudit(
      session.userId,
      session.fullName,
      "CREATE_CLASS",
      "classes",
      classId,
      `Created class: ${name} (${code})`
    );

    revalidatePath("/admin/classes");
    revalidatePath("/admin/students");
    revalidatePath("/admin");
    return { success: true, message: `Class ${name} created successfully!` };
  } catch (err: any) {
    return { error: err.message || "Failed to create class." };
  }
}

/**
 * Assign or change the primary class teacher for a class
 */
export async function assignClassTeacherAction(formData: FormData): Promise<ClassActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const classId = formData.get("classId") as string;
  const sectionId = (formData.get("sectionId") as string) || "sec-a";
  const teacherId = (formData.get("teacherId") as string)?.trim() || "";

  if (!classId) {
    return { error: "Class ID is required." };
  }

  try {
    await setClassTeacher(classId, sectionId, teacherId);

    await logAudit(
      session.userId,
      session.fullName,
      "SET_CLASS_TEACHER",
      "classes",
      classId,
      `Assigned teacher ${teacherId || "None"} as Class Teacher for ${classId}`
    );

    revalidatePath("/admin/classes");
    revalidatePath("/admin/teachers");
    revalidatePath("/teacher");
    return { success: true, message: "Class teacher assigned successfully!" };
  } catch (err: any) {
    return { error: err.message || "Failed to assign class teacher." };
  }
}

/**
 * Add a subject to a class
 */
export async function addClassSubjectAction(formData: FormData): Promise<ClassActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const classId = formData.get("classId") as string;
  const subjectId = formData.get("subjectId") as string;
  const maxUt1 = Number(formData.get("maxUt1")) || 25;
  const maxHalfYearly = Number(formData.get("maxHalfYearly")) || 100;
  const maxUt2 = Number(formData.get("maxUt2")) || 25;
  const maxAnnual = Number(formData.get("maxAnnual")) || 100;

  if (!classId || !subjectId) {
    return { error: "Please select both a class and a subject." };
  }

  try {
    const cs: ClassSubject = {
      id: `cs-${classId}-${subjectId}`,
      classId,
      subjectId,
      maxUt1,
      maxHalfYearly,
      maxUt2,
      maxAnnual,
      orderIndex: 99,
    };

    await addClassSubject(cs);

    await logAudit(
      session.userId,
      session.fullName,
      "ADD_CLASS_SUBJECT",
      "class_subjects",
      cs.id,
      `Added subject ${subjectId} to class ${classId}`
    );

    revalidatePath("/admin/classes");
    return { success: true, message: "Subject configured for class!" };
  } catch (err: any) {
    return { error: err.message || "Failed to add subject." };
  }
}
