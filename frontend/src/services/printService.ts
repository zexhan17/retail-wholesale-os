import { Invoice } from '../types/invoice';
import { BusinessProfile } from '../types/settings';

export type ThermalPaperWidth = '80mm' | '58mm';

/**
 * Generates clean, printer-ready HTML specifically formatted for thermal receipt rolls (80mm or 58mm).
 * Eliminates browser headers, footers, URL text, and margins.
 */
export function generateThermalReceiptHtml(
  invoice: Invoice,
  profile: BusinessProfile,
  format: ThermalPaperWidth = '80mm'
): string {
  const is58mm = format === '58mm';
  const currency = profile.currencySymbol && profile.currencySymbol !== '$' ? `${profile.currencySymbol} ` : '';

  const itemsRows = invoice.items
    .map((item) => {
      const discountText =
        item.discountPercentage > 0 ? ` (-${item.discountPercentage}%)` : '';
      const unitText = item.unitName ? ` [${item.unitName}]` : '';

      return `
        <tr>
          <td style="padding: 2px 0; vertical-align: top;">
            <div style="font-weight: 600;">${item.productName}</div>
            <div style="font-size: ${is58mm ? '9px' : '10px'}; color: #444;">
              ${item.quantity} x ${currency}${item.unitPrice.toFixed(2)}${unitText}${discountText}
            </div>
          </td>
          <td style="text-align: right; vertical-align: top; font-weight: 600; padding: 2px 0;">
            ${currency}${item.total.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join('');

  const paymentsRows = invoice.payments
    .map(
      (p) => `
      <div style="display: flex; justify-content: space-between; font-size: ${is58mm ? '10px' : '11px'};">
        <span style="text-transform: uppercase;">Paid (${p.method}):</span>
        <span style="font-weight: 600;">${currency}${p.amount.toFixed(2)}</span>
      </div>
    `
    )
    .join('');

  const cashPayment = invoice.payments.find((p) => p.method === 'cash');
  let changeGiven = 0;
  if (cashPayment && cashPayment.reference?.includes('Paid:')) {
    const match = cashPayment.reference.match(/[\d.]+/);
    if (match) {
      const tendered = parseFloat(match[0]);
      if (tendered > invoice.grandTotal) {
        changeGiven = tendered - invoice.grandTotal;
      }
    }
  }

  return `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="font-size: ${is58mm ? '14px' : '16px'}; font-weight: 800; letter-spacing: 0.5px;">
        ${profile.storeName}
      </div>
      ${profile.tagline ? `<div style="font-size: ${is58mm ? '9px' : '11px'}; color: #333;">${profile.tagline}</div>` : ''}
      <div style="font-size: ${is58mm ? '9px' : '10px'}; color: #333; margin-top: 2px;">
        ${profile.address}
      </div>
      <div style="font-size: ${is58mm ? '9px' : '10px'};">Tel: ${profile.phone}</div>
      ${profile.taxNumber ? `<div style="font-size: ${is58mm ? '9px' : '10px'};">Tax / GST: ${profile.taxNumber}</div>` : ''}
    </div>

    <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

    <div style="font-size: ${is58mm ? '10px' : '11px'}; line-height: 1.35;">
      <div><strong>Receipt #:</strong> ${invoice.invoiceNumber}</div>
      <div><strong>Date:</strong> ${new Date(invoice.createdAt || invoice.date).toLocaleString()}</div>
      <div><strong>Customer:</strong> ${invoice.customerName}</div>
      ${invoice.cashierName ? `<div><strong>Cashier:</strong> ${invoice.cashierName}</div>` : ''}
    </div>

    <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

    <table style="width: 100%; border-collapse: collapse; font-size: ${is58mm ? '10px' : '11px'};">
      <thead>
        <tr style="border-bottom: 1px solid #000; text-align: left;">
          <th style="padding-bottom: 3px;">Item Details</th>
          <th style="text-align: right; padding-bottom: 3px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

    <div style="font-size: ${is58mm ? '10px' : '11px'}; line-height: 1.4;">
      <div style="display: flex; justify-content: space-between;">
        <span>Subtotal:</span>
        <span>${currency}${invoice.subtotal.toFixed(2)}</span>
      </div>
      ${
        invoice.discountTotal > 0
          ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Discount:</span>
          <span>-${currency}${invoice.discountTotal.toFixed(2)}</span>
        </div>`
          : ''
      }
      <div style="display: flex; justify-content: space-between;">
        <span>Tax (GST / VAT):</span>
        <span>${currency}${invoice.taxTotal.toFixed(2)}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: ${is58mm ? '13px' : '15px'}; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
        <span>TOTAL:</span>
        <span>${currency}${invoice.grandTotal.toFixed(2)}</span>
      </div>
    </div>

    <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

    <div style="line-height: 1.35;">
      ${paymentsRows}
      ${
        changeGiven > 0
          ? `
        <div style="display: flex; justify-content: space-between; font-size: ${is58mm ? '10px' : '11px'};">
          <span>Change Returned:</span>
          <span style="font-weight: 600;">${currency}${changeGiven.toFixed(2)}</span>
        </div>`
          : ''
      }
      ${
        invoice.dueAmount > 0
          ? `
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #b91c1c; font-size: ${is58mm ? '10px' : '11px'};">
          <span>Balance Due:</span>
          <span>${currency}${invoice.dueAmount.toFixed(2)}</span>
        </div>`
          : ''
      }
    </div>

    <div style="border-top: 1px dashed #000; margin: 8px 0 6px 0;"></div>

    <div style="text-align: center; margin: 6px 0;">
      <div style="font-family: monospace; letter-spacing: ${is58mm ? '3px' : '4px'}; font-size: ${is58mm ? '12px' : '14px'}; font-weight: bold;">
        ||| | |||| | |||||| || | ||
      </div>
      <div style="font-size: ${is58mm ? '9px' : '10px'};">${invoice.invoiceNumber}</div>
    </div>

    <div style="text-align: center; font-size: ${is58mm ? '9px' : '10px'}; margin-top: 6px; color: #333;">
      <div>${profile.receiptFooterMessage || 'Thank you for shopping with us!'}</div>
      <div style="font-size: 8px; color: #666; margin-top: 3px;">
        Powered by OmniStore OS
      </div>
    </div>
  `;
}

/**
 * Service to execute thermal and document printing via a hidden isolated iframe.
 * Prevents interference from CSS framework modals, responsive wrappers, and scroll locks.
 */
export const PrintService = {
  printReceipt(
    invoice: Invoice,
    profile: BusinessProfile,
    format: ThermalPaperWidth = '80mm'
  ) {
    const paperWidth = format === '58mm' ? '48mm' : '72mm';
    const pageRule = format === '58mm' ? '58mm auto' : '80mm auto';
    const fontSize = format === '58mm' ? '10px' : '11px';

    const contentHtml = generateThermalReceiptHtml(invoice, profile, format);

    const iframe = document.createElement('iframe');
    iframe.id = 'omnistore-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt-${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: ${pageRule};
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'Courier New', Courier, monospace;
              font-size: ${fontSize};
              line-height: 1.35;
              width: ${paperWidth};
              max-width: ${paperWidth};
            }
            .paper {
              width: ${paperWidth};
              max-width: ${paperWidth};
              margin: 0 auto;
              padding: 3mm 1mm;
            }
          </style>
        </head>
        <body>
          <div class="paper">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Receipt print error:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1200);
      }
    }, 250);
  },

  /**
   * Print custom HTML element content (e.g. A4 Tax Invoice or Z-Report)
   */
  printElement(
    element: HTMLElement,
    title = 'Document',
    format: 'a4' | 'thermal' = 'thermal'
  ) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const pageCss =
      format === 'a4'
        ? `@page { size: A4 portrait; margin: 10mm; } body { width: 100%; font-family: system-ui, sans-serif; font-size: 13px; }`
        : `@page { size: 80mm auto; margin: 0; } body { width: 72mm; font-family: monospace; font-size: 11px; padding: 2mm; }`;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            html, body { margin: 0; padding: 0; background: #fff; color: #000; }
            ${pageCss}
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1200);
      }
    }, 250);
  },
};
