# S.B.B Children School ERP — Deployment & Production Guide

This guide explains how to:
1. **Fix the Windows PowerShell script error** (`npm.ps1 cannot be loaded`).
2. **Run and test locally** with all 12 Class Teachers and Admin powers.
3. **Connect to Supabase** (Cloud PostgreSQL database).
4. **Deploy to Vercel** for 24/7 online production access.

---

## 1. Quick Fix for Windows PowerShell Script Error

The error `File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system` is a default Windows PowerShell security setting that prevents `.ps1` scripts from running.

Choose **any one** of these 3 easy solutions:

### Solution A: Unlock PowerShell (Recommended — 5 seconds)
1. In your PowerShell window, run:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```
2. Press `Y` and hit **Enter**.
3. Now run:
   ```powershell
   npm run dev
   ```
   It will start immediately without errors!

### Solution B: Double-click `run-dev.bat`
We included a one-click launcher `run-dev.bat` in the project root folder.
Simply double-click `run-dev.bat` in File Explorer, or in PowerShell type:
```powershell
.\run-dev.bat
```

### Solution C: Use `npm.cmd`
Type `npm.cmd` instead of `npm`:
```powershell
npm.cmd run dev
```

---

## 2. All 12 Classes & Designated Class Teachers

Every single class in S.B.B Children School now has its own designated Class Teacher pre-configured and assigned:

| Class | Class Teacher | Login Email | Default Password |
|---|---|---|---|
| **Play Group** | Sunita Sharma | `sunita@sbbschool.com` | `teacher123` |
| **L.K.G** | Manoj Singh | `manoj@sbbschool.com` | `teacher123` |
| **U.K.G** | Priya Mishra | `priya@sbbschool.com` | `teacher123` |
| **Class 1** | Rajesh Yadav | `rajesh@sbbschool.com` | `teacher123` |
| **Class 2** | Anita Gupta | `anita@sbbschool.com` | `teacher123` |
| **Class 3** | Swati | `swati@sbbschool.com` | `teacher123` |
| **Class 4** | Pooja Tiwari | `pooja@sbbschool.com` | `teacher123` |
| **Class 5** | Anjali Verma | `anjali@sbbschool.com` | `teacher123` |
| **Class 6** | Dharmendra Kumar | `dharmendra@sbbschool.com` | `teacher123` |
| **Class 7** | Rekha Patel | `rekha@sbbschool.com` | `teacher123` |
| **Class 8** | Suresh Pandey | `suresh@sbbschool.com` | `teacher123` |
| **Class 9** | Ramesh Kumar | `ramesh@sbbschool.com` | `teacher123` |

### Admin Login
- **URL**: `http://localhost:3000/login`
- **Email**: `admin@sbbschool.com`
- **Password**: `admin123`

---

## 3. Admin Dynamic Powers

As an administrator, you have full control over the school structure:

1. **Add New Classes & Sections**:
   - Navigate to `/admin/classes`.
   - Click **+ Add New Class**.
   - Enter class name (e.g. `Class 10`), code (`10`), order index, and optionally assign an existing or new teacher as its Class Teacher.
   - The class immediately becomes available across student registration, marks entry, and report card generation.

2. **Add Students Individually**:
   - Navigate to `/admin/students`.
   - Click **+ Add Student**.
   - Fill in Admission No, Roll No, Student Name, Father's Name, Mother's Name, DOB, Mobile, and select Class/Section.

3. **Import Real Excel Roster**:
   - Click **Upload Excel File** or click **⚡ Load 410 Reference Students** to instantly populate the full student dataset with sanitized birthdates, Aadhaar numbers, and parent contacts.

4. **Audit and Publish Marks**:
   - Navigate to `/admin/marks`.
   - Review teacher submissions, verify calculations, and click **Publish All Marks**.
   - Report cards are automatically generated with ranks, percentages, and official grades!

---

## 4. Going to Production: Supabase (Cloud PostgreSQL Database)

To take this application live for the school, connect it to a free Supabase cloud PostgreSQL instance:

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **Start your project** (free).
2. Sign in with GitHub or email.
3. Click **New Project**:
   - Name: `sbb-school-erp`
   - Database Password: Choose a strong password (save this safely).
   - Region: Select **South Asia (Mumbai)** for lowest latency in India.
4. Click **Create new project** and wait ~1 minute for provisioning.

### Step 2: Run the Database Schema & Data Migration
1. In your Supabase dashboard, click the **SQL Editor** tab on the left sidebar.
2. Click **+ New Query**.
3. Open the file `supabase/migrations/20261109000000_init_sbb_erp.sql` in this project.
4. Copy the entire file contents and paste them into the Supabase SQL Editor.
5. Click **Run** (green button).
   - This creates all 10 relational tables, indexes, and imports all 12 classes, 12 teachers, and all 410 students with exact data!

### Step 3: Copy Your Supabase API Keys
1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon public key** (`eyJhbGci...`)
   - **service_role secret key** (`eyJhbGci...`)

### Step 4: Add to `.env.local`
In your project folder, update `.env.local`:
```env
SESSION_SECRET=sbb-children-school-kunda-jwt-production-secret-key-32-chars-min
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## 5. Deploying to Vercel (1-Click Hosting)

Vercel provides free, high-performance hosting optimized for Next.js applications:

### Step 1: Push Project to GitHub
1. Create a private or public repository on [github.com](https://github.com) named `sbb-school-erp`.
2. In PowerShell, run:
   ```bash
   git init
   git add .
   git commit -m "feat: complete SBB school ERP with 12 class teachers and Supabase migration"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/sbb-school-erp.git
   git push -u origin main
   ```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your `sbb-school-erp` repository and click **Import**.
4. In the **Environment Variables** section, add:
   - `SESSION_SECRET`: `sbb-children-school-kunda-jwt-production-secret-key-32-chars-min`
   - `NEXT_PUBLIC_SUPABASE_URL`: (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (your Supabase anon key)
   - `SUPABASE_SERVICE_ROLE_KEY`: (your Supabase service role key)
5. Click **Deploy**.
6. In about 60 seconds, your application will be live at `https://sbb-school-erp.vercel.app` (or your custom school domain)!

---

## 6. Official Report Card Verification
The generated report card at `/admin/reports` and `/teacher/reports` reproduces the exact physical school document:
- **School**: S.B.B. CHILDREN SCHOOL (Reg. No. 1774/2004-2005, Estd. 1988)
- **Hologram & Seal**: Authentic high-res circular school emblem and watermark.
- **Student Profile**: Mahek Sahu (Class: 5-A, Roll: 1, Adm No: 861).
- **Marks Table**: Accurate 4-term breakdown (UT-1, Half Yearly, UT-2, Annual Exam).
- **Arithmetic**: 701/900 (77.89%), Grade B-1, Rank #24.
- **Chart**: Clustered vector bar chart comparing subject performance against maximum marks.
- **Print Layout**: 1-click A4 print preview with precise margins and page breaks.
