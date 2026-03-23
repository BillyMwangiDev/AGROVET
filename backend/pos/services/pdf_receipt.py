"""
Generate a PDF receipt for a Sale using ReportLab.
Returns raw PDF bytes.
"""

import os
from io import BytesIO
from reportlab.lib.pagesizes import A6
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

_LOGO_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'static', 'logo.png'))


def generate_receipt_pdf(sale) -> bytes:
    """
    Generate a PDF receipt for the given Sale instance.
    The sale must be prefetched with items and related product data.
    """
    buffer = BytesIO()
    # 80mm thermal-style width, auto height
    page_width = 80 * mm
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, A6[1]),
        topMargin=6 * mm,
        bottomMargin=6 * mm,
        leftMargin=4 * mm,
        rightMargin=4 * mm,
    )

    styles = getSampleStyleSheet()
    center = ParagraphStyle("center", parent=styles["Normal"], alignment=TA_CENTER, fontSize=8)
    right = ParagraphStyle("right", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=8)
    bold_center = ParagraphStyle("bold_center", parent=styles["Normal"], alignment=TA_CENTER, fontSize=10, fontName="Helvetica-Bold")
    normal = ParagraphStyle("normal", parent=styles["Normal"], fontSize=8)

    story = []

    # Header — logo
    if os.path.exists(_LOGO_PATH):
        logo = Image(_LOGO_PATH, width=18 * mm, height=18 * mm)
        logo.hAlign = 'CENTER'
        story.append(logo)
        story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("NICMAH AGROVET", bold_center))
    story.append(Paragraph("Naromoru Town, Timberland Building", center))
    story.append(Paragraph("Shop: 0726 476 128  |  Vet: 0721 908 023", center))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    story.append(Spacer(1, 2 * mm))

    # Receipt info
    story.append(Paragraph(f"Receipt: {sale.receipt_number}", bold_center))
    story.append(Paragraph(sale.created_at.strftime("%d/%m/%Y %H:%M"), center))
    customer = sale.customer.name if sale.customer else (sale.customer_name or "Walk-in Customer")
    story.append(Paragraph(f"Customer: {customer}", center))
    story.append(Spacer(1, 2 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    story.append(Spacer(1, 2 * mm))

    # Items table
    item_data = [["Item", "Qty", "Price", "Total"]]
    for item in sale.items.all():
        item_data.append([
            Paragraph(item.product_name, normal),
            str(item.quantity),
            f"KES {float(item.unit_price):,.0f}",
            f"KES {float(item.line_total):,.0f}",
        ])

    col_widths = [32 * mm, 8 * mm, 16 * mm, 16 * mm]
    table = Table(item_data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ("TOPPADDING", (0, 0), (-1, -1), 1.5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    story.append(table)
    story.append(Spacer(1, 2 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    story.append(Spacer(1, 2 * mm))

    # Totals
    def money_row(label: str, amount, bold: bool = False):
        style = ParagraphStyle("row", parent=styles["Normal"], fontSize=8,
                               fontName="Helvetica-Bold" if bold else "Helvetica")
        row_data = [[Paragraph(label, style), Paragraph(f"KES {float(amount):,.0f}", right)]]
        t = Table(row_data, colWidths=[40 * mm, 28 * mm])
        t.setStyle(TableStyle([
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ("TOPPADDING", (0, 0), (-1, -1), 1),
        ]))
        return t

    story.append(money_row("Subtotal", sale.subtotal))
    story.append(money_row("Tax (16% VAT)", sale.tax))
    if float(sale.discount) > 0:
        story.append(money_row("Discount", sale.discount))
    story.append(money_row("TOTAL", sale.total, bold=True))
    story.append(Spacer(1, 2 * mm))

    # Payment method
    story.append(Paragraph(f"Payment: {sale.payment_method.upper()}", center))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Thank you for shopping with us!", center))
    story.append(Paragraph("WhatsApp: +254740368581", center))

    doc.build(story)
    return buffer.getvalue()
