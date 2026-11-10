const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'sbb_erp_database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return `'${String(val).replace(/'/g, "''")}'`;
}

let sql = `-- ==============================================================================
-- S.B.B CHILDREN SCHOOL ERP — PRODUCTION DATABASE (SUPABASE POSTGRESQL)
-- Gandhi Nagar Kunda, Pratapgarh (Estd. 1988)
-- Generated automatically with full Schema, RLS, 12 Classes, 12 Teachers & 410 Students
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP EXISTING TABLES IF NEEDED (Clean Install)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS report_cards CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS school_classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS academic_sessions CASCADE;

-- 2. CREATE TABLES
CREATE TABLE academic_sessions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    is_current BOOLEAN DEFAULT false,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher')),
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE school_classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE sections (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    class_id VARCHAR(50) NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    UNIQUE(class_id, name)
);

CREATE TABLE subjects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('scholastic', 'co_scholastic'))
);

CREATE TABLE class_subjects (
    id VARCHAR(50) PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    max_ut1 NUMERIC(5,2) DEFAULT 25,
    max_half_yearly NUMERIC(5,2) DEFAULT 100,
    max_ut2 NUMERIC(5,2) DEFAULT 25,
    max_annual NUMERIC(5,2) DEFAULT 100,
    order_index INT NOT NULL DEFAULT 0,
    UNIQUE(class_id, subject_id)
);

CREATE TABLE teacher_assignments (
    id VARCHAR(50) PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(50) NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
    section_id VARCHAR(50) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) REFERENCES subjects(id) ON DELETE SET NULL,
    is_class_teacher BOOLEAN DEFAULT false
);

CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY,
    admission_no VARCHAR(50) NOT NULL UNIQUE,
    roll_no INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('M', 'F', 'Other')),
    dob VARCHAR(30) NOT NULL,
    doa VARCHAR(30),
    aadhar_no VARCHAR(30),
    father_name VARCHAR(255) NOT NULL,
    mother_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    religion VARCHAR(50),
    caste_category VARCHAR(50),
    student_type VARCHAR(50) DEFAULT 'Day Scholar',
    class_id VARCHAR(50) NOT NULL REFERENCES school_classes(id),
    section_id VARCHAR(50) NOT NULL REFERENCES sections(id),
    academic_session_id VARCHAR(50) NOT NULL REFERENCES academic_sessions(id),
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marks (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_session_id VARCHAR(50) NOT NULL REFERENCES academic_sessions(id),
    ut1_marks NUMERIC(5,2),
    half_yearly_marks NUMERIC(5,2),
    ut2_marks NUMERIC(5,2),
    annual_marks NUMERIC(5,2),
    co_scholastic_grade VARCHAR(10),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
    entered_by VARCHAR(50) REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    reviewed_by VARCHAR(50) REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, academic_session_id)
);

CREATE TABLE report_cards (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_session_id VARCHAR(50) NOT NULL REFERENCES academic_sessions(id),
    total_marks NUMERIC(6,2) NOT NULL,
    max_total_marks NUMERIC(6,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class_rank INT NOT NULL,
    attendance_days INT DEFAULT 0,
    total_attendance_days INT DEFAULT 200,
    result_status VARCHAR(20) NOT NULL DEFAULT 'PASSED',
    result_date VARCHAR(30) NOT NULL,
    teacher_remark TEXT,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'submitted', 'published')),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_session_id)
);

CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_students_class_sec ON students(class_id, section_id, academic_session_id);
CREATE INDEX idx_marks_student ON marks(student_id, academic_session_id);
CREATE INDEX idx_report_cards_student ON report_cards(student_id, academic_session_id);

-- ==============================================================================
-- 3. SEED INITIAL DATA
-- ==============================================================================

