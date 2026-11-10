import fs from "fs";
import path from "path";
import {
  User,
  AcademicSession,
  SchoolClass,
  Section,
  Subject,
  ClassSubject,
  TeacherAssignment,
  Student,
  MarksEntry,
  ReportCard,
  AuditLog,
} from "./types";
import { getSeedData } from "./seed";
import {
  calculateGrandTotal,
  calculateSubjectGrade,
  calculateOverallPercentage,
  getGradeFromPercentage,
  calculateClassRanks,
} from "../grading";
import { isSupabaseConfigured } from "../supabase/client";
import {
  fetchFromSupabase,
  syncMarksToSupabase,
  syncReportCardsToSupabase,
  syncStudentToSupabase,
  syncClassToSupabase,
  syncTeacherAssignmentToSupabase,
  syncUserToSupabase,
} from "../supabase/store";

export interface DatabaseState {
  academicSessions: AcademicSession[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  users: User[];
  teacherAssignments: TeacherAssignment[];
  students: Student[];
  marks: MarksEntry[];
  reportCards: ReportCard[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "sbb_erp_database.json");

let memoryDb: DatabaseState | null = null;

export async function getDb(): Promise<DatabaseState> {
  if (memoryDb) {
    return memoryDb;
  }

  // 1. If Supabase is configured, pull live state from Cloud PostgreSQL
  if (isSupabaseConfigured) {
    const cloudDb = await fetchFromSupabase();
    if (cloudDb && cloudDb.classes.length > 0) {
      memoryDb = cloudDb;
      return memoryDb;
    }
  }

  // 2. Otherwise use local JSON database file
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(content) as DatabaseState;
      // Ensure all classes have subjects configured (merge any new subjects from seed)
      const seed = await getSeedData();
      let hasChanges = false;
      for (const seedCs of seed.classSubjects) {
        if (!memoryDb.classSubjects.some((cs) => cs.classId === seedCs.classId && cs.subjectId === seedCs.subjectId)) {
          memoryDb.classSubjects.push(seedCs);
          hasChanges = true;
        }
      }
      if (hasChanges) {
        await saveDb(memoryDb);
      }
      return memoryDb;
    } catch (err) {
      console.error("Failed to read database file, re-seeding:", err);
    }
  }

  // Seed default data
  const seed = await getSeedData();
  memoryDb = seed;
  await saveDb(memoryDb);
  return memoryDb;
}

export async function saveDb(state: DatabaseState): Promise<void> {
  memoryDb = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    // In read-only serverless platforms like Vercel, local disk writes are ignored
    console.warn("Local filesystem write skipped (serverless environment):", err);
  }
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  return db.users.find((u) => u.id === id) || null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  return db.users;
}

export async function createUser(user: User): Promise<User> {
  const db = await getDb();
  if (db.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase().trim())) {
    throw new Error(`User with email '${user.email}' already exists.`);
  }
  db.users.push(user);
  await saveDb(db);
  syncUserToSupabase(user).catch(console.error);
  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const db = await getDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    throw new Error(`User not found.`);
  }

  // If changing email, check uniqueness
  if (updates.email && updates.email.toLowerCase().trim() !== db.users[idx].email.toLowerCase().trim()) {
    const emailExists = db.users.some(
      (u) => u.id !== id && u.email.toLowerCase().trim() === updates.email!.toLowerCase().trim()
    );
    if (emailExists) {
      throw new Error(`User with email '${updates.email}' already exists.`);
    }
  }

  db.users[idx] = {
    ...db.users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveDb(db);
  syncUserToSupabase(db.users[idx]).catch(console.error);
  return db.users[idx];
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDb();
  db.users = db.users.filter((u) => u.id !== id);
  db.teacherAssignments = db.teacherAssignments.filter((ta) => ta.teacherId !== id);
  await saveDb(db);
}

// -------------------------------------------------------------
// ACADEMIC SESSION, CLASS, SECTION, SUBJECT
// -------------------------------------------------------------
export async function getAcademicSessions(): Promise<AcademicSession[]> {
  const db = await getDb();
  return db.academicSessions;
}

export async function getCurrentAcademicSession(): Promise<AcademicSession> {
  const db = await getDb();
  const current = db.academicSessions.find((s) => s.isCurrent);
  return current || db.academicSessions[0];
}

