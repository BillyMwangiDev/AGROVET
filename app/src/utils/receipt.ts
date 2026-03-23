/**
 * Generate a test 80mm thermal receipt HTML for printer calibration.
 */
export function generateTestReceiptHtml(): string {
  const now = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
  const logoSrc = `${window.location.origin}/logo.png`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { width: 80mm; font-family: monospace; font-size: 10px; padding: 8px; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .sep { border-top: 1px dashed #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="center"><img src="${logoSrc}" alt="Nicmah Agrovet" style="width:52px;height:52px;border-radius:50%;object-fit:contain;display:block;margin:0 auto 4px;"></div>
  <div class="center bold" style="font-size:13px;">NICMAH AGROVET</div>
  <div class="center">Naromoru Town, Timberland Bldg</div>
  <div class="center">Tel: 0721 908 023</div>
  <div class="sep"></div>
  <div class="center bold">** TEST RECEIPT **</div>
  <div class="center">Printer calibration only</div>
  <div class="sep"></div>
  <div class="row"><span>Item 1 x2</span><span>KES 200.00</span></div>
  <div class="row"><span>Item 2 x1</span><span>KES 150.00</span></div>
  <div class="sep"></div>
  <div class="row"><span>Subtotal</span><span>KES 350.00</span></div>
  <div class="row"><span>VAT (16%)</span><span>KES 56.00</span></div>
  <div class="row bold"><span>TOTAL</span><span>KES 406.00</span></div>
  <div class="sep"></div>
  <div class="row"><span>Payment</span><span>CASH</span></div>
  <div class="sep"></div>
  <div class="center">Printed: ${now}</div>
  <div class="center">Thank you for your business!</div>
  <br/><br/>
</body>
</html>`;
}

/**
 * Open a new window with the receipt HTML and trigger print dialog.
 * Works with the thermal receipt HTML returned by the Django backend.
 */
export function printReceipt(html: string): void {
  const win = window.open("", "_blank", "width=340,height=700,scrollbars=yes");
  if (!win) {
    if (import.meta.env.DEV) {
      console.warn("printReceipt: Could not open print window. Check popup blocker.");
    }
    return;
  }
  win.document.write(html);
  win.document.close();
  // Small delay to allow styles to render before print dialog
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}
