import json
import os
import re
from collections import defaultdict
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, "data", "sbb_erp_database.json")
REF_DIR = os.path.join(ROOT, "reference")

LEFT_LABELS = [
    "Admission No.", "Class Name", "House Name", "Student Name",
    "Blood Group", "Mobile No.", "Religion Name", "Date of Registration",
    "Father Name", "Father Occupation", "State", "Aadhaar No", "Fees Type"
]

RIGHT_LABELS = [
    "Session Name", "Section", "Roll No.", "Gender", "E-mail",
    "Category", "Date of Birth", "Mother Name", "Village",
    "City", "Permanent Address", "Fees Date"
]

RIGHT_MARKERS = {"Session", "Section", "Gender", "E-mail", "Category", "Mother", "Village", "Permanent"}

# Exact mapping of each class PDF -> ERP class definition
CLASS_DEFINITIONS = [
    {"pdf": "PG.pdf",      "id": "class-pn",    "name": "PRE-NURSERY", "code": "PN",   "orderIndex": 1,  "secId": "sec-pn-a",   "subjTemplate": "class-pn", "teacherId": "user-teacher-anjali"},
    {"pdf": "LKG.pdf",     "id": "class-lkg",   "name": "LOWER K.G.",  "code": "LKG",  "orderIndex": 2,  "secId": "sec-lkg-a",  "subjTemplate": "class-lkg","teacherId": "user-teacher-swati"},
    {"pdf": "UKG.pdf",     "id": "class-ukg",   "name": "UPPER K.G.",  "code": "UKG",  "orderIndex": 3,  "secId": "sec-ukg-a",  "subjTemplate": "class-ukg","teacherId": "user-teacher-pooja"},
    {"pdf": "1ST.pdf",     "id": "class-1",     "name": "I",           "code": "1",    "orderIndex": 4,  "secId": "sec-1-a",    "subjTemplate": "class-1",  "teacherId": "user-teacher-ramesh"},
    {"pdf": "2ND.pdf",     "id": "class-2",     "name": "II",          "code": "2",    "orderIndex": 5,  "secId": "sec-2-a",    "subjTemplate": "class-2",  "teacherId": "user-teacher-sunita"},
    {"pdf": "3RD.pdf",     "id": "class-3",     "name": "III",         "code": "3",    "orderIndex": 6,  "secId": "sec-3-a",    "subjTemplate": "class-3",  "teacherId": "user-teacher-manoj"},
    {"pdf": "4TH.pdf",     "id": "class-4",     "name": "IV",          "code": "4",    "orderIndex": 7,  "secId": "sec-4-a",    "subjTemplate": "class-4",  "teacherId": "user-teacher-priya"},
    {"pdf": "5TH.pdf",     "id": "class-5",     "name": "V",           "code": "5",    "orderIndex": 8,  "secId": "sec-5-a",    "subjTemplate": "class-5",  "teacherId": "user-teacher-rajesh"},
    {"pdf": "6TH.pdf",     "id": "class-6",     "name": "VI",          "code": "6",    "orderIndex": 9,  "secId": "sec-6-a",    "subjTemplate": "class-6",  "teacherId": "user-teacher-anita"},
    {"pdf": "7TH.pdf",     "id": "class-7",     "name": "VII",         "code": "7",    "orderIndex": 10, "secId": "sec-7-a",    "subjTemplate": "class-7",  "teacherId": "user-teacher-dharmendra"},
    {"pdf": "8TH.pdf",     "id": "class-8",     "name": "VIII (E.M)",  "code": "8",    "orderIndex": 11, "secId": "sec-8-a",    "subjTemplate": "class-8",  "teacherId": "user-teacher-rekha"},
    {"pdf": "8TH HM.pdf",  "id": "class-8-hm",  "name": "VIII (H.M)",  "code": "8HM",  "orderIndex": 12, "secId": "sec-8hm-a",  "subjTemplate": "class-8",  "teacherId": "user-teacher-8hm"},
    {"pdf": "9TH.pdf",     "id": "class-9",     "name": "IX (E.M)",    "code": "9",    "orderIndex": 13, "secId": "sec-9-a",    "subjTemplate": "class-9",  "teacherId": "user-teacher-suresh"},
    {"pdf": "9TH HM.pdf",  "id": "class-9-hm",  "name": "IX (H.M)",    "code": "9HM",  "orderIndex": 14, "secId": "sec-9hm-a",  "subjTemplate": "class-9",  "teacherId": "user-teacher-9hm"},
    {"pdf": "10TH.pdf",    "id": "class-10-hm", "name": "X (H.M)",     "code": "10HM", "orderIndex": 15, "secId": "sec-10hm-a", "subjTemplate": "class-9",  "teacherId": "user-teacher-10hm"},
]

