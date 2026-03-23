"""
Generate an A4 PDF invoice for a Document instance using ReportLab.
Returns raw PDF bytes.
"""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from .letterhead import draw_letterhead, HEADER_H, FOOTER_H

PRIMARY = colors.HexColor("#0B3A2C")
ACCENT = colors.HexColor("#E4B83A")
LIGHT_BG = colors.HexColor("#F6F7F6")
MUTED = colors.HexColor("#6B7A72")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title", parent=base["Normal"], fontSize=22, fontName="Helvetica-Bold", textColor=PRIMARY, alignment=TA_LEFT),
        "label": ParagraphStyle("label", parent=base["Normal"], fontSize=9, fontName="Helvetica-Bold", textColor=colors.black),
        "value": ParagraphStyle("value", parent=base["Normal"], fontSize=9, textColor=colors.black),
        "sub": ParagraphStyle("sub", parent=base["Normal"], fontSize=9, textColor=MUTED),
        "th": ParagraphStyle("th", parent=base["Normal"], fontSize=9, fontName="Helvetica-Bold", textColor=colors.white, alignment=TA_LEFT),
        "td": ParagraphStyle("td", parent=base["Normal"], fontSize=9, textColor=colors.black),
        "td_r": ParagraphStyle("td_r", parent=base["Normal"], fontSize=9, textColor=colors.black, alignment=TA_RIGHT),
        "notice": ParagraphStyle("notice", parent=base["Normal"], fontSize=9, textColor=MUTED, alignment=TA_CENTER),
    }


def generate_invoice_pdf(document) -> bytes:
    """Generate an A4 invoice PDF with letterhead for the given Document instance."""
    buffer = BytesIO()

    LEFT = RIGHT = 20 * mm
    TOP = HEADER_H + 8 * mm      # space below the header band
    BOTTOM = FOOTER_H + 4 * mm   # space above the footer

    doc = BaseDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        leftMargin=LEFT,
        rightMargin=RIGHT,
    )
    frame = Frame(LEFT, BOTTOM, A4[0] - LEFT - RIGHT, A4[1] - TOP - BOTTOM, id="body")
    doc.addPageTemplates([PageTemplate(id="letterhead", frames=[frame], onPage=draw_letterhead)])

    s = _styles()
    w = A4[0] - LEFT - RIGHT
    story = []

    # ── Document title ───────────────────────────────────────────────────────
    story.append(Paragraph("INVOICE", s["title"]))
    story.append(Spacer(1, 5 * mm))

    # ── Invoice meta + customer ──────────────────────────────────────────────
    due_str = document.due_date.strftime("%d %b %Y") if document.due_date else "On Receipt"
    meta_rows = [
        [Paragraph("Invoice No:", s["label"]), Paragraph(document.document_number, s["value"])],
        [Paragraph("Date:", s["label"]), Paragraph(document.issue_date.strftime("%d %b %Y"), s["value"])],
        [Paragraph("Due Date:", s["label"]), Paragraph(due_str, s["value"])],
        [Paragraph("Status:", s["label"]), Paragraph(document.get_status_display(), s["value"])],
    ]
    if document.payment_terms:
        meta_rows.append([Paragraph("Payment Terms:", s["label"]), Paragraph(document.payment_terms, s["value"])])

    meta_data = [
        [
            [
                Paragraph("Bill To:", s["label"]),
                Paragraph(document.customer_name, s["value"]),
                Paragraph(document.customer_email or "", s["sub"]),
                Paragraph(document.customer_phone or "", s["sub"]),
                Paragraph(document.customer_address or "", s["sub"]),
            ],
            [Table(meta_rows, colWidths=[30 * mm, 48 * mm],
                   style=TableStyle([
                       ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                       ("TOPPADDING", (0, 0), (-1, -1), 2),
                   ]))],
        ]
    ]
    meta_table = Table(meta_data, colWidths=[w * 0.5, w * 0.5])
    meta_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))

    # ── Items table ──────────────────────────────────────────────────────────
    col_w = [w * 0.50, w * 0.10, w * 0.20, w * 0.20]
    items_data = [
        [Paragraph("Description", s["th"]), Paragraph("Qty", s["th"]),
         Paragraph("Unit Price", s["th"]), Paragraph("Total", s["th"])]
    ]
    for item in document.items.all():
        items_data.append([
            Paragraph(item.description, s["td"]),
            Paragraph(str(item.quantity), s["td"]),
            Paragraph(f"KES {float(item.unit_price):,.2f}", s["td_r"]),
            Paragraph(f"KES {float(item.total_price):,.2f}", s["td_r"]),
        ])

    items_table = Table(items_data, colWidths=col_w, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 5 * mm))

    # ── Totals ───────────────────────────────────────────────────────────────
    totals = [
        ("Subtotal", f"KES {float(document.subtotal):,.2f}", False),
        ("Tax (16% VAT)", f"KES {float(document.tax_amount):,.2f}", False),
    ]
    if float(document.discount_amount) > 0:
        totals.append(("Discount", f"- KES {float(document.discount_amount):,.2f}", False))
    totals.append(("TOTAL DUE", f"KES {float(document.total_amount):,.2f}", True))

    base_s = getSampleStyleSheet()
    totals_table_data = []
    for label, value, bold in totals:
        lbl_s = ParagraphStyle("tl", parent=base_s["Normal"], fontSize=10 if bold else 9,
                               fontName="Helvetica-Bold" if bold else "Helvetica", alignment=TA_RIGHT)
        val_s = ParagraphStyle("tv", parent=base_s["Normal"], fontSize=10 if bold else 9,
                               fontName="Helvetica-Bold" if bold else "Helvetica", alignment=TA_RIGHT,
                               textColor=PRIMARY if bold else colors.black)
        totals_table_data.append([Paragraph(label, lbl_s), Paragraph(value, val_s)])

    totals_outer = Table([[" ", Table(totals_table_data, colWidths=[40 * mm, 45 * mm])]], colWidths=[w - 85 * mm, 85 * mm])
    totals_outer.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(totals_outer)
    story.append(Spacer(1, 6 * mm))

    # ── Payment info box ─────────────────────────────────────────────────────
    pay_lines = [f"<b>Payment Due: KES {float(document.total_amount):,.2f}</b>", f"Due Date: {due_str}"]
    if document.payment_terms:
        pay_lines.append(f"Payment Terms: {document.payment_terms}")
    pay_lines.append("Payment via Cash, M-Pesa, or Bank Transfer")

    pay_box = Table(
        [[Paragraph("<br/>".join(pay_lines), s["notice"])]],
        colWidths=[w],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF8E7")),
            ("BOX", (0, 0), (-1, -1), 0.5, ACCENT),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]),
    )
    story.append(pay_box)
    story.append(Spacer(1, 5 * mm))

    # ── Notes & Terms ────────────────────────────────────────────────────────
    if document.notes:
        story.append(Paragraph("Notes:", s["label"]))
        story.append(Paragraph(document.notes, s["value"]))
        story.append(Spacer(1, 3 * mm))

    if document.terms_conditions:
        story.append(Paragraph("Terms & Conditions:", s["label"]))
        story.append(Paragraph(document.terms_conditions, s["sub"]))

    doc.build(story)
    return buffer.getvalue()
