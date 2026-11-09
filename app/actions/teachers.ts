"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createUser, assignTeacher, logAudit, getAllUsers, getTeacherAssignments } from "@/lib/db/store";
import { hashPassword } from "@/lib/auth/passwords";
import { User, TeacherAssignment } from "@/lib/db/types";

export async function createTeacherAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  try {
    const passwordHash = await hashPassword(password);
    const user: User = {
      id: `user-teacher-${Date.now()}`,
      email,
      fullName,
      passwordHash,
      role: "teacher",
      phone: phone || "9451275030",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);

    await logAudit(
      session.userId,
      session.fullName,
      "CREATE_TEACHER",
      "users",
      user.id,
      `Created teacher account: ${fullName} (${email})`
    );

    revalidatePath("/admin/teachers");
    return { success: true, message: `Teacher ${fullName} created successfully.` };
  } catch (err: any) {
    return { error: err.message || "Failed to create teacher account." };
  }
}

export async function assignTeacherAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const teacherId = formData.get("teacherId") as string;
  const classId = formData.get("classId") as string;
  const sectionId = (formData.get("sectionId") as string) || "sec-a";
  const isClassTeacher = formData.get("isClassTeacher") === "on";

  if (!teacherId || !classId) {
    return { error: "Please select both a teacher and a class." };
  }

  try {
    const assignment: TeacherAssignment = {
      id: `assign-${Date.now()}`,
      teacherId,
      classId,
      sectionId,
      subjectId: null,
      isClassTeacher,
    };

    await assignTeacher(assignment);

    await logAudit(
      session.userId,
      session.fullName,
      "ASSIGN_TEACHER",
      "teacher_assignments",
      assignment.id,
      `Assigned teacher to class: ${classId}`
    );

    revalidatePath("/admin/teachers");
    return { success: true, message: "Class assignment updated." };
  } catch (err: any) {
    return { error: err.message || "Failed to update teacher assignment." };
  }
}