-- ACADEMIC SESSIONS
`;

for (const s of db.academicSessions) {
  sql += `INSERT INTO academic_sessions (id, name, is_current, start_date, end_date) VALUES (${escapeSql(s.id)}, ${escapeSql(s.name)}, ${escapeSql(s.isCurrent)}, ${escapeSql(s.startDate)}, ${escapeSql(s.endDate)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- USERS (Admin + 12 Class Teachers)\n`;
for (const u of db.users) {
  sql += `INSERT INTO users (id, email, password_hash, full_name, role, phone, is_active) VALUES (${escapeSql(u.id)}, ${escapeSql(u.email)}, ${escapeSql(u.passwordHash)}, ${escapeSql(u.fullName)}, ${escapeSql(u.role)}, ${escapeSql(u.phone)}, ${escapeSql(u.isActive)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- SCHOOL CLASSES\n`;
for (const c of db.classes) {
  sql += `INSERT INTO school_classes (id, name, code, order_index) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.code)}, ${escapeSql(c.orderIndex)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- SECTIONS\n`;
for (const sec of db.sections) {
  sql += `INSERT INTO sections (id, name, class_id) VALUES (${escapeSql(sec.id)}, ${escapeSql(sec.name)}, ${escapeSql(sec.classId)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- SUBJECTS\n`;
for (const sub of db.subjects) {
  sql += `INSERT INTO subjects (id, name, code, type) VALUES (${escapeSql(sub.id)}, ${escapeSql(sub.name)}, ${escapeSql(sub.code)}, ${escapeSql(sub.type)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- CLASS SUBJECTS\n`;
for (const cs of db.classSubjects) {
  sql += `INSERT INTO class_subjects (id, class_id, subject_id, max_ut1, max_half_yearly, max_ut2, max_annual, order_index) VALUES (${escapeSql(cs.id)}, ${escapeSql(cs.classId)}, ${escapeSql(cs.subjectId)}, ${escapeSql(cs.maxUt1)}, ${escapeSql(cs.maxHalfYearly)}, ${escapeSql(cs.maxUt2)}, ${escapeSql(cs.maxAnnual)}, ${escapeSql(cs.orderIndex)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- TEACHER ASSIGNMENTS\n`;
for (const ta of db.teacherAssignments) {
  sql += `INSERT INTO teacher_assignments (id, teacher_id, class_id, section_id, subject_id, is_class_teacher) VALUES (${escapeSql(ta.id)}, ${escapeSql(ta.teacherId)}, ${escapeSql(ta.classId)}, ${escapeSql(ta.sectionId)}, ${escapeSql(ta.subjectId || null)}, ${escapeSql(ta.isClassTeacher)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sql += `\n-- STUDENTS (410 Real School Records)\n`;
for (const st of db.students) {
  sql += `INSERT INTO students (id, admission_no, roll_no, student_name, gender, dob, doa, aadhar_no, father_name, mother_name, mobile, address, religion, caste_category, student_type, class_id, section_id, academic_session_id, photo_url, is_active) VALUES (${escapeSql(st.id)}, ${escapeSql(st.admissionNo)}, ${escapeSql(st.rollNo)}, ${escapeSql(st.studentName)}, ${escapeSql(st.gender)}, ${escapeSql(st.dob)}, ${escapeSql(st.doa)}, ${escapeSql(st.aadharNo)}, ${escapeSql(st.fatherName)}, ${escapeSql(st.motherName)}, ${escapeSql(st.mobile)}, ${escapeSql(st.address)}, ${escapeSql(st.religion)}, ${escapeSql(st.casteCategory)}, ${escapeSql(st.studentType)}, ${escapeSql(st.classId)}, ${escapeSql(st.sectionId)}, ${escapeSql(st.academicSessionId)}, ${escapeSql(st.photoUrl)}, ${escapeSql(st.isActive)}) ON CONFLICT (admission_no) DO UPDATE SET student_name = EXCLUDED.student_name, roll_no = EXCLUDED.roll_no, father_name = EXCLUDED.father_name, mother_name = EXCLUDED.mother_name, class_id = EXCLUDED.class_id, section_id = EXCLUDED.section_id, mobile = EXCLUDED.mobile;\n`;
}

sql += `\n-- MARKS (Seeded entries)\n`;
for (const m of db.marks) {
  sql += `INSERT INTO marks (id, student_id, subject_id, academic_session_id, ut1_marks, half_yearly_marks, ut2_marks, annual_marks, co_scholastic_grade, status, entered_by) VALUES (${escapeSql(m.id)}, ${escapeSql(m.studentId)}, ${escapeSql(m.subjectId)}, ${escapeSql(m.academicSessionId)}, ${escapeSql(m.ut1Marks)}, ${escapeSql(m.halfYearlyMarks)}, ${escapeSql(m.ut2Marks)}, ${escapeSql(m.annualMarks)}, ${escapeSql(m.coScholasticGrade)}, ${escapeSql(m.status)}, ${escapeSql(m.enteredBy)}) ON CONFLICT (student_id, subject_id, academic_session_id) DO UPDATE SET ut1_marks = EXCLUDED.ut1_marks, half_yearly_marks = EXCLUDED.half_yearly_marks, ut2_marks = EXCLUDED.ut2_marks, annual_marks = EXCLUDED.annual_marks, co_scholastic_grade = EXCLUDED.co_scholastic_grade, status = EXCLUDED.status;\n`;
}

sql += `\n-- REPORT CARDS\n`;
for (const rc of db.reportCards) {
  sql += `INSERT INTO report_cards (id, student_id, academic_session_id, total_marks, max_total_marks, percentage, grade, class_rank, attendance_days, total_attendance_days, result_status, result_date, teacher_remark, status) VALUES (${escapeSql(rc.id)}, ${escapeSql(rc.studentId)}, ${escapeSql(rc.academicSessionId)}, ${escapeSql(rc.totalMarks)}, ${escapeSql(rc.maxTotalMarks)}, ${escapeSql(rc.percentage)}, ${escapeSql(rc.grade)}, ${escapeSql(rc.classRank)}, ${escapeSql(rc.attendanceDays)}, ${escapeSql(rc.totalAttendanceDays)}, ${escapeSql(rc.resultStatus)}, ${escapeSql(rc.resultDate)}, ${escapeSql(rc.teacherRemark)}, ${escapeSql(rc.status)}) ON CONFLICT (student_id, academic_session_id) DO UPDATE SET total_marks = EXCLUDED.total_marks, max_total_marks = EXCLUDED.max_total_marks, percentage = EXCLUDED.percentage, grade = EXCLUDED.grade, class_rank = EXCLUDED.class_rank, attendance_days = EXCLUDED.attendance_days, total_attendance_days = EXCLUDED.total_attendance_days, result_status = EXCLUDED.result_status, result_date = EXCLUDED.result_date, teacher_remark = EXCLUDED.teacher_remark, status = EXCLUDED.status;\n`;
}

const outPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261109000000_init_sbb_erp.sql');
fs.writeFileSync(outPath, sql, 'utf-8');
console.log('Successfully generated Supabase migration with length: ' + sql.length + ' bytes at ' + outPath);
