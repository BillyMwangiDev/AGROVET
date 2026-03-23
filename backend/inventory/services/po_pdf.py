"""
Generate an A4 PDF for a PurchaseOrder instance using ReportLab.
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
    HRFlowable,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from documents.services.letterhead import draw_letterhead, HEADER_H, FOOTER_H

PRIMARY = colors.HexColor("#0B3A2C")
ACCENT = colors.HexColor("#E4B83A")
LIGHT_BG = colors.HexColor("#F6F7F6")
MUTED = colors.HexColor("#6B7A72")
BLUE_BG = colors.HexColor("#EBF5FF")
BLUE_BORDER = colors.HexColor("#3B82F6")


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
        "sig": ParagraphStyle("sig", parent=base["Normal"], fontSize=9),
    }


def generate_po_pdf(po) -> bytes:
    """Generate an A4 Purchase Order PDF with letterhead for the given PurchaseOrder instance."""
    buffer = BytesIO()

    LEFT = RIGHT = 20 * mm
    TOP = HEADER_H + 8 * mm
    BOTTOM = FOOTER_H + 4 * mm

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

    # ── Document title ────────────────────────────────────────────────────────
    story.append(Paragraph("PURCHASE ORDER", s["title"]))
    story.append(Spacer(1, 5 * mm))

    # ── PO meta + supplier ────────────────────────────────────────────────────
    delivery_str = po.expected_delivery.strftime("%d %b %Y") if po.expected_delivery else "TBD"
    supplier = po.supplier
    meta_rows = [
        [Paragraph("PO Number:", s["label"]), Paragraph(po.po_number, s["value"])],
        [Paragraph("Date:", s["label"]), Paragraph(po.created_at.strftime("%d %b %Y"), s["value"])],
        [Paragraph("Expected Delivery:", s["label"]), Paragraph(delivery_str, s["value"])],
        [Paragraph("Status:", s["label"]), Paragraph(po.get_status_display(), s["value"])],
    ]
    if po.notes:
        meta_rows.append([Paragraph("Notes:", s["label"]), Paragraph(po.notes, s["value"])])

    meta_data = [
        [
            [
                Paragraph("Supplier:", s["label"]),
                Paragraph(supplier.name, s["value"]),
                Paragraph(supplier.email or "", s["sub"]),
                Paragraph(supplier.phone or "", s["sub"]),
                Paragraph(supplier.address or "", s["sub"]),
                Paragraph(f"Contact: {supplier.contact_person}" if supplier.contact_person else "", s["sub"]),
            ],
            [Table(meta_rows, colWidths=[35 * mm, 43 * mm],
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

    # ── Items table ───────────────────────────────────────────────────────────
    col_w = [w * 0.40, w * 0.12, w * 0.12, w * 0.18, w * 0.18]
    items_data = [
        [Paragraph("Product", s["th"]), Paragraph("Ordered", s["th"]),
         Paragraph("Received", s["th"]), Paragraph("Unit Cost", s["th"]),
         Paragraph("Line Total", s["th"])]
    ]
    for item in po.items.all():
        items_data.append([
            Paragraph(item.product.name, s["td"]),
            Paragraph(str(item.quantity_ordered), s["td"]),
            Paragraph(str(item.quantity_received), s["td"]),
            Paragraph(f"KES {float(item.unit_cost):,.2f}", s["td_r"]),
            Paragraph(f"KES {float(item.line_total):,.2f}", s["td_r"]),
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

    # ── Totals ────────────────────────────────────────────────────────────────
    base_s = getSampleStyleSheet()
    totals_rows = [("Subtotal", f"KES {float(po.subtotal):,.2f}", False)]
    if float(po.tax) > 0:
        totals_rows.append(("Tax", f"KES {float(po.tax):,.2f}", False))
    if float(po.shipping) > 0:
        totals_rows.append(("Shipping", f"KES {float(po.shipping):,.2f}", False))
    totals_rows.append(("TOTAL", f"KES {float(po.total):,.2f}", True))

    totals_data = []
    for label, value, bold in totals_rows:
        lbl_s = ParagraphStyle("tl", parent=base_s["Normal"], fontSize=10 if bold else 9,
                               fontName="Helvetica-Bold" if bold else "Helvetica", alignment=TA_RIGHT)
        val_s = ParagraphStyle("tv", parent=base_s["Normal"], fontSize=10 if bold else 9,
                               fontName="Helvetica-Bold" if bold else "Helvetica", alignment=TA_RIGHT,
                               textColor=PRIMARY if bold else colors.black)
        totals_data.append([Paragraph(label, lbl_s), Paragraph(value, val_s)])

    totals_outer = Table([[" ", Table(totals_data, colWidths=[35 * mm, 50 * mm])]], colWidths=[w - 85 * mm, 85 * mm])
    totals_outer.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(totals_outer)
    story.append(Spacer(1, 5 * mm))

    # ── Delivery info box ─────────────────────────────────────────────────────
    delivery_box = Table(
        [[Paragraph(
            f"<b>Expected Delivery: {delivery_str}</b><br/>"
            "Delivery to: Nicmah Agrovet, Naromoru Town, Timberland Building<br/>"
            "Contact: 0721 908 023",
            s["notice"]
        )]],
        colWidths=[w],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BLUE_BG),
            ("BOX", (0, 0), (-1, -1), 0.5, BLUE_BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]),
    )
    story.append(delivery_box)
    story.append(Spacer(1, 8 * mm))

    # ── Signature block ───────────────────────────────────────────────────────
    sig_data = [
        [Paragraph("Authorized by (Buyer)", s["sig"]), Paragraph("Supplier Signature", s["sig"])],
        [Spacer(1, 10 * mm), Spacer(1, 10 * mm)],
        [HRFlowable(width="80%", thickness=0.5, color=colors.black), HRFlowable(width="80%", thickness=0.5, color=colors.black)],
        [Paragraph("Date: _______________", s["sig"]), Paragraph("Date: _______________", s["sig"])],
    ]
    sig_table = Table(sig_data, colWidths=[w * 0.5, w * 0.5])
    sig_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buffer.getvalue()
