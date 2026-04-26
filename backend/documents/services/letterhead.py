"""
Shared professional letterhead: draws a branded header and footer on every PDF page.
Used by invoice_pdf.py, quotation_pdf.py, and po_pdf.py.
"""
import os

from reportlab.lib import colors
from reportlab.lib.units import mm

PRIMARY = colors.HexColor("#0B3A2C")
ACCENT = colors.HexColor("#E4B83A")
MUTED = colors.HexColor("#6B7A72")
WHITE = colors.white
HEADER_H = 28 * mm   # height of the green header band
FOOTER_H = 14 * mm  # height reserved for footer

LOGO_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', '..', '..', 'static', 'logo.png')
)


def draw_letterhead(canvas, doc):
    """
    ReportLab onPage callback — draws the letterhead header and footer.
    Set topMargin = HEADER_H + 8mm, bottomMargin = FOOTER_H + 4mm in your doc.
    """
    canvas.saveState()
    pw = doc.pagesize[0]   # page width
    ph = doc.pagesize[1]   # page height

    # ── HEADER BAND ──────────────────────────────────────────────────────────
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, ph - HEADER_H, pw, HEADER_H, fill=1, stroke=0)

    # Logo (circular — ReportLab renders the image; border-radius is a CSS concept)
    logo_x = 12 * mm
    logo_y = ph - HEADER_H + (HEADER_H - 22 * mm) / 2
    if os.path.exists(LOGO_PATH):
        canvas.drawImage(
            LOGO_PATH,
            logo_x, logo_y,
            width=22 * mm, height=22 * mm,
            preserveAspectRatio=True,
            mask='auto',
        )
        text_x = logo_x + 26 * mm
    else:
        text_x = logo_x

    # Company name
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawString(text_x, ph - 11 * mm, "NICMAH AGROVET")

    # Contact line 1
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#B8D8C6"))
    canvas.drawString(text_x, ph - 17 * mm,
                      "Naromoru Town, Timberland Building, Naromoru, Nyeri County")

    # Contact line 2
    canvas.drawString(text_x, ph - 22 * mm,
                      "Shop: 0726 476 128  |  Vet: 0721 908 023  |  "
                      "nicmahagrovet@gmail.com  |  www.nicmah.co.ke")

    # Gold accent rule under header
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2.5)
    canvas.line(0, ph - HEADER_H - 0.5 * mm, pw, ph - HEADER_H - 0.5 * mm)

    # ── FOOTER ───────────────────────────────────────────────────────────────
    footer_top = FOOTER_H

    # Gold rule above footer
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1)
    canvas.line(12 * mm, footer_top, pw - 12 * mm, footer_top)

    # Footer text — centred
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(
        pw / 2, footer_top - 4 * mm,
        "NICMAH AGROVET  |  Naromoru Town, Timberland Building  |  "
        "Tel: 0726 476 128  |  nicmahagrovet@gmail.com",
    )

    # Page number — right-aligned
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(pw - 12 * mm, footer_top - 8 * mm, f"Page {doc.page}")

    canvas.restoreState()
