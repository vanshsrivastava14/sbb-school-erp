const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const dbPath = path.join(__dirname, '..', 'data', 'sbb_erp_database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

let clearedCount = 0;
for (const student of db.students) {
  if (student.mobile === '9451275030') {
    student.mobile = '';
    clearedCount++;
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✓ Cleared admin phone number from ${clearedCount} students in local DB.`);

// Regenerate SQL
require('./generate-supabase-sql.js');

// Sync to Supabase Cloud
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
      console.log('Syncing updated student mobile numbers to Supabase Cloud...');
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
        if (error) console.error('Cloud batch error:', error);
      }
      console.log('✓ Successfully synced all updated student mobile numbers to Supabase Cloud!');
    }

    syncToCloud().catch(console.error);
  }
}