export async function getClasses(): Promise<SchoolClass[]> {
  const db = await getDb();
  return [...db.classes].sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function createClass(cls: SchoolClass): Promise<SchoolClass> {
  const db = await getDb();
  if (db.classes.some((c) => c.name.toLowerCase() === cls.name.toLowerCase().trim() || c.code.toLowerCase() === cls.code.toLowerCase().trim())) {
    throw new Error(`Class with name '${cls.name}' or code '${cls.code}' already exists.`);
  }
  db.classes.push(cls);
  // Create Section A for this class automatically
  const sectionId = `sec-${cls.code.toLowerCase().replace(/[^a-z0-9]/g, "")}-a`;
  const newSection = { id: sectionId, name: "A", classId: cls.id };
  if (!db.sections.some((s) => s.id === sectionId)) {
    db.sections.push(newSection);
  }
  await saveDb(db);
  syncClassToSupabase(cls, newSection).catch(console.error);
  return cls;
}

export async function addClassSubject(cs: ClassSubject): Promise<ClassSubject> {
  const db = await getDb();
  const existingIdx = db.classSubjects.findIndex(
    (item) => item.classId === cs.classId && item.subjectId === cs.subjectId
  );
  if (existingIdx >= 0) {
    db.classSubjects[existingIdx] = cs;
  } else {
    db.classSubjects.push(cs);
  }
  await saveDb(db);
  return cs;
}

export async function setClassTeacher(classId: string, sectionId: string, teacherId: string): Promise<void> {
  const db = await getDb();
  // Remove existing class teacher assignment for this class and section
  db.teacherAssignments = db.teacherAssignments.filter(
    (ta) => !(ta.classId === classId && ta.sectionId === sectionId && ta.isClassTeacher)
  );
  if (teacherId) {
    const newAssignment = {
      id: `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacherId,
      classId,
      sectionId,
      subjectId: null,
      isClassTeacher: true,
    };
    db.teacherAssignments.push(newAssignment);
    syncTeacherAssignmentToSupabase(newAssignment).catch(console.error);
  }
  await saveDb(db);
}

export async function getSections(classId?: string): Promise<Section[]> {
  const db = await getDb();
  if (classId) {
    return db.sections.filter((s) => s.classId === classId);
  }
  return db.sections;
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDb();
  return db.subjects;
}

export async function getClassSubjects(classId: string): Promise<(ClassSubject & { subject: Subject })[]> {
  const db = await getDb();
  const classSubjs = db.classSubjects.filter((cs) => cs.classId === classId);
  return classSubjs
    .map((cs) => {
      const subject = db.subjects.find((s) => s.id === cs.subjectId);
      return {
        ...cs,
        subject: subject || { id: cs.subjectId, name: "UNKNOWN", code: "UNK", type: "scholastic" as const },
      };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

// -------------------------------------------------------------
// TEACHER ASSIGNMENTS
// -------------------------------------------------------------
export async function getTeacherAssignments(teacherId?: string): Promise<TeacherAssignment[]> {
  const db = await getDb();
  if (teacherId) {
    return db.teacherAssignments.filter((ta) => ta.teacherId === teacherId);
  }
  return db.teacherAssignments;
}

export async function assignTeacher(assignment: TeacherAssignment): Promise<TeacherAssignment> {
  const db = await getDb();
  db.teacherAssignments = db.teacherAssignments.filter(
    (ta) =>
      !(
        ta.teacherId === assignment.teacherId &&
        ta.classId === assignment.classId &&
        ta.sectionId === assignment.sectionId &&
        ta.subjectId === assignment.subjectId
      )
  );
  db.teacherAssignments.push(assignment);
  await saveDb(db);
  return assignment;
}

// -------------------------------------------------------------
// STUDENT OPERATIONS
// -------------------------------------------------------------
export async function getStudents(filter?: {
  classId?: string;
  sectionId?: string;
  sessionId?: string;
  search?: string;
}): Promise<Student[]> {
  const db = await getDb();
  let list = db.students.filter((s) => s.isActive);

  if (filter?.classId) {
    list = list.filter((s) => s.classId === filter.classId);
  }
  if (filter?.sectionId) {
    list = list.filter((s) => s.sectionId === filter.sectionId);
  }
  if (filter?.sessionId) {
    list = list.filter((s) => s.academicSessionId === filter.sessionId);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.mobile.includes(q)
    );
  }

  return list.sort((a, b) => a.rollNo - b.rollNo || a.studentName.localeCompare(b.studentName));
}

export async function getStudentById(id: string): Promise<Student | null> {
  const db = await getDb();
  return db.students.find((s) => s.id === id) || null;
}

export async function getStudentByAdmissionNo(admNo: string): Promise<Student | null> {
  const db = await getDb();
  return db.students.find((s) => s.admissionNo.toLowerCase() === admNo.toLowerCase().trim()) || null;
}

export async function createStudent(student: Student): Promise<Student> {
  const db = await getDb();
  // Ensure admission number is unique
  if (db.students.some((s) => s.admissionNo.toLowerCase() === student.admissionNo.toLowerCase().trim())) {
    throw new Error(`Student with Admission No / S.R. No '${student.admissionNo}' already exists.`);
  }
  db.students.push(student);
  await saveDb(db);
  syncStudentToSupabase(student).catch(console.error);
  return student;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  const db = await getDb();
  const idx = db.students.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Student not found");
  
  // If changing admissionNo, check duplicate
  if (updates.admissionNo && updates.admissionNo !== db.students[idx].admissionNo) {
    if (db.students.some((s) => s.id !== id && s.admissionNo.toLowerCase() === updates.admissionNo?.toLowerCase().trim())) {
      throw new Error(`Admission No ${updates.admissionNo} is already assigned to another student.`);
    }
  }

  db.students[idx] = { ...db.students[idx], ...updates };
  await saveDb(db);
  syncStudentToSupabase(db.students[idx]).catch(console.error);
  return db.students[idx];
}

export async function deleteOrArchiveStudent(id: string): Promise<void> {
  const db = await getDb();
  const student = db.students.find((s) => s.id === id);
  if (student) {
    student.isActive = false;
    await saveDb(db);
  }
}

export async function bulkImportStudents(newStudents: Student[]): Promise<{ imported: number; updated: number }> {
  const db = await getDb();
  let imported = 0;
  let updated = 0;

  for (const stu of newStudents) {
    const existingIndex = db.students.findIndex(
      (s) => s.admissionNo.toLowerCase() === stu.admissionNo.toLowerCase().trim()
    );
    if (existingIndex >= 0) {
      db.students[existingIndex] = { ...db.students[existingIndex], ...stu };
      updated++;
    } else {
      db.students.push(stu);
      imported++;
    }
  }

  await saveDb(db);
  return { imported, updated };
}

// -------------------------------------------------------------
// MARKS OPERATIONS
// -------------------------------------------------------------
export async function getMarksForStudent(studentId: string, sessionId: string): Promise<MarksEntry[]> {
  const db = await getDb();
  return db.marks.filter((m) => m.studentId === studentId && m.academicSessionId === sessionId);
}

export async function getMarksForClass(
  classId: string,
  sectionId: string,
  sessionId: string
): Promise<MarksEntry[]> {
  const db = await getDb();
  const classStudents = db.students.filter(
    (s) => s.classId === classId && s.sectionId === sectionId && s.academicSessionId === sessionId && s.isActive
  );
  const studentIds = new Set(classStudents.map((s) => s.id));
  return db.marks.filter((m) => studentIds.has(m.studentId) && m.academicSessionId === sessionId);
}

export async function saveMarksEntries(
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
  }[],
  teacherId: string
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  for (const entry of entries) {
    const idx = db.marks.findIndex(
      (m) =>
        m.studentId === entry.studentId &&
        m.subjectId === entry.subjectId &&
        m.academicSessionId === entry.academicSessionId
    );

    if (idx >= 0) {
      db.marks[idx] = {
        ...db.marks[idx],
        ut1Marks: entry.ut1Marks !== undefined ? entry.ut1Marks : db.marks[idx].ut1Marks,
        halfYearlyMarks: entry.halfYearlyMarks !== undefined ? entry.halfYearlyMarks : db.marks[idx].halfYearlyMarks,
        ut2Marks: entry.ut2Marks !== undefined ? entry.ut2Marks : db.marks[idx].ut2Marks,
        annualMarks: entry.annualMarks !== undefined ? entry.annualMarks : db.marks[idx].annualMarks,
        coScholasticGrade: entry.coScholasticGrade !== undefined ? entry.coScholasticGrade : db.marks[idx].coScholasticGrade,
        status: entry.status,
        enteredByTeacherId: teacherId,
        submittedAt: entry.status === "submitted" ? now : db.marks[idx].submittedAt,
        updatedAt: now,
      };
    } else {
      db.marks.push({
        id: `marks-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentId: entry.studentId,
        subjectId: entry.subjectId,
        academicSessionId: entry.academicSessionId,
        ut1Marks: entry.ut1Marks ?? null,
        halfYearlyMarks: entry.halfYearlyMarks ?? null,
        ut2Marks: entry.ut2Marks ?? null,
        annualMarks: entry.annualMarks ?? null,
        coScholasticGrade: entry.coScholasticGrade ?? null,
        status: entry.status,
        enteredByTeacherId: teacherId,
        submittedAt: entry.status === "submitted" ? now : null,
        updatedAt: now,
      });
    }
  }

  await saveDb(db);

  // Auto-compile report cards for the affected students so they reflect marks immediately
  const studentIds = Array.from(new Set(entries.map((e) => e.studentId)));
  const sessionId = entries[0]?.academicSessionId || "session-2025-2026";
  syncMarksToSupabase(db.marks.filter((m) => studentIds.includes(m.studentId))).catch(console.error);
  for (const sId of studentIds) {
    try {
      await compileStudentReportCard(sId, sessionId);
    } catch {
      // Ignore if student has incomplete data
    }
  }
}

