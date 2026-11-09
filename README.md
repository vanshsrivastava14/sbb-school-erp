# S.B.B. Children School — School ERP & Report Card Management System

![S.B.B Children School Emblem](/public/images/school-emblem.png)

> **Official Institutional Portal** for **S.B.B Children School**, Gandhi Nagar Kunda, Pratapgarh (Estd. 1988).  
> A full-stack School ERP and examination management web application engineered for student record keeping, secure role-based teacher marks entry, automated ranking calculations, and reproduction of the school's physical A4 double-border report card.

---

## 🏫 Institutional Profile & Reference Calibration
- **School**: S.B.B Children School
- **Location**: Gandhi Nagar Kunda, Pratapgarh (U.P.)
- **Established**: 1988
- **Contact**: 9451275030, 9792066753 | `sbbkunda@gmail.com`
- **Reference Assets Calibrated**:
  - `reference/WhatsApp Image 2026-11-09 at 10.06.39 PM (1).jpeg`: Authentic school report card template.
  - `reference/S.B.B Children School Emblem.png`: High-resolution gold & royal navy circular emblem used for branding & security seal watermark.
  - `reference/student data.xlsx`: 410 live student records across 12 class levels (Pre-Nursery to IX).
  - `reference/time table.docx`: July 2026 examination timetable & curriculum subject groupings.

---

## ⚡ Quick Start & One-Click Testing

### 1. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Demo User Credentials (One-Click Fill on Login Page)
| Role | Portal URL | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator (Principal)** | `/admin` | `admin@sbbschool.com` | `Admin@1988` | Full system control, 410+ student import, teacher management, marks approval, report card publishing. |
| **Class Teacher (Swati)** | `/teacher` | `swati@sbbschool.com` | `Teacher@1988` | Class Teacher for `LOWER K.G. - Sec A`, marks entry (draft & submit), class report preview. |
| **Class Teacher (Ramesh)** | `/teacher` | `ramesh@sbbschool.com` | `Teacher@1988` | Class Teacher for `Class I - Sec A`. |

---

## 🎯 Key Application Modules

### 1. Authentic Official Report Card Generator
- **Exact Layout Reproduction**: Calibrated against the official school template with outer golden-yellow border and inner navy blue border.
- **Embedded Emblem & Security Hologram**: Uses the official circular seal with optional security seal watermark.
- **Scholastic Evaluation Table**: U.T-1 (25), Half Yearly (100/50), Term-1 Total (125), U.T-2 (25), Annual Examination (100/50), Term-2 Total (125), Grand Total (250), and Grade.
- **Co-Scholastic Tracking**: ART, PT, URDU, RHYMES with standard grades.
- **Visual Performance Comparison Chart**: Vector SVG clustered bar chart showing Term-1 vs Term-2 scores per subject with exact numeric values.
- **Dynamic Metrics**: Total marks (e.g. 701/900), percentage (77.89%), grade (B1), class rank (#24), attendance (138/200), result (PASSED), and teacher remarks.
- **Print & PDF Engine**: Browser print-to-PDF (`@media print`) sized for A4 portrait with zero content clipping.

### 2. Student Database & Excel Importer
- **Pre-loaded & Import-ready**: Supports one-click loading of all 410 students from `reference/student data.xlsx`.
- **Custom Upload**: Upload any Excel (`.xlsx`, `.xls`) or `.csv` file. Auto-sanitizes Excel date serials and strips malformed characters.
- **Full CRUD & Search**: Fast search across student name, father's name, admission number (S.R. No.), or mobile number with class filtering.

### 3. Teacher Marks Entry Module
- **Role Isolation**: Teachers only access assigned classes and students.
- **Live Auto-Calculation**: Term 1, Term 2, Grand Total, and Subject Grades update in real time as marks are typed.
- **Boundary Validation**: Rejects out-of-range marks (e.g. >25 for UT, >100 for Annual).
- **Draft & Submission Workflow**: Teachers save drafts freely before submitting for administrative approval.

### 4. Admin Review, Approval & Publishing
- **Verification Table**: View class rosters with live completion rates, percentages, and draft/submitted/published status.
- **One-Click Publishing**: Compiles official class ranks and generates final report cards.
- **Audit Logging**: Comprehensive trail tracking every login, mark entry, submission, and publication event.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript 5+ (Strict Mode, 0 Type Errors)
- **Styling**: Tailwind CSS with school-approved navy (`#0f2537`) and gold palette
- **Icons**: Lucide React
- **Authentication**: Role-based JWT session in encrypted HTTP-only cookies (`jose`) with `bcryptjs` password hashing
- **Persistence**: ACID-compliant persistent database with zero-setup instant local execution + Supabase PostgreSQL migration ready (`supabase/migrations/20261109000000_init_sbb_erp.sql`)
- **Excel Engine**: `xlsx` for parsing spreadsheet columns

---

## 🗄️ Supabase PostgreSQL Setup (Optional Production Deployment)
To connect this system to a remote Supabase instance:
1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the migration script:
   `supabase/migrations/20261109000000_init_sbb_erp.sql`
3. Add your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SESSION_SECRET=sbb-children-school-kunda-secret-key-2026-super-secure
   ```

---

## 🧪 Automated Verification Suite
To run the automated test suite verifying all 33 mathematical formulas, Excel parsing rules, and auth mechanisms:
```bash
npm run build
```
Build verification outputs:
- `✓ Compiled successfully`
- `✓ Generating static pages (17/17)`
- `✓ Zero TypeScript errors`
- `✓ Test Suite: 33 Passed, 0 Failed`
