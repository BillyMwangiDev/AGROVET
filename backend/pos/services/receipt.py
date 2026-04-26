import os
import base64
from datetime import datetime

_LOGO_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'static', 'logo.png')


def _logo_tag() -> str:
    """Return an <img> tag with the logo embedded as base64, or empty string if missing."""
    try:
        with open(os.path.normpath(_LOGO_PATH), 'rb') as f:
            data = base64.b64encode(f.read()).decode('utf-8')
        return (
            '<div style="text-align:center;margin-bottom:4px;">'
            f'<img src="data:image/png;base64,{data}" '
            'alt="Nicmah Agrovet" style="width:52px;height:52px;border-radius:50%;object-fit:contain;">'
            '</div>'
        )
    except FileNotFoundError:
        return ''


def generate_receipt_html(sale) -> str:
    """Generate an 80mm thermal printer-ready HTML receipt for a sale."""
    items_rows = ""
    for item in sale.items.all():
        items_rows += (
            f"<tr>"
            f"<td class='item-name'>{item.product_name}</td>"
            f"<td class='qty'>x{item.quantity}</td>"
            f"<td class='amount'>KES {item.line_total:,.0f}</td>"
            f"</tr>"
        )

    discount_row = ""
    if sale.discount and sale.discount > 0:
        discount_row = f"<tr><td colspan='2'>Discount</td><td>-KES {sale.discount:,.0f}</td></tr>"

    customer_line = ""
    display_name = ""
    if sale.customer:
        display_name = sale.customer.name
    elif sale.customer_name:
        display_name = sale.customer_name
    if display_name:
        customer_line = f"<p>Customer: <strong>{display_name}</strong></p>"

    served_by = "—"
    if sale.served_by:
        full_name = sale.served_by.get_full_name()
        served_by = full_name if full_name else sale.served_by.username

    created_at_str = sale.created_at.strftime("%d %b %Y  %H:%M")
    logo_html = _logo_tag()
    return_banner = ""
    if getattr(sale, "is_return", False):
        return_banner = '<p style="text-align:center;font-weight:bold;border:1px solid #000;padding:3px;margin:4px 0;">*** RETURN / REFUND ***</p>'

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {{ size: 80mm auto; margin: 4mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    width: 72mm;
    margin: 0 auto;
    padding: 4px;
    color: #000;
  }}
  h1 {{ font-size: 14px; text-align: center; margin: 4px 0 2px; letter-spacing: 1px; }}
  h2 {{ font-size: 11px; text-align: center; font-weight: normal; margin: 0 0 4px; }}
  .center {{ text-align: center; }}
  .divider {{ border: none; border-top: 1px dashed #000; margin: 6px 0; }}
  table {{ width: 100%; border-collapse: collapse; }}
  td {{ padding: 2px 2px; vertical-align: top; }}
  .item-name {{ width: 52%; word-break: break-word; }}
  .qty {{ width: 12%; text-align: center; }}
  .amount {{ width: 36%; text-align: right; }}
  .totals td {{ padding: 2px; }}
  .totals td:last-child {{ text-align: right; }}
  .grand-total {{ font-size: 14px; font-weight: bold; }}
  .footer {{ text-align: center; margin-top: 8px; font-size: 10px; }}
  p {{ margin: 2px 0; }}
</style>
</head>
<body>
  {logo_html}
  <h1>NICMAH AGROVET</h1>
  <h2>Naromoru Town, Timberland Building</h2>
  <p class="center">Tel: 0721 908 023</p>

  <hr class="divider">

  {return_banner}
  <p>Receipt: <strong>{sale.receipt_number}</strong></p>
  <p>Date: {created_at_str}</p>
  <p>Cashier: {served_by}</p>
  <p>Payment: {sale.get_payment_method_display()}</p>
  {customer_line}

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <td class="item-name"><strong>Item</strong></td>
        <td class="qty"><strong>Qty</strong></td>
        <td class="amount"><strong>Amount</strong></td>
      </tr>
    </thead>
    <tbody>
      {items_rows}
    </tbody>
  </table>

  <hr class="divider">

  <table class="totals">
    <tr><td>Subtotal</td><td>KES {sale.subtotal:,.0f}</td></tr>
    <tr><td>VAT (16%)</td><td>KES {sale.tax:,.0f}</td></tr>
    {discount_row}
    <tr class="grand-total"><td>TOTAL</td><td>KES {sale.total:,.0f}</td></tr>
  </table>

  <hr class="divider">

  <div class="footer">
    <p>Asante kwa kununua!</p>
    <p>Thank you for shopping with us.</p>
    <p style="margin-top:6px; font-size:9px;">www.nicmah.co.ke</p>
  </div>
</body>
</html>"""
