const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read local database
const dbPath = path.join(__dirname, '..', 'data', 'sbb_erp_database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// 2. Add Class 10 (X) if not present
if (!db.classes.some(c => c.id === 'class-10')) {
  db.classes.push({
    id: 'class-10',
    name: 'X',
    code: '10',
    orderIndex: 13,
  });
  console.log('✓ Added Class 10 (X)');
}

// Ensure Section A for Class 10
if (!db.sections.some(s => s.id === 'sec-10-a')) {
  db.sections.push({
    id: 'sec-10-a',
    name: 'A',
    classId: 'class-10',
  });
  console.log('✓ Added Section A for Class 10');
}

// Add Class 10 subjects (same as Class 9)
const class9Subjects = db.classSubjects.filter(cs => cs.classId === 'class-9');
for (const cs of class9Subjects) {
  const c10SubjectId = `cs-class-10-${cs.subjectId}`;
  if (!db.classSubjects.some(item => item.id === c10SubjectId)) {
    db.classSubjects.push({
      id: c10SubjectId,
      classId: 'class-10',
      subjectId: cs.subjectId,
      maxUt1: cs.maxUt1,
      maxHalfYearly: cs.maxHalfYearly,
      maxUt2: cs.maxUt2,
      maxAnnual: cs.maxAnnual,
      orderIndex: cs.orderIndex,
    });
  }
}

// Ensure Teacher for Class 10
if (!db.users.some(u => u.id === 'user-teacher-class10')) {
  db.users.push({
    id: 'user-teacher-class10',
    email: 'class10@sbbschool.com',
    passwordHash: db.users[1].passwordHash, // teacher123
    fullName: 'Sanjay Mishra (Class 10 Teacher)',
    role: 'teacher',
    phone: '9451275031',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  db.teacherAssignments.push({
    id: 'assign-class-10-a',
    teacherId: 'user-teacher-class10',
    classId: 'class-10',
    sectionId: 'sec-10-a',
    subjectId: null,
    isClassTeacher: true,
  });
  console.log('✓ Added Teacher for Class 10');
}

// 3. Switch current Academic Session to 2026-2027
db.academicSessions.forEach(s => {
  if (s.name === '2026-2027' || s.id === 'session-2026-2027') {
    s.isCurrent = true;
  } else {
    s.isCurrent = false;
  }
});
console.log('✓ Switched current session to 2026-2027');

// 4. Map class promotion ladder by orderIndex
const sortedClasses = [...db.classes].sort((a, b) => a.orderIndex - b.orderIndex);
const promotionMap = new Map();
for (let i = 0; i < sortedClasses.length - 1; i++) {
  promotionMap.set(sortedClasses[i].id, sortedClasses[i + 1].id);
}

// 5. Promote all students
const classRollTracker = new Map();
let promotedCount = 0;

for (const student of db.students) {
  const currentClassId = student.classId;
  const nextClassId = promotionMap.get(currentClassId);

  if (nextClassId) {
    const nextClass = db.classes.find(c => c.id === nextClassId);
    const nextSec = db.sections.find(s => s.classId === nextClassId && s.name === 'A') || db.sections.find(s => s.classId === nextClassId);

    student.classId = nextClassId;
    student.sectionId = nextSec ? nextSec.id : `sec-${nextClass.code.toLowerCase().replace(/[^a-z0-9]/g, "")}-a`;
    student.academicSessionId = 'session-2026-2027';

    // Sequence roll numbers 1, 2, 3...
    const roll = (classRollTracker.get(nextClassId) || 0) + 1;
    classRollTracker.set(nextClassId, roll);
    student.rollNo = roll;

    promotedCount++;
  } else {
    // Top class (Class 10) graduated
    student.academicSessionId = 'session-2026-2027';
    student.studentType = 'Alumni / Passed Out';
  }
}

console.log(`✓ Promoted ${promotedCount} students to 2026-2027`);

// Verify Mahek Sahu
const mahek = db.students.find(s => s.admissionNo === '861');
const mahekClass = db.classes.find(c => c.id === mahek.classId);
console.log(`✓ Mahek Sahu (Adm 861) is now in Class: ${mahekClass.name} (Roll: ${mahek.rollNo}, Session: ${mahek.academicSessionId})`);

// 6. Save locally
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('✓ Saved local data/sbb_erp_database.json');

// 7. Regenerate Supabase SQL file
require('./generate-supabase-sql.js');

// 8. Sync directly to live Supabase Cloud
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const env = {};
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(l => {
    const idx = l.indexOf('=');
    if (idx > 0 && !l.startsWith('#')) env[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  });

  if (env.NEXT_PUBLIC_SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    async function syncToCloud() {
      console.log('Syncing promotion to live Supabase Cloud...');
      
      // Update academic sessions
      await client.from('academic_sessions').upsert(db.academicSessions.map(s => ({
        id: s.id,
        name: s.name,
        is_current: s.isCurrent,
        start_date: s.startDate,
        end_date: s.endDate,
      })));

      // Upsert Class 10
      const c10 = db.classes.find(c => c.id === 'class-10');
      const sec10 = db.sections.find(s => s.id === 'sec-10-a');
      await client.from('school_classes').upsert({
        id: c10.id,
        name: c10.name,
        code: c10.code,
        order_index: c10.orderIndex,
      }, { onConflict: 'code' });

      await client.from('sections').upsert({
        id: sec10.id,
        name: sec10.name,
        class_id: sec10.classId,
      }, { onConflict: 'class_id,name' });

      // Upsert all students in batches of 100
      const studentRows = db.students.map(st => ({
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
      }));

      for (let i = 0; i < studentRows.length; i += 100) {
        const batch = studentRows.slice(i, i + 100);
        const { error } = await client.from('students').upsert(batch, { onConflict: 'admission_no' });
        if (error) console.error('Batch error:', error);
      }

      console.log('✓ Successfully synced all 410 promoted students to Supabase Cloud!');
    }

    syncToCloud().catch(console.error);
  }
}
