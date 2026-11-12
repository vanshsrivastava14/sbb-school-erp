import json
import os
import re
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, "data", "sbb_erp_database.json")
OUT_BASE = os.path.join(ROOT, "exports", "marks-filling-sheets")

EXAMS = [
    ("UT1", "UT - 1", "maxUt1"),
    ("HALF_YEARLY", "HALF YEARLY", "maxHalfYearly"),
    ("UT2", "UT - 2", "maxUt2"),
    ("ANNUAL", "ANNUAL", "maxAnnual"),
]


def safe_name(s):
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")


def fit_textbox(page, rect, text, fontsize=7.5, bold=False, align=pymupdf.TEXT_ALIGN_CENTER):
    r = pymupdf.Rect(rect)
    fontname = "hebo" if bold else "helv"
    # Shrink font down to 4.2pt if any single line is wider or taller than inner rect
    fs = fontsize
    while fs >= 4.2:
        inner = pymupdf.Rect(r.x0 + 1.5, r.y0 + 1.5, r.x1 - 1.5, r.y1 - 1.5)
        lines = text.split("\n")
        max_lw = max(pymupdf.get_text_length(ln, fontname=fontname, fontsize=fs) for ln in lines)
        total_h = len(lines) * (fs * 1.25)
        if max_lw <= inner.width and total_h <= inner.height:
            pad_y = max(0.0, (inner.height - total_h) / 2.0)
            target = pymupdf.Rect(inner.x0, inner.y0 + pad_y, inner.x1, inner.y1)
            rc = page.insert_textbox(target, text, fontsize=fs, fontname=fontname, color=(0, 0, 0), align=align)
            if rc >= 0:
                return
        fs -= 0.4
    # Final guaranteed draw with insert_text centered
    lines = text.split("\n")
    total_h = len(lines) * (4.2 * 1.2)
    start_y = r.y0 + max(5.0, (r.height - total_h) / 2.0) + 4.0
    for idx, ln in enumerate(lines):
        lw = pymupdf.get_text_length(ln, fontname=fontname, fontsize=4.2)
        tx = r.x0 + 2.0 if align == pymupdf.TEXT_ALIGN_LEFT else (r.x0 + max(1.0, (r.width - lw) / 2.0))
        page.insert_text((tx, start_y + idx * 5.2), ln, fontsize=4.2, fontname=fontname, color=(0, 0, 0))


def draw_cell(page, rect, text, fontsize=7.5, bold=False, align=pymupdf.TEXT_ALIGN_CENTER, fill=None, border=0.6):
    r = pymupdf.Rect(rect)
    if fill:
        page.draw_rect(r, color=(0, 0, 0), fill=fill, width=border)
    else:
        page.draw_rect(r, color=(0, 0, 0), width=border)
    if text:
        fit_textbox(page, r, text, fontsize=fontsize, bold=bold, align=align)