NEW_HM_TEACHERS = [
    {
        "id": "user-teacher-8hm",
        "email": "class8hm@sbbschool.com",
        "fullName": "Class VIII (H.M) Teacher",
        "role": "teacher",
        "isActive": True,
    },
    {
        "id": "user-teacher-9hm",
        "email": "class9hm@sbbschool.com",
        "fullName": "Class IX (H.M) Teacher",
        "role": "teacher",
        "isActive": True,
    },
    {
        "id": "user-teacher-10hm",
        "email": "class10hm@sbbschool.com",
        "fullName": "Class X (H.M) Teacher",
        "role": "teacher",
        "isActive": True,
    },
]


def group_lines(words, tol=3.5):
    bands = []
    for w in sorted(words, key=lambda x: ((x[1] + x[3]) / 2, x[0])):
        yc = (w[1] + w[3]) / 2
        if not bands or abs(yc - bands[-1]["yc"]) > tol:
            bands.append({"yc": yc, "words": [w]})
        else:
            bands[-1]["words"].append(w)
            bands[-1]["yc"] = sum((x[1] + x[3]) / 2 for x in bands[-1]["words"]) / len(bands[-1]["words"])
    for b in bands:
        b["words"].sort(key=lambda x: x[0])
        b["text"] = " ".join(w[4] for w in b["words"]).strip()
    return bands


def parse_pdf(pdf_path):
    doc = pymupdf.open(pdf_path)
    records = []
    current = None

    for page in doc:
        words = page.get_text("words")
        if not words:
            continue

        filtered_words = []
        for line in group_lines(words, tol=3.5):
            t = line["text"]
            if "sbbcspk.eskooltech.com" in t:
                continue
            if re.match(r"^\d{1,2}/\d{1,2}/\d{4},?\s+\d{1,2}:\d{2}", t):
                continue
            if re.match(r"^\d+/\d+$", t):
                continue
            if "SBB CHILDREN SCHOOL" in t or "GANDHI NAGAR KUNDA" in t or "9451275030" in t:
                continue
            if t == "Student Information":
                continue
            filtered_words.extend(line["words"])

        if not filtered_words:
            continue

        marker_xs = [w[0] for w in filtered_words if w[4] in RIGHT_MARKERS and w[0] > 200]
        split_x = min(marker_xs) - 5.0 if marker_xs else (page.rect.width * 0.48)

        left_words_all = [w for w in filtered_words if w[0] < split_x]
        right_words_all = [w for w in filtered_words if w[0] >= split_x]

        left_label_end_xs = []
        if left_words_all:
            left_min_x = min(w[0] for w in left_words_all)
            for lband in group_lines(left_words_all, tol=3.0):
                lw = [w for w in lband["words"] if w[0] < (left_min_x + 115)]
                lt = " ".join(w[4] for w in lw).strip()
                for lbl in LEFT_LABELS:
                    if lt == lbl or lt.startswith(lbl + " "):
                        n = len(lbl.split())
                        if len(lband["words"]) >= n and " ".join(w[4] for w in lband["words"][:n]) == lbl:
                            left_label_end_xs.append(lband["words"][n - 1][2])
                        break
        left_val_x = (max(left_label_end_xs) + 3.0) if left_label_end_xs else 140.0

        right_label_end_xs = []
        if right_words_all:
            right_min_x = min(w[0] for w in right_words_all)
            for rband in group_lines(right_words_all, tol=3.0):
                rw = [w for w in rband["words"] if w[0] < (right_min_x + 110)]
                rt = " ".join(w[4] for w in rw).strip()
                for lbl in RIGHT_LABELS:
                    if rt == lbl or rt.startswith(lbl + " "):
                        n = len(lbl.split())
                        if len(rband["words"]) >= n and " ".join(w[4] for w in rband["words"][:n]) == lbl:
                            right_label_end_xs.append(rband["words"][n - 1][2])
                        break
        right_val_x = (max(right_label_end_xs) + 3.0) if right_label_end_xs else (split_x + 100.0)

        left_lbl_words = [w for w in left_words_all if w[0] < left_val_x]
        left_val_words = [w for w in left_words_all if w[0] >= left_val_x]
        right_lbl_words = [w for w in right_words_all if w[0] < right_val_x]
        right_val_words = [w for w in right_words_all if w[0] >= right_val_x]

        left_anchors = []
        for b in group_lines(left_lbl_words, tol=3.0):
            for lbl in LEFT_LABELS:
                if b["text"] == lbl:
                    left_anchors.append({"yc": b["yc"], "label": lbl})
                    break

        right_anchors = []
        for b in group_lines(right_lbl_words, tol=3.0):
            for lbl in RIGHT_LABELS:
                if b["text"] == lbl:
                    right_anchors.append({"yc": b["yc"], "label": lbl})
                    break

        left_vals_map = defaultdict(list)
        for line in group_lines(left_val_words, tol=3.0):
            if left_anchors:
                idx = min(range(len(left_anchors)), key=lambda i: abs(left_anchors[i]["yc"] - line["yc"]))
                left_vals_map[idx].append(line["text"])

        right_vals_map = defaultdict(list)
        for line in group_lines(right_val_words, tol=3.0):
            if right_anchors:
                idx = min(range(len(right_anchors)), key=lambda i: abs(right_anchors[i]["yc"] - line["yc"]))
                right_vals_map[idx].append(line["text"])

        events = []
        for i, a in enumerate(left_anchors):
            events.append((a["yc"], 0, a["label"], " ".join(left_vals_map[i]).strip()))
        for i, a in enumerate(right_anchors):
            events.append((a["yc"], 1, a["label"], " ".join(right_vals_map[i]).strip()))
        events.sort(key=lambda e: (round(e[0], 1), e[1]))

        for _, _, lbl, val in events:
            if lbl == "Admission No.":
                if current:
                    records.append(current)
                current = {"_source": os.path.basename(pdf_path)}
            if current is not None:
                current[lbl] = val

    if current:
        records.append(current)
    return records


