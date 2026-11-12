"use server";

import { revalidatePath } from "next/cache";
import { getSession, createSessionCookie } from "@/lib/auth/session";
import { createUser, updateUser, deleteUser, assignTeacher, setClassTeacher, logAudit, getAllUsers, getTeacherAssignments } from "@/lib/db/store";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { getUserById } from "@/lib/db/store";
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

export async function updateAdminCredentialsAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const currentPassword = (formData.get("currentPassword") as string) || "";
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const newPassword = (formData.get("newPassword") as string)?.trim();
  const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

  if (!currentPassword) {
    return { error: "Current admin password is required to save credential changes." };
  }
  if (!fullName || !email) {
    return { error: "Admin name and login email are required." };
  }
  if (newPassword) {
    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters long." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "New password and confirmation do not match." };
    }
  }

  try {
    const adminUser = await getUserById(session.userId);
    if (!adminUser) {
      return { error: "Admin account record not found." };
    }

    const validCurrent = await verifyPassword(currentPassword, adminUser.passwordHash);
    if (!validCurrent) {
      return { error: "Current admin password is incorrect." };
    }

    const updates: Partial<User> = {
      fullName,
      email,
      phone: phone || undefined,
    };

    if (newPassword) {
      updates.passwordHash = await hashPassword(newPassword);
    }

    const updatedAdmin = await updateUser(adminUser.id, updates);

    await createSessionCookie({
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      fullName: updatedAdmin.fullName,
      role: updatedAdmin.role,
    });

    await logAudit(
      session.userId,
      updatedAdmin.fullName,
      "UPDATE_ADMIN_CREDENTIALS",
      "users",
      adminUser.id,
      `Updated admin account: ${fullName} (${email})${newPassword ? " [Password Changed]" : ""}`
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/admin");
    revalidatePath("/login");
    revalidatePath("/");
    return {
      success: true,
      message: newPassword
        ? "Admin login credentials and password updated successfully."
        : "Admin account details updated successfully.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to update admin credentials." };
  }
}

export async function updateTeacherAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const teacherId = formData.get("teacherId") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const classId = formData.get("classId") as string;
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (!teacherId || !fullName || !email) {
    return { error: "Teacher ID, name, and username/email are required." };
  }

  try {
    const updates: Partial<User> = {
      fullName,
      email,
      phone: phone || undefined,
      isActive,
    };

    if (password && password.length >= 6) {
      updates.passwordHash = await hashPassword(password);
    } else if (password && password.length < 6) {
      return { error: "New password must be at least 6 characters long." };
    }

    await updateUser(teacherId, updates);

    // If class assignment is provided, update class teacher assignment
    if (classId) {
      const sectionId = `sec-${classId.replace("class-", "")}-a`;
      await setClassTeacher(classId, sectionId, teacherId);
    }

    await logAudit(
      session.userId,
      session.fullName,
      "UPDATE_TEACHER",
      "users",
      teacherId,
      `Updated teacher account: ${fullName} (${email})${password ? " [Password Reset]" : ""}`
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/login");
    revalidatePath("/teacher");
    revalidatePath("/");
    return {
      success: true,
      message: password
        ? `Account and password for ${fullName} updated successfully.`
        : `Teacher account for ${fullName} updated successfully.`,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to update teacher account." };
  }
}

export async function deleteTeacherAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized." };
  }

  const teacherId = formData.get("teacherId") as string;
  if (!teacherId) {
    return { error: "Teacher ID is required." };
  }

  try {
    await deleteUser(teacherId);
    await logAudit(
      session.userId,
      session.fullName,
      "DELETE_TEACHER",
      "users",
      teacherId,
      `Removed teacher account: ${teacherId}`
    );
    revalidatePath("/admin/teachers");
    return { success: true, message: "Teacher account removed." };
  } catch (err: any) {
    return { error: err.message || "Failed to delete teacher account." };
  }
}
