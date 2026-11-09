export type UserRole = "admin" | "teacher";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g. "2025-2026"
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "LOWER K.G.", "UPPER K.G.", "I"
  code: string; // e.g. "LKG", "UKG", "C1"
  orderIndex: number;
}

export interface Section {
  id: string;
  name: string; // "A", "B"
  classId: string;
}

export type SubjectType = "scholastic" | "co_scholastic";

export interface Subject {
  id: string;
  name: string; // e.g. "HINDI", "ENGLISH", "MATHS", "G.K.", "ART"
  code: string; // e.g. "HIN", "ENG", "MAT", "GK", "ART"
  type: SubjectType;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  maxUt1: number; // default 25
  maxHalfYearly: number; // 100 or 50
  maxUt2: number; // default 25
  maxAnnual: number; // 100 or 50
  orderIndex: number;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string; // User ID with role='teacher'
  classId: string;
  sectionId: string;
  subjectId?: string | null; // null if class teacher overseeing all subjects
  isClassTeacher: boolean;
}

export interface Student {
  id: string;
  admissionNo: string; // S.R. No. (e.g. "861")
  rollNo: number; // e.g. 27
  studentName: string; // e.g. "MAHEK SAHU"
  gender: "M" | "F" | "Other";
  dob: string; // e.g. "04/04/2021" or "04/04/1970"
  doa?: string; // Date of admission
  aadharNo?: string;
  fatherName: string; // e.g. "MR. BABAN"
  motherName: string; // e.g. "MRS. LALTI SAHU"
  mobile: string; // e.g. "9198132983"
  address: string; // e.g. "BADLAWAN PURWA KUNDA PRATAPGARH"
  religion?: string; // "Hindu", "Muslim", etc.
  casteCategory?: string; // "GEN", "OBC", "SC", "ST"
  studentType?: string; // "Day Scholar"
  classId: string;
  sectionId: string;
  academicSessionId: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export type MarksStatus = "draft" | "submitted" | "approved" | "published";

export interface MarksEntry {
  id: string;
  studentId: string;
  subjectId: string;
  academicSessionId: string;
  ut1Marks?: number | null; // out of 25
  halfYearlyMarks?: number | null; // out of 100/50
  ut2Marks?: number | null; // out of 25
  annualMarks?: number | null; // out of 100/50
  coScholasticGrade?: string | null; // "A1", "A2", "B1", etc.
  status: MarksStatus;
  enteredByTeacherId: string;
  submittedAt?: string | null;
  reviewedByAdminId?: string | null;
  reviewedAt?: string | null;
  updatedAt: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  academicSessionId: string;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  classRank: number;
  attendanceDays: number;
  totalAttendanceDays: number;
  resultStatus: "PASSED" | "FAILED" | "PROMOTED" | "HELD";
  resultDate: string;
  teacherRemark: string;
  status: MarksStatus;
  generatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}