def draw_sheet_header(page, cls, exam_title, exam_max_field, scholastic, co_scholastic, session_label, page_no, total_pages):
    W = page.rect.width  # 595.28 for A4
    margin_x = 20.0
    usable_w = W - 2 * margin_x
    y = 18.0

    # Top box: School Name & Address
    box_h = 36.0
    page.draw_rect(pymupdf.Rect(margin_x, y, W - margin_x, y + box_h), color=(0, 0, 0), width=0.8)
    fit_textbox(
        page,
        (margin_x + 4, y + 1, W - margin_x - 4, y + 21),
        "SBB CHILDREN SCHOOL",
        fontsize=12, bold=True, align=pymupdf.TEXT_ALIGN_CENTER
    )
    fit_textbox(
        page,
        (margin_x + 4, y + 19, W - margin_x - 4, y + 35),
        "GANDHI NAGAR KUNDA PBH. 9451275030, 9792066753",
        fontsize=8, bold=True, align=pymupdf.TEXT_ALIGN_CENTER
    )
    y += box_h

    # Sub-strip: Session & Page
    sub_h = 18.0
    page.draw_rect(pymupdf.Rect(margin_x, y, W - margin_x, y + sub_h), color=(0, 0, 0), fill=(0.95, 0.95, 0.95), width=0.8)
    fit_textbox(
        page,
        (margin_x + 5, y + 1, W - margin_x - 85, y + sub_h - 1),
        f"Marks Filling Sheet : Academic Session - {session_label}",
        fontsize=8, bold=True, align=pymupdf.TEXT_ALIGN_LEFT
    )
    fit_textbox(
        page,
        (W - margin_x - 85, y + 1, W - margin_x - 5, y + sub_h - 1),
        f"Page {page_no}/{total_pages}",
        fontsize=7.5, bold=False, align=pymupdf.TEXT_ALIGN_RIGHT
    )
    y += sub_h + 4.0

    # Column geometry
    w_roll = 25.0
    w_adm = 40.0
    w_att = 38.0
    w_pos = 34.0
    n_sch = len(scholastic)
    n_co = len(co_scholastic)
    n_marks = n_sch + n_co

    # Give Student Name reasonable width and split remaining cleanly across subject columns
    w_name = 104.0 if n_marks <= 10 else 92.0
    rem_w = usable_w - (w_roll + w_adm + w_name + w_att + w_pos)
    col_w_sch = (rem_w * (n_sch / max(1, n_sch + n_co * 0.78))) / max(1, n_sch)
    col_w_co = (rem_w - col_w_sch * n_sch) / max(1, n_co) if n_co > 0 else 0.0

    # Group Header Row
    gh_h = 26.0
    x = margin_x
    w_left_group = w_roll + w_adm + w_name
    draw_cell(page, (x, y, x + w_left_group, y + gh_h), f"Class: {cls['name']} (Sec A)", fontsize=8.5, bold=True, fill=(0.93, 0.93, 0.93))
    x += w_left_group

    if n_sch > 0:
        w_sch_total = col_w_sch * n_sch
        draw_cell(page, (x, y, x + w_sch_total, y + gh_h), exam_title, fontsize=9.5, bold=True, fill=(0.93, 0.93, 0.93))
        x += w_sch_total

    if n_co > 0:
        w_co_total = col_w_co * n_co
        draw_cell(page, (x, y, x + w_co_total, y + gh_h), "Part 2", fontsize=8, bold=True, fill=(0.93, 0.93, 0.93))
        x += w_co_total

    draw_cell(page, (x, y, x + w_att + w_pos, y + gh_h), "Remarks", fontsize=8, bold=True, fill=(0.93, 0.93, 0.93))
    y += gh_h

    # Subject Header Row
    sh_h = 30.0
    x = margin_x
    draw_cell(page, (x, y, x + w_roll, y + sh_h), "Roll\nNo.", fontsize=6.8, bold=True)
    x += w_roll
    draw_cell(page, (x, y, x + w_adm, y + sh_h), "Adm.\nNo.", fontsize=6.8, bold=True)
    x += w_adm
    draw_cell(page, (x, y, x + w_name, y + sh_h), "Student Name", fontsize=7.5, bold=True, align=pymupdf.TEXT_ALIGN_LEFT)
    x += w_name

    sub_font = 6.2 if n_marks >= 10 else 6.8
    for cs in scholastic:
        sname = cs["subjectName"]
        mmax = int(cs[exam_max_field])
        label = f"{sname}\n({mmax})"
        draw_cell(page, (x, y, x + col_w_sch, y + sh_h), label, fontsize=sub_font, bold=True)
        x += col_w_sch

    for cs in co_scholastic:
        draw_cell(page, (x, y, x + col_w_co, y + sh_h), f"{cs['subjectName']}\n(Gr)", fontsize=sub_font, bold=True)
        x += col_w_co

    draw_cell(page, (x, y, x + w_att, y + sh_h), "Attend.", fontsize=6.5, bold=True)
    x += w_att
    draw_cell(page, (x, y, x + w_pos, y + sh_h), "Pos.", fontsize=6.5, bold=True)
    y += sh_h

    col_widths = (margin_x, w_roll, w_adm, w_name, col_w_sch, col_w_co, w_att, w_pos)
    return y, col_widths


