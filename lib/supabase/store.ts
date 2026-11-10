import { supabase, isSupabaseConfigured } from "./client";
import { DatabaseState } from "../db/store";
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
} from "../db/types";

export async function fetchFromSupabase(): Promise<DatabaseState | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const [
      sessionsRes,
      usersRes,
      classesRes,
      sectionsRes,
      subjectsRes,
      classSubjRes,
      assignmentsRes,
      studentsRes,
      marksRes,
      reportCardsRes,
      auditRes,
    ] = await Promise.all([
      supabase.from("academic_sessions").select("*"),
      supabase.from("users").select("*"),
      supabase.from("school_classes").select("*").order("order_index", { ascending: true }),
      supabase.from("sections").select("*"),
      supabase.from("subjects").select("*"),
      supabase.from("class_subjects").select("*").order("order_index", { ascending: true }),
      supabase.from("teacher_assignments").select("*"),
      supabase.from("students").select("*"),
      supabase.from("marks").select("*"),
      supabase.from("report_cards").select("*"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    if (sessionsRes.error) throw sessionsRes.error;
    if (usersRes.error) throw usersRes.error;
    if (classesRes.error) throw classesRes.error;
    if (sectionsRes.error) throw sectionsRes.error;
    if (subjectsRes.error) throw subjectsRes.error;
    if (classSubjRes.error) throw classSubjRes.error;
    if (assignmentsRes.error) throw assignmentsRes.error;
    if (studentsRes.error) throw studentsRes.error;
    if (marksRes.error) throw marksRes.error;
    if (reportCardsRes.error) throw reportCardsRes.error;

    const academicSessions: AcademicSession[] = (sessionsRes.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      isCurrent: s.is_current,
      startDate: s.start_date,
      endDate: s.end_date,
    }));

    const users: User[] = (usersRes.data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      passwordHash: u.password_hash,
      fullName: u.full_name,
      role: u.role,
      phone: u.phone,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    const classes: SchoolClass[] = (classesRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      orderIndex: c.order_index,
    }));

    const sections: Section[] = (sectionsRes.data || []).map((sec: any) => ({
      id: sec.id,
      name: sec.name,
      classId: sec.class_id,
    }));

    const subjects: Subject[] = (subjectsRes.data || []).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      type: sub.type,
    }));

    const classSubjects: ClassSubject[] = (classSubjRes.data || []).map((cs: any) => ({
      id: cs.id,
      classId: cs.class_id,
      subjectId: cs.subject_id,
      maxUt1: Number(cs.max_ut1),
      maxHalfYearly: Number(cs.max_half_yearly),
      maxUt2: Number(cs.max_ut2),
      maxAnnual: Number(cs.max_annual),
      orderIndex: cs.order_index,
    }));

    const teacherAssignments: TeacherAssignment[] = (assignmentsRes.data || []).map((ta: any) => ({
      id: ta.id,
      teacherId: ta.teacher_id,
      classId: ta.class_id,
      sectionId: ta.section_id,
      subjectId: ta.subject_id,
      isClassTeacher: ta.is_class_teacher,
    }));

    const students: Student[] = (studentsRes.data || []).map((st: any) => ({
      id: st.id,
      admissionNo: st.admission_no,
      rollNo: st.roll_no,
      studentName: st.student_name,
      gender: st.gender,
      dob: st.dob,
      doa: st.doa,
      aadharNo: st.aadhar_no,
      fatherName: st.father_name,
      motherName: st.mother_name,
      mobile: st.mobile,
      address: st.address,
      religion: st.religion,
      casteCategory: st.caste_category,
      studentType: st.student_type,
      classId: st.class_id,
      sectionId: st.section_id,
      academicSessionId: st.academic_session_id,
      photoUrl: st.photo_url,
      isActive: st.is_active,
      createdAt: st.created_at,
    }));

    const marks: MarksEntry[] = (marksRes.data || []).map((m: any) => ({
      id: m.id,
      studentId: m.student_id,
      subjectId: m.subject_id,
      academicSessionId: m.academic_session_id,
      ut1Marks: m.ut1_marks != null ? Number(m.ut1_marks) : null,
      halfYearlyMarks: m.half_yearly_marks != null ? Number(m.half_yearly_marks) : null,
      ut2Marks: m.ut2_marks != null ? Number(m.ut2_marks) : null,
      annualMarks: m.annual_marks != null ? Number(m.annual_marks) : null,
      coScholasticGrade: m.co_scholastic_grade,
      status: m.status,
      enteredByTeacherId: m.entered_by,
      submittedAt: m.submitted_at,
      reviewedByAdminId: m.reviewed_by,
      reviewedAt: m.reviewed_at,
      updatedAt: m.updated_at,
    }));

    const reportCards: ReportCard[] = (reportCardsRes.data || []).map((rc: any) => ({
      id: rc.id,
      studentId: rc.student_id,
      academicSessionId: rc.academic_session_id,
      totalMarks: Number(rc.total_marks),
      maxTotalMarks: Number(rc.max_total_marks),
      percentage: Number(rc.percentage),
      grade: rc.grade,
      classRank: rc.class_rank,
      attendanceDays: rc.attendance_days,
      totalAttendanceDays: rc.total_attendance_days,
      resultStatus: rc.result_status,
      resultDate: rc.result_date,
      teacherRemark: rc.teacher_remark,
      status: rc.status,
      generatedAt: rc.generated_at,
    }));

    const auditLogs: AuditLog[] = (auditRes.data || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      userName: a.user_name,
      action: a.action,
      entity: a.entity,
      entityId: a.entity_id,
      details: a.details,
      timestamp: a.created_at,
    }));

    return {
      academicSessions,
      classes,
      sections,
      subjects,
      classSubjects,
      users,
      teacherAssignments,
      students,
      marks,
      reportCards,
      auditLogs,
    };
  } catch (err) {
    console.error("Failed to load data from Supabase:", err);
    return null;
  }
}