export async function submitClassMarks(
  classId: string,
  sectionId: string,
  sessionId: string,
  teacherId: string
): Promise<void> {
  const db = await getDb();
  const students = await getStudents({ classId, sectionId, sessionId });
  const studentIds = new Set(students.map((s) => s.id));
  const now = new Date().toISOString();

  for (const m of db.marks) {
    if (studentIds.has(m.studentId) && m.academicSessionId === sessionId) {
      if (m.status === "draft") {
        m.status = "submitted";
        m.submittedAt = now;
        m.enteredByTeacherId = teacherId;
        m.updatedAt = now;
      }
    }
  }

  await saveDb(db);
}

export async function approveClassMarks(
  classId: string,
  sectionId: string,
  sessionId: string,
  adminId: string
): Promise<void> {
  const db = await getDb();
  const students = await getStudents({ classId, sectionId, sessionId });
  const studentIds = new Set(students.map((s) => s.id));
  const now = new Date().toISOString();

  for (const m of db.marks) {
    if (studentIds.has(m.studentId) && m.academicSessionId === sessionId) {
      if (m.status === "submitted" || m.status === "draft") {
        m.status = "approved";
        m.reviewedByAdminId = adminId;
        m.reviewedAt = now;
        m.updatedAt = now;
      }
    }
  }

  await saveDb(db);
}