def render_exam_pages(doc, cls, students, scholastic, co_scholastic, exam_title, exam_max_field, session_label):
    rows_per_page = 30
    total_pages = max(1, (len(students) + rows_per_page - 1) // rows_per_page)
    row_h = 22.0

    for p_idx in range(total_pages):
        page = doc.new_page(width=595.28, height=841.89)  # A4 Portrait
        chunk = students[p_idx * rows_per_page : (p_idx + 1) * rows_per_page]
        y, (margin_x, w_roll, w_adm, w_name, col_w_sch, col_w_co, w_att, w_pos) = draw_sheet_header(
            page, cls, exam_title, exam_max_field, scholastic, co_scholastic, session_label, p_idx + 1, total_pages
        )

        for st in chunk:
            x = margin_x
            roll_txt = str(st["rollNo"]) if st.get("rollNo", 0) > 0 else ""
            draw_cell(page, (x, y, x + w_roll, y + row_h), roll_txt, fontsize=7.5)
            x += w_roll
            draw_cell(page, (x, y, x + w_adm, y + row_h), st["admissionNo"], fontsize=7)
            x += w_adm
            nm = st["studentName"]
            nm_font = 6.6 if len(nm) > 20 else 7.2
            draw_cell(page, (x, y, x + w_name, y + row_h), nm, fontsize=nm_font, bold=True, align=pymupdf.TEXT_ALIGN_LEFT)
            x += w_name

            for _ in scholastic:
                draw_cell(page, (x, y, x + col_w_sch, y + row_h), "")
                x += col_w_sch
            for _ in co_scholastic:
                draw_cell(page, (x, y, x + col_w_co, y + row_h), "")
                x += col_w_co
            draw_cell(page, (x, y, x + w_att, y + row_h), "")
            x += w_att
            draw_cell(page, (x, y, x + w_pos, y + row_h), "")
            y += row_h


def main():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)

    os.makedirs(OUT_BASE, exist_ok=True)
    packets_dir = os.path.join(OUT_BASE, "All_4_Exams_By_Class")
    os.makedirs(packets_dir, exist_ok=True)
    for ex_code, _, _ in EXAMS:
        os.makedirs(os.path.join(OUT_BASE, ex_code), exist_ok=True)

    subjects_by_id = {s["id"]: s for s in db["subjects"]}
    current_session = next((s for s in db["academicSessions"] if s.get("isCurrent")), db["academicSessions"][0])
    session_label = current_session["name"]

    classes = sorted(db["classes"], key=lambda c: c["orderIndex"])
    master_doc = pymupdf.open()
    total_files = 0

    for cls in classes:
        cls_students = sorted(
            [s for s in db["students"] if s["classId"] == cls["id"] and s.get("isActive", True)],
            key=lambda s: s["studentName"]
        )
        cs_list = sorted(
            [cs for cs in db["classSubjects"] if cs["classId"] == cls["id"]],
            key=lambda cs: cs["orderIndex"]
        )
        enriched = []
        for cs in cs_list:
            sub = subjects_by_id.get(cs["subjectId"], {"name": cs["subjectId"], "type": "scholastic"})
            enriched.append({**cs, "subjectName": sub["name"], "subjectType": sub["type"]})

        scholastic = [x for x in enriched if x["subjectType"] == "scholastic"]
        co_scholastic = [x for x in enriched if x["subjectType"] == "co_scholastic"]

        prefix = f"{cls['orderIndex']:02d}_{safe_name(cls['name'])}"
        packet_doc = pymupdf.open()

        for ex_code, ex_title, max_field in EXAMS:
            ex_doc = pymupdf.open()
            render_exam_pages(ex_doc, cls, cls_students, scholastic, co_scholastic, ex_title, max_field, session_label)
            ex_out = os.path.join(OUT_BASE, ex_code, f"{prefix}_{ex_code}.pdf")
            ex_doc.save(ex_out, deflate=True)
            packet_doc.insert_pdf(ex_doc)
            master_doc.insert_pdf(ex_doc)
            ex_doc.close()
            total_files += 1

        packet_out = os.path.join(packets_dir, f"{prefix}_ALL_4_EXAMS.pdf")
        packet_doc.save(packet_out, deflate=True)
        packet_doc.close()
        total_files += 1

    master_out = os.path.join(OUT_BASE, "ALL_15_CLASSES_ALL_4_EXAMS.pdf")
    master_doc.save(master_out, deflate=True)
    master_doc.close()
    total_files += 1

    print(f"Generated {total_files} PDFs cleanly in {OUT_BASE}")


if __name__ == "__main__":
    main()
