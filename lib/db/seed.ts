import bcrypt from "bcryptjs";
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
} from "./types";

export async function getSeedData() {
  const adminHash = await bcrypt.hash("Admin@1988", 10);
  const teacherHash = await bcrypt.hash("Teacher@1988", 10);

  const academicSessions: AcademicSession[] = [
    {
      id: "session-2025-2026",
      name: "2025-2026",
      isCurrent: true,
      startDate: "2025-04-01",
      endDate: "2026-03-31",
    },
    {
      id: "session-2026-2027",
      name: "2026-2027",
      isCurrent: false,
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    },
  ];

  const classes: SchoolClass[] = [
    { id: "class-pn", name: "PRE-NURSERY", code: "PN", orderIndex: 1 },
    { id: "class-lkg", name: "LOWER K.G.", code: "LKG", orderIndex: 2 },
    { id: "class-ukg", name: "UPPER K.G.", code: "UKG", orderIndex: 3 },
    { id: "class-1", name: "I", code: "1", orderIndex: 4 },
    { id: "class-2", name: "II", code: "2", orderIndex: 5 },
    { id: "class-3", name: "III", code: "3", orderIndex: 6 },
    { id: "class-4", name: "IV", code: "4", orderIndex: 7 },
    { id: "class-5", name: "V", code: "5", orderIndex: 8 },
    { id: "class-6", name: "VI", code: "6", orderIndex: 9 },
    { id: "class-7", name: "VII", code: "7", orderIndex: 10 },
    { id: "class-8", name: "VIII", code: "8", orderIndex: 11 },
    { id: "class-9", name: "IX", code: "9", orderIndex: 12 },
  ];

  const sections: Section[] = classes.flatMap((cls) => [
    { id: `sec-${cls.code.toLowerCase()}-a`, name: "A", classId: cls.id },
  ]);
  // Add section B for classes that have it
  sections.push({ id: "sec-lkg-b", name: "B", classId: "class-lkg" });

  const subjects: Subject[] = [
    // Scholastic
    { id: "subj-gk", name: "G.K.", code: "GK", type: "scholastic" },
    { id: "subj-hin", name: "HINDI", code: "HIN", type: "scholastic" },
    { id: "subj-eng", name: "ENGLISH", code: "ENG", type: "scholastic" },
    { id: "subj-mat", name: "MATHS", code: "MAT", type: "scholastic" },
    { id: "subj-sci", name: "SCIENCE", code: "SCI", type: "scholastic" },
    { id: "subj-sst", name: "S.ST", code: "SST", type: "scholastic" },
    { id: "subj-san", name: "SANSKRIT", code: "SAN", type: "scholastic" },
    { id: "subj-com", name: "COMPUTER", code: "COM", type: "scholastic" },
    { id: "subj-it", name: "IT", code: "IT", type: "scholastic" },
    // Co-Scholastic
    { id: "subj-art", name: "ART", code: "ART", type: "co_scholastic" },
    { id: "subj-pt", name: "PT", code: "PT", type: "co_scholastic" },
    { id: "subj-urdu", name: "URDU", code: "URD", type: "co_scholastic" },
    { id: "subj-rhy", name: "RHYMES", code: "RHY", type: "co_scholastic" },
  ];

  // Configure Class Subjects for Pre-Primary (PN, LKG, UKG) based on Report Card & Timetable
  const classSubjects: ClassSubject[] = [
    // LOWER K.G. (Matches Sample Report Card)
    { id: "cs-lkg-gk", classId: "class-lkg", subjectId: "subj-gk", maxUt1: 25, maxHalfYearly: 50, maxUt2: 25, maxAnnual: 50, orderIndex: 1 },
    { id: "cs-lkg-hin", classId: "class-lkg", subjectId: "subj-hin", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 2 },
    { id: "cs-lkg-eng", classId: "class-lkg", subjectId: "subj-eng", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 3 },
    { id: "cs-lkg-mat", classId: "class-lkg", subjectId: "subj-mat", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 4 },
    { id: "cs-lkg-art", classId: "class-lkg", subjectId: "subj-art", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 5 },
    { id: "cs-lkg-pt", classId: "class-lkg", subjectId: "subj-pt", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 6 },
    { id: "cs-lkg-urdu", classId: "class-lkg", subjectId: "subj-urdu", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 7 },
    { id: "cs-lkg-rhy", classId: "class-lkg", subjectId: "subj-rhy", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 8 },

    // PRE-NURSERY
    { id: "cs-pn-gk", classId: "class-pn", subjectId: "subj-gk", maxUt1: 25, maxHalfYearly: 50, maxUt2: 25, maxAnnual: 50, orderIndex: 1 },
    { id: "cs-pn-hin", classId: "class-pn", subjectId: "subj-hin", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 2 },
    { id: "cs-pn-eng", classId: "class-pn", subjectId: "subj-eng", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 3 },
    { id: "cs-pn-mat", classId: "class-pn", subjectId: "subj-mat", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 4 },
    { id: "cs-pn-art", classId: "class-pn", subjectId: "subj-art", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 5 },
    { id: "cs-pn-pt", classId: "class-pn", subjectId: "subj-pt", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 6 },
    { id: "cs-pn-rhy", classId: "class-pn", subjectId: "subj-rhy", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 7 },

    // UPPER K.G.
    { id: "cs-ukg-gk", classId: "class-ukg", subjectId: "subj-gk", maxUt1: 25, maxHalfYearly: 50, maxUt2: 25, maxAnnual: 50, orderIndex: 1 },
    { id: "cs-ukg-hin", classId: "class-ukg", subjectId: "subj-hin", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 2 },
    { id: "cs-ukg-eng", classId: "class-ukg", subjectId: "subj-eng", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 3 },
    { id: "cs-ukg-mat", classId: "class-ukg", subjectId: "subj-mat", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 4 },
    { id: "cs-ukg-art", classId: "class-ukg", subjectId: "subj-art", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 5 },
    { id: "cs-ukg-pt", classId: "class-ukg", subjectId: "subj-pt", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 6 },
    { id: "cs-ukg-rhy", classId: "class-ukg", subjectId: "subj-rhy", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 7 },
  ];

  // For Classes I through V (Primary)
  ["class-1", "class-2", "class-3", "class-4", "class-5"].forEach((cId) => {
    classSubjects.push(
      { id: `cs-${cId}-hin`, classId: cId, subjectId: "subj-hin", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 1 },
      { id: `cs-${cId}-eng`, classId: cId, subjectId: "subj-eng", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 2 },
      { id: `cs-${cId}-mat`, classId: cId, subjectId: "subj-mat", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 3 },
      { id: `cs-${cId}-san`, classId: cId, subjectId: "subj-san", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 4 },
      { id: `cs-${cId}-sci`, classId: cId, subjectId: "subj-sci", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 5 },
      { id: `cs-${cId}-com`, classId: cId, subjectId: "subj-com", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 6 },
      { id: `cs-${cId}-sst`, classId: cId, subjectId: "subj-sst", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 7 },
      { id: `cs-${cId}-gk`, classId: cId, subjectId: "subj-gk", maxUt1: 25, maxHalfYearly: 50, maxUt2: 25, maxAnnual: 50, orderIndex: 8 },
      { id: `cs-${cId}-art`, classId: cId, subjectId: "subj-art", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 9 },
      { id: `cs-${cId}-pt`, classId: cId, subjectId: "subj-pt", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 10 }
    );
  });

  // For Classes VI through VIII (Middle School - from time table.docx)
  ["class-6", "class-7", "class-8"].forEach((cId) => {
    classSubjects.push(
      { id: `cs-${cId}-hin`, classId: cId, subjectId: "subj-hin", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 1 },
      { id: `cs-${cId}-eng`, classId: cId, subjectId: "subj-eng", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 2 },
      { id: `cs-${cId}-mat`, classId: cId, subjectId: "subj-mat", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 3 },
      { id: `cs-${cId}-san`, classId: cId, subjectId: "subj-san", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 4 },
      { id: `cs-${cId}-sci`, classId: cId, subjectId: "subj-sci", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 5 },
      { id: `cs-${cId}-sst`, classId: cId, subjectId: "subj-sst", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 6 },
      { id: `cs-${cId}-com`, classId: cId, subjectId: "subj-com", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 7 },
      { id: `cs-${cId}-gk`, classId: cId, subjectId: "subj-gk", maxUt1: 25, maxHalfYearly: 50, maxUt2: 25, maxAnnual: 50, orderIndex: 8 },
      { id: `cs-${cId}-art`, classId: cId, subjectId: "subj-art", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 9 },
      { id: `cs-${cId}-pt`, classId: cId, subjectId: "subj-pt", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 10 }
    );
  });

  // For Class IX (Secondary - from time table.docx)
  classSubjects.push(
    { id: "cs-class-9-hin", classId: "class-9", subjectId: "subj-hin", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 1 },
    { id: "cs-class-9-eng", classId: "class-9", subjectId: "subj-eng", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 2 },
    { id: "cs-class-9-mat", classId: "class-9", subjectId: "subj-mat", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 3 },
    { id: "cs-class-9-sci", classId: "class-9", subjectId: "subj-sci", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 4 },
    { id: "cs-class-9-sst", classId: "class-9", subjectId: "subj-sst", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 5 },
    { id: "cs-class-9-it", classId: "class-9", subjectId: "subj-it", maxUt1: 25, maxHalfYearly: 100, maxUt2: 25, maxAnnual: 100, orderIndex: 6 },
    { id: "cs-class-9-art", classId: "class-9", subjectId: "subj-art", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 7 },
    { id: "cs-class-9-pt", classId: "class-9", subjectId: "subj-pt", maxUt1: 0, maxHalfYearly: 0, maxUt2: 0, maxAnnual: 0, orderIndex: 8 }
  );

  const teacherProfiles = [
    { classId: "class-pn", email: "anjali@sbbschool.com", name: "Anjali Verma", phone: "9838000001" },
    { classId: "class-lkg", email: "swati@sbbschool.com", name: "Swati (Class Teacher)", phone: "9792066753" },
    { classId: "class-ukg", email: "pooja@sbbschool.com", name: "Pooja Tiwari", phone: "9838000002" },
    { classId: "class-1", email: "ramesh@sbbschool.com", name: "Ramesh Kumar", phone: "9198000000" },
    { classId: "class-2", email: "sunita@sbbschool.com", name: "Sunita Sharma", phone: "9838000003" },
    { classId: "class-3", email: "manoj@sbbschool.com", name: "Manoj Singh", phone: "9838000004" },
    { classId: "class-4", email: "priya@sbbschool.com", name: "Priya Mishra", phone: "9838000005" },
    { classId: "class-5", email: "rajesh@sbbschool.com", name: "Rajesh Yadav", phone: "9838000006" },
    { classId: "class-6", email: "anita@sbbschool.com", name: "Anita Gupta", phone: "9838000007" },
    { classId: "class-7", email: "dharmendra@sbbschool.com", name: "Dharmendra Kumar", phone: "9838000008" },
    { classId: "class-8", email: "rekha@sbbschool.com", name: "Rekha Patel", phone: "9838000009" },
    { classId: "class-9", email: "suresh@sbbschool.com", name: "Suresh Pandey", phone: "9838000010" },
  ];

  const users: User[] = [
    {
      id: "user-admin-1",
      email: "admin@sbbschool.com",
      passwordHash: adminHash,
      fullName: "Principal S.B.B Children School",
      role: "admin",
      phone: "9451275030",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    ...teacherProfiles.map((tp) => ({
      id: `user-teacher-${tp.email.split("@")[0]}`,
      email: tp.email,
      passwordHash: teacherHash,
      fullName: tp.name,
      role: "teacher" as const,
      phone: tp.phone,
      isActive: true,
      createdAt: new Date().toISOString(),
    })),
  ];

  const teacherAssignments: TeacherAssignment[] = teacherProfiles.map((tp) => ({
    id: `assign-${tp.email.split("@")[0]}-${tp.classId}`,
    teacherId: `user-teacher-${tp.email.split("@")[0]}`,
    classId: tp.classId,
    sectionId: `sec-${tp.classId.replace("class-", "")}-a`,
    subjectId: null, // Primary class teacher overseeing all subjects
    isClassTeacher: true,
  }));

  // Pre-seed Mahek Sahu (Student 861) exactly as in the sample report card!
  const students: Student[] = [
    {
      id: "student-mahek-sahu",
      admissionNo: "861",
      rollNo: 27,
      studentName: "MAHEK SAHU",
      gender: "F",
      dob: "04/04/1970",
      doa: "2025-07-15",
      aadharNo: "",
      fatherName: "MR. BABAN",
      motherName: "MRS. LALTI SAHU",
      mobile: "9198132983",
      address: "BADLAWAN PURWA KUNDA PRATAPGARH",
      religion: "Hindu",
      casteCategory: "OBC",
      studentType: "Day Scholar",
      classId: "class-lkg",
      sectionId: "sec-lkg-a",
      academicSessionId: "session-2025-2026",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Pre-seed marks for Mahek Sahu exactly as in the sample report card!
  const marks: MarksEntry[] = [
    // G.K. (UT1: 21, HalfYearly: 40, UT2: 22, Annual: 40)
    {
      id: "marks-mahek-gk",
      studentId: "student-mahek-sahu",
      subjectId: "subj-gk",
      academicSessionId: "session-2025-2026",
      ut1Marks: 21,
      halfYearlyMarks: 40,
      ut2Marks: 22,
      annualMarks: 40,
      coScholasticGrade: null,
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      submittedAt: "2026-03-25T10:00:00Z",
      reviewedByAdminId: "user-admin-1",
      reviewedAt: "2026-03-28T14:00:00Z",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    // HINDI (UT1: 18, HalfYearly: 76, UT2: 21, Annual: 84)
    {
      id: "marks-mahek-hin",
      studentId: "student-mahek-sahu",
      subjectId: "subj-hin",
      academicSessionId: "session-2025-2026",
      ut1Marks: 18,
      halfYearlyMarks: 76,
      ut2Marks: 21,
      annualMarks: 84,
      coScholasticGrade: null,
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      submittedAt: "2026-03-25T10:00:00Z",
      reviewedByAdminId: "user-admin-1",
      reviewedAt: "2026-03-28T14:00:00Z",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    // ENGLISH (UT1: 16, HalfYearly: 78, UT2: 20, Annual: 79)
    {
      id: "marks-mahek-eng",
      studentId: "student-mahek-sahu",
      subjectId: "subj-eng",
      academicSessionId: "session-2025-2026",
      ut1Marks: 16,
      halfYearlyMarks: 78,
      ut2Marks: 20,
      annualMarks: 79,
      coScholasticGrade: null,
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      submittedAt: "2026-03-25T10:00:00Z",
      reviewedByAdminId: "user-admin-1",
      reviewedAt: "2026-03-28T14:00:00Z",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    // MATHS (UT1: 19, HalfYearly: 70, UT2: 22, Annual: 75)
    {
      id: "marks-mahek-mat",
      studentId: "student-mahek-sahu",
      subjectId: "subj-mat",
      academicSessionId: "session-2025-2026",
      ut1Marks: 19,
      halfYearlyMarks: 70,
      ut2Marks: 22,
      annualMarks: 75,
      coScholasticGrade: null,
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      submittedAt: "2026-03-25T10:00:00Z",
      reviewedByAdminId: "user-admin-1",
      reviewedAt: "2026-03-28T14:00:00Z",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    // Co-Scholastics
    {
      id: "marks-mahek-art",
      studentId: "student-mahek-sahu",
      subjectId: "subj-art",
      academicSessionId: "session-2025-2026",
      coScholasticGrade: "A2",
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    {
      id: "marks-mahek-pt",
      studentId: "student-mahek-sahu",
      subjectId: "subj-pt",
      academicSessionId: "session-2025-2026",
      coScholasticGrade: "A1",
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    {
      id: "marks-mahek-urdu",
      studentId: "student-mahek-sahu",
      subjectId: "subj-urdu",
      academicSessionId: "session-2025-2026",
      coScholasticGrade: "-",
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      updatedAt: "2026-03-28T14:00:00Z",
    },
    {
      id: "marks-mahek-rhy",
      studentId: "student-mahek-sahu",
      subjectId: "subj-rhy",
      academicSessionId: "session-2025-2026",
      coScholasticGrade: "A1",
      status: "published",
      enteredByTeacherId: "user-teacher-swati",
      updatedAt: "2026-03-28T14:00:00Z",
    },
  ];

  // Pre-seed Report Card for Mahek Sahu (Exact match: 701/900, 77.89%, Grade B1, Rank 24)
  const reportCards: ReportCard[] = [
    {
      id: "rc-mahek-sahu",
      studentId: "student-mahek-sahu",
      academicSessionId: "session-2025-2026",
      totalMarks: 701,
      maxTotalMarks: 900,
      percentage: 77.89,
      grade: "B1",
      classRank: 24,
      attendanceDays: 138,
      totalAttendanceDays: 200,
      resultStatus: "PASSED",
      resultDate: "04/04/2026",
      teacherRemark: "Good",
      status: "published",
      generatedAt: "2026-04-04T11:00:00Z",
    },
  ];

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
    auditLogs: [],
  };
}