export async function syncMarksToSupabase(marks: MarksEntry[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase || marks.length === 0) return;

  const rows = marks.map((m) => ({
    id: m.id,
    student_id: m.studentId,
    subject_id: m.subjectId,
    academic_session_id: m.academicSessionId,
    ut1_marks: m.ut1Marks,
    half_yearly_marks: m.halfYearlyMarks,
    ut2_marks: m.ut2Marks,
    annual_marks: m.annualMarks,
    co_scholastic_grade: m.coScholasticGrade,
    status: m.status,
    entered_by: m.enteredByTeacherId,
    submitted_at: m.submittedAt,
    reviewed_by: m.reviewedByAdminId,
    reviewed_at: m.reviewedAt,
    updated_at: m.updatedAt,
  }));

  try {
    await supabase.from("marks").upsert(rows, { onConflict: "student_id,subject_id,academic_session_id" });
  } catch (err) {
    console.error("Supabase marks sync error:", err);
  }
}

export async function syncReportCardsToSupabase(cards: ReportCard[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase || cards.length === 0) return;

  const rows = cards.map((rc) => ({
    id: rc.id,
    student_id: rc.studentId,
    academic_session_id: rc.academicSessionId,
    total_marks: rc.totalMarks,
    max_total_marks: rc.maxTotalMarks,
    percentage: rc.percentage,
    grade: rc.grade,
    class_rank: rc.classRank,
    attendance_days: rc.attendanceDays,
    total_attendance_days: rc.totalAttendanceDays,
    result_status: rc.resultStatus,
    result_date: rc.resultDate,
    teacher_remark: rc.teacherRemark,
    status: rc.status,
    generated_at: rc.generatedAt,
  }));

  try {
    await supabase.from("report_cards").upsert(rows, { onConflict: "student_id,academic_session_id" });
  } catch (err) {
    console.error("Supabase report_cards sync error:", err);
  }
}

export async function syncStudentToSupabase(st: Student): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const row = {
    id: st.id,
    admission_no: st.admissionNo,
    roll_no: st.rollNo,
    student_name: st.studentName,
    gender: st.gender,
    dob: st.dob,
    doa: st.doa,
    aadhar_no: st.aadharNo,
    father_name: st.fatherName,
    mother_name: st.motherName,
    mobile: st.mobile,
    address: st.address,
    religion: st.religion,
    caste_category: st.casteCategory,
    student_type: st.studentType,
    class_id: st.classId,
    section_id: st.sectionId,
    academic_session_id: st.academicSessionId,
    photo_url: st.photoUrl,
    is_active: st.isActive,
  };

  try {
    await supabase.from("students").upsert(row, { onConflict: "admission_no" });
  } catch (err) {
    console.error("Supabase student sync error:", err);
  }
}

export async function syncClassToSupabase(cls: SchoolClass, section: Section): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    await supabase.from("school_classes").upsert({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      order_index: cls.orderIndex,
    }, { onConflict: "code" });

    await supabase.from("sections").upsert({
      id: section.id,
      name: section.name,
      class_id: section.classId,
    }, { onConflict: "class_id,name" });
  } catch (err) {
    console.error("Supabase class sync error:", err);
  }
}

export async function syncTeacherAssignmentToSupabase(ta: TeacherAssignment): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    await supabase.from("teacher_assignments").upsert({
      id: ta.id,
      teacher_id: ta.teacherId,
      class_id: ta.classId,
      section_id: ta.sectionId,
      subject_id: ta.subjectId,
      is_class_teacher: ta.isClassTeacher,
    });
  } catch (err) {
    console.error("Supabase assignment sync error:", err);
  }
}
