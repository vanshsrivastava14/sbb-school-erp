import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.resolve(process.cwd());
const envPath = path.join(rootDir, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const db = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "sbb_erp_database.json"), "utf8"));

async function must(promise, label) {
  const res = await promise;
  if (res.error) {
    throw new Error(`${label} failed: ${res.error.message}`);
  }
  return res;
}

async function main() {
  console.log("1. Updating academic sessions...");
  for (const s of db.academicSessions) {
    await must(
      supabase.from("academic_sessions").upsert({
        id: s.id,
        name: s.name,
        is_current: s.isCurrent,
        start_date: s.startDate,
        end_date: s.endDate,
      }),
      `upsert academic_session ${s.id}`
    );
  }

  console.log("2. Clearing old marks, report_cards, audit_logs, teacher_assignments, and students...");
  await must(supabase.from("audit_logs").delete().neq("id", "__none__"), "delete audit_logs");
  await must(supabase.from("report_cards").delete().neq("id", "__none__"), "delete report_cards");
  await must(supabase.from("marks").delete().neq("id", "__none__"), "delete marks");
  await must(supabase.from("teacher_assignments").delete().neq("id", "__none__"), "delete teacher_assignments");
  await must(supabase.from("students").delete().neq("id", "__none__"), "delete students");

  console.log("3. Syncing 15 classes & sections...");
  const { data: existingClasses } = await must(supabase.from("school_classes").select("id"), "list school_classes");
  const validClassIds = new Set(db.classes.map((c) => c.id));
  for (const ec of existingClasses || []) {
    if (!validClassIds.has(ec.id)) {
      await must(supabase.from("class_subjects").delete().eq("class_id", ec.id), `delete class_subjects ${ec.id}`);
      await must(supabase.from("sections").delete().eq("class_id", ec.id), `delete sections ${ec.id}`);
      await must(supabase.from("school_classes").delete().eq("id", ec.id), `delete stale class ${ec.id}`);
    }
  }

  for (const c of db.classes) {
    await must(
      supabase.from("school_classes").upsert({
        id: c.id,
        name: c.name,
        code: c.code,
        order_index: c.orderIndex,
      }),
      `upsert class ${c.id}`
    );
  }

  for (const sec of db.sections) {
    await must(
      supabase.from("sections").upsert(
        {
          id: sec.id,
          name: sec.name,
          class_id: sec.classId,
        },
        { onConflict: "class_id,name" }
      ),
      `upsert section ${sec.id}`
    );
  }

  console.log("4. Ensuring new H.M teacher accounts exist (preserving existing users & passwords)...");
  const { data: existingUsers } = await must(supabase.from("users").select("id"), "list users");
  const existingUserIds = new Set((existingUsers || []).map((u) => u.id));
  for (const u of db.users) {
    if (!existingUserIds.has(u.id)) {
      await must(
        supabase.from("users").insert({
          id: u.id,
          email: u.email,
          password_hash: u.passwordHash,
          full_name: u.fullName,
          role: u.role,
          phone: u.phone || null,
          is_active: u.isActive,
          created_at: u.createdAt,
          updated_at: u.updatedAt || u.createdAt,
        }),
        `insert new user ${u.id}`
      );
      console.log(`   + Inserted new teacher user: ${u.email} (${u.fullName})`);
    }
  }

  console.log("5. Syncing class_subjects & 1-to-1 teacher_assignments...");
  const csRows = db.classSubjects.map((cs) => ({
    id: cs.id,
    class_id: cs.classId,
    subject_id: cs.subjectId,
    max_ut1: cs.maxUt1,
    max_half_yearly: cs.maxHalfYearly,
    max_ut2: cs.maxUt2,
    max_annual: cs.maxAnnual,
    order_index: cs.orderIndex,
  }));
  await must(
    supabase.from("class_subjects").upsert(csRows, { onConflict: "class_id,subject_id" }),
    "upsert class_subjects"
  );

  const taRows = db.teacherAssignments.map((ta) => ({
    id: ta.id,
    teacher_id: ta.teacherId,
    class_id: ta.classId,
    section_id: ta.sectionId,
    subject_id: ta.subjectId || null,
    is_class_teacher: ta.isClassTeacher,
  }));
  await must(supabase.from("teacher_assignments").insert(taRows), "insert teacher_assignments");

  console.log(`6. Inserting ${db.students.length} rebuilt students in batches...`);
  const studentRows = db.students.map((st) => ({
    id: st.id,
    admission_no: st.admissionNo,
    roll_no: st.rollNo,
    student_name: st.studentName,
    gender: st.gender,
    dob: st.dob,
    doa: st.doa || null,
    aadhar_no: st.aadharNo || null,
    father_name: st.fatherName,
    mother_name: st.motherName,
    mobile: st.mobile,
    address: st.address,
    religion: st.religion || null,
    caste_category: st.casteCategory || null,
    student_type: st.studentType || "Regular",
    class_id: st.classId,
    section_id: st.sectionId,
    academic_session_id: st.academicSessionId,
    photo_url: st.photoUrl || null,
    is_active: st.isActive,
    created_at: st.createdAt,
  }));

  const batchSize = 100;
  for (let i = 0; i < studentRows.length; i += batchSize) {
    const batch = studentRows.slice(i, i + batchSize);
    await must(supabase.from("students").insert(batch), `insert students batch ${i}-${i + batch.length}`);
  }

  console.log("7. Writing rebuild audit log...");
  for (const log of db.auditLogs) {
    await must(
      supabase.from("audit_logs").insert({
        id: log.id,
        user_id: log.userId,
        user_name: log.userName,
        action: log.action,
        entity: log.entity,
        entity_id: log.entityId,
        details: log.details,
        created_at: log.timestamp,
      }),
      "insert audit_log"
    );
  }

  const [{ count: stCount }, { count: clsCount }, { count: mkCount }, { count: rcCount }, { count: taCount }] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("school_classes").select("*", { count: "exact", head: true }),
    supabase.from("marks").select("*", { count: "exact", head: true }),
    supabase.from("report_cards").select("*", { count: "exact", head: true }),
    supabase.from("teacher_assignments").select("*", { count: "exact", head: true }),
  ]);

  console.log(`SYNC COMPLETE -> classes=${clsCount}, students=${stCount}, teacher_assignments=${taCount}, marks=${mkCount}, report_cards=${rcCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