// -------------------------------------------------------------
// REPORT CARD GENERATION & PUBLISHING
// -------------------------------------------------------------
export async function getReportCard(studentId: string, sessionId: string): Promise<ReportCard | null> {
  const db = await getDb();
  return db.reportCards.find((rc) => rc.studentId === studentId && rc.academicSessionId === sessionId) || null;
}

export async function getReportCardsForClass(
  classId: string,
  sectionId: string,
  sessionId: string
): Promise<ReportCard[]> {
  const db = await getDb();
  const students = await getStudents({ classId, sectionId, sessionId });
  const studentIds = new Set(students.map((s) => s.id));
  return db.reportCards.filter((rc) => studentIds.has(rc.studentId) && rc.academicSessionId === sessionId);
}

/**
 * Compiles and generates official Report Card for student
 */
export async function compileStudentReportCard(
  studentId: string,
  sessionId: string,
  metadata?: {
    attendanceDays?: number;
    totalAttendanceDays?: number;
    teacherRemark?: string;
    resultDate?: string;
    status?: "draft" | "submitted" | "approved" | "published";
  }
): Promise<ReportCard> {
  const db = await getDb();
  const student = db.students.find((s) => s.id === studentId);
  if (!student) throw new Error("Student not found");

  const classSubjects = await getClassSubjects(student.classId);
  const studentMarks = await getMarksForStudent(studentId, sessionId);

  let totalObtained = 0;
  let totalMax = 0;

  for (const cs of classSubjects) {
    if (cs.subject.type === "scholastic") {
      const mark = studentMarks.find((m) => m.subjectId === cs.subjectId);
      const grandTotal = calculateGrandTotal(
        mark?.ut1Marks,
        mark?.halfYearlyMarks,
        mark?.ut2Marks,
        mark?.annualMarks
      );
      const maxSubjectMarks = cs.maxUt1 + cs.maxHalfYearly + cs.maxUt2 + cs.maxAnnual;
      totalObtained += grandTotal;
      totalMax += maxSubjectMarks;
    }
  }

  const percentage = calculateOverallPercentage(totalObtained, totalMax);
  const grade = getGradeFromPercentage(percentage);

  // Compute Class Rank
  const classStudents = await getStudents({
    classId: student.classId,
    sectionId: student.sectionId,
    sessionId,
  });

  // Calculate totals for all students in this class to determine ranks
  const studentTotals: { studentId: string; totalMarks: number }[] = [];
  for (const s of classStudents) {
    const sMarks = await getMarksForStudent(s.id, sessionId);
    let sTotal = 0;
    for (const cs of classSubjects) {
      if (cs.subject.type === "scholastic") {
        const sm = sMarks.find((m) => m.subjectId === cs.subjectId);
        sTotal += calculateGrandTotal(sm?.ut1Marks, sm?.halfYearlyMarks, sm?.ut2Marks, sm?.annualMarks);
      }
    }
    studentTotals.push({ studentId: s.id, totalMarks: sTotal });
  }

  const ranksMap = calculateClassRanks(studentTotals);
  const classRank = ranksMap.get(studentId) || 1;

  const resultStatus = percentage >= 33 ? "PASSED" : "FAILED";
  const resultDate = metadata?.resultDate || "04/04/2026";
  const teacherRemark = metadata?.teacherRemark || (percentage >= 75 ? "Good" : percentage >= 50 ? "Satisfactory" : "Needs Improvement");
  const attendanceDays = metadata?.attendanceDays ?? 138;
  const totalAttendanceDays = metadata?.totalAttendanceDays ?? 200;

  const existingIdx = db.reportCards.findIndex(
    (rc) => rc.studentId === studentId && rc.academicSessionId === sessionId
  );

  const reportCard: ReportCard = {
    id: existingIdx >= 0 ? db.reportCards[existingIdx].id : `rc-${studentId}-${sessionId}`,
    studentId,
    academicSessionId: sessionId,
    totalMarks: totalObtained,
    maxTotalMarks: totalMax,
    percentage,
    grade,
    classRank,
    attendanceDays,
    totalAttendanceDays,
    resultStatus,
    resultDate,
    teacherRemark,
    status: metadata?.status || (existingIdx >= 0 ? db.reportCards[existingIdx].status : "published"),
    generatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    db.reportCards[existingIdx] = reportCard;
  } else {
    db.reportCards.push(reportCard);
  }

  await saveDb(db);
  syncReportCardsToSupabase([reportCard]).catch(console.error);
  return reportCard;
}

export async function publishClassReportCards(
  classId: string,
  sectionId: string,
  sessionId: string,
  adminId: string
): Promise<number> {
  const db = await getDb();
  const students = await getStudents({ classId, sectionId, sessionId });
  let count = 0;

  for (const student of students) {
    await compileStudentReportCard(student.id, sessionId, { status: "published" });
    count++;
  }

  // Also mark all marks entries as published
  const studentIds = new Set(students.map((s) => s.id));
  const now = new Date().toISOString();
  for (const m of db.marks) {
    if (studentIds.has(m.studentId) && m.academicSessionId === sessionId) {
      m.status = "published";
      m.reviewedByAdminId = adminId;
      m.reviewedAt = now;
      m.updatedAt = now;
    }
  }

  await saveDb(db);
  return count;
}

// -------------------------------------------------------------
// AUDIT LOGGING
// -------------------------------------------------------------
export async function logAudit(
  userId: string,
  userName: string,
  action: string,
  entity: string,
  entityId: string,
  details: string
): Promise<void> {
  const db = await getDb();
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userName,
    action,
    entity,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  // Keep last 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  await saveDb(db);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const db = await getDb();
  return db.auditLogs;
}