def clean_mobile(raw):
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)
    if digits == "9451275030" or digits == "9792066753":
        return ""
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits or raw.strip()


def normalize_gender(raw):
    g = (raw or "").strip().upper()
    if g.startswith("F"):
        return "F"
    if g.startswith("M"):
        return "M"
    return "Other"


def main():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)

    # Set active session to 2026-2027
    for s in db["academicSessions"]:
        s["isCurrent"] = (s["id"] == "session-2026-2027")

    # Get default teacher passwordHash (from swati / first teacher)
    default_teacher_hash = next((u["passwordHash"] for u in db["users"] if u["role"] == "teacher"), None)
    if not default_teacher_hash:
        raise RuntimeError("No existing teacher found to borrow default passwordHash")

    now_iso = "2026-11-12T08:30:00.000Z"

    # Ensure 3 dedicated Hindi Medium teachers exist
    for hm_t in NEW_HM_TEACHERS:
        if not any(u["id"] == hm_t["id"] for u in db["users"]):
            db["users"].append({
                "id": hm_t["id"],
                "email": hm_t["email"],
                "passwordHash": default_teacher_hash,
                "fullName": hm_t["fullName"],
                "role": hm_t["role"],
                "isActive": True,
                "createdAt": now_iso,
                "updatedAt": now_iso,
            })

    # Rebuild classes & sections strictly matching all 15 PDF classes
    db["classes"] = [
        {"id": c["id"], "name": c["name"], "code": c["code"], "orderIndex": c["orderIndex"]}
        for c in CLASS_DEFINITIONS
    ]
    db["sections"] = [
        {"id": c["secId"], "name": "A", "classId": c["id"]}
        for c in CLASS_DEFINITIONS
    ]

    # Rebuild clean 1-to-1 class teacher assignments (no duplicates, separate H.M & E.M teachers)
    db["teacherAssignments"] = [
        {
            "id": f"assign-{c['teacherId']}-{c['id']}",
            "teacherId": c["teacherId"],
            "classId": c["id"],
            "sectionId": c["secId"],
            "subjectId": None,
            "isClassTeacher": True,
        }
        for c in CLASS_DEFINITIONS
    ]

    # Ensure classSubjects exist for the 3 H.M classes (copying from their matching E.M grade)
    existing_cs = list(db["classSubjects"])
    valid_class_ids = {c["id"] for c in CLASS_DEFINITIONS}
    new_cs = [cs for cs in existing_cs if cs["classId"] in valid_class_ids]
    for c in CLASS_DEFINITIONS:
        if not any(cs["classId"] == c["id"] for cs in new_cs):
            template_rows = [cs for cs in existing_cs if cs["classId"] == c["subjTemplate"]]
            for tmpl in template_rows:
                new_cs.append({
                    "id": f"cs-{c['id']}-{tmpl['subjectId']}",
                    "classId": c["id"],
                    "subjectId": tmpl["subjectId"],
                    "maxUt1": tmpl["maxUt1"],
                    "maxHalfYearly": tmpl["maxHalfYearly"],
                    "maxUt2": tmpl["maxUt2"],
                    "maxAnnual": tmpl["maxAnnual"],
                    "orderIndex": tmpl["orderIndex"],
                })
    db["classSubjects"] = new_cs

    # Parse all 15 PDFs and rebuild students list cleanly
    seen_exact = set()  # (classId, admNo, studentName, fatherName)
    used_adm_nos = defaultdict(int)
    rebuilt_students = []
    collision_notes = []
    skipped_exact = []

    for c in CLASS_DEFINITIONS:
        pdf_path = os.path.join(REF_DIR, c["pdf"])
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"Missing PDF: {pdf_path}")

        recs = parse_pdf(pdf_path)
        for idx, r in enumerate(recs, start=1):
            raw_adm = r.get("Admission No.", "").strip()
            name = " ".join(r.get("Student Name", "").split()).upper()
            father = " ".join(r.get("Father Name", "").split()).upper()
            mother = " ".join(r.get("Mother Name", "").split()).upper()

            exact_key = (c["id"], raw_adm, name, father)
            if exact_key in seen_exact:
                skipped_exact.append((c["name"], raw_adm, name))
                continue
            seen_exact.add(exact_key)

            # Guarantee unique admissionNo for Postgres UNIQUE constraint while preserving real S.R.
            used_adm_nos[raw_adm] += 1
            if used_adm_nos[raw_adm] == 1:
                final_adm = raw_adm
            else:
                # If same class already has this adm, append sequence; otherwise append class code
                same_class_count = sum(1 for s in rebuilt_students if s["classId"] == c["id"] and s["admissionNo"].split("/")[0] == raw_adm)
                suffix = f"{c['code']}-{same_class_count + 1}" if same_class_count > 0 else c["code"]
                final_adm = f"{raw_adm}/{suffix}"
                collision_notes.append((c["name"], name, raw_adm, final_adm))

            roll_str = re.sub(r"\D", "", r.get("Roll No.", ""))
            roll_no = int(roll_str) if roll_str else 0

            perm_addr = " ".join(r.get("Permanent Address", "").split()).upper()
            village = " ".join(r.get("Village", "").split()).upper()
            city = " ".join(r.get("City", "").split()).upper()
            if perm_addr:
                addr = perm_addr
            elif village and city:
                addr = f"{village}, {city}"
            elif village:
                addr = village
            else:
                addr = ""

            student_obj = {
                "id": f"stu-{c['code'].lower()}-{len(rebuilt_students) + 1}",
                "admissionNo": final_adm,
                "rollNo": roll_no,
                "studentName": name,
                "gender": normalize_gender(r.get("Gender")),
                "dob": r.get("Date of Birth", "").strip() or "01/01/2015",
                "doa": r.get("Date of Registration", "").strip() or "01/04/2026",
                "aadharNo": re.sub(r"\D", "", r.get("Aadhaar No", "")) or None,
                "fatherName": father,
                "motherName": mother,
                "mobile": clean_mobile(r.get("Mobile No.", "")),
                "address": addr,
                "religion": (r.get("Religion Name", "") or "").strip() or None,
                "casteCategory": (r.get("Category", "") or "").strip() or None,
                "studentType": (r.get("Fees Type", "") or "Regular").strip(),
                "classId": c["id"],
                "sectionId": c["secId"],
                "academicSessionId": "session-2026-2027",
                "isActive": True,
                "createdAt": now_iso,
            }
            # Remove None keys for cleaner JSON while keeping schema compatibility
            student_obj = {k: v for k, v in student_obj.items() if v is not None}
            rebuilt_students.append(student_obj)

        cnt = sum(1 for s in rebuilt_students if s["classId"] == c["id"])
        print(f"Class {c['name']:12s} ({c['code']:4s}) | {cnt:2d} students | teacher: {c['teacherId']}")

    # Clean wipe old session marks, report cards, audit logs
    db["students"] = rebuilt_students
    db["marks"] = []
    db["reportCards"] = []
    db["auditLogs"] = [
        {
            "id": "audit-rebuild-2026-2027",
            "userId": "user-admin-1",
            "userName": "Principal S.B.B Children School",
            "action": "REBUILD_FROM_PDFS",
            "entity": "students",
            "entityId": "all",
            "details": f"Replaced previous session data cleanly with {len(rebuilt_students)} verified 2026-2027 students across 15 classes (including separate H.M & E.M classes).",
            "timestamp": now_iso,
        }
    ]

    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(rebuilt_students)} students to {DB_PATH}")
    print(f"Skipped exact duplicates ({len(skipped_exact)}): {skipped_exact}")
    print(f"Unique admissionNo suffix adjustments ({len(collision_notes)}):")
    for cn in collision_notes:
        print(" ", cn)


if __name__ == "__main__":
    main()
