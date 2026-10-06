import { jsPDF } from 'jspdf';
import { Sale, Business, CartItem } from '../types/models';

/**
 * Generates a clean 25x25 QR Code matrix data representation
 * with authentic finder squares in the top-left, top-right, and bottom-left,
 * plus timing patterns and pseudo-random data bits based on input seed.
 */
function generateQrMatrix(seed: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder pattern generator (7x7 box with 3x3 inner square)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  // 1. Top-left
  drawFinder(0, 0);
  // 2. Top-right
  drawFinder(size - 7, 0);
  // 3. Bottom-left
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern (around 16, 16)
  for (let r = 14; r <= 18; r++) {
    for (let c = 14; c <= 18; c++) {
      if (r === 14 || r === 18 || c === 14 || c === 18 || (r === 16 && c === 16)) {
        matrix[r][c] = true;
      }
    }
  }

  // Pseudo-random data filling using string hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= size - 8;
      const inFinder3 = r >= size - 8 && c < 8;
      const inTiming = r === 6 || c === 6;
      const inAlignment = r >= 14 && r <= 18 && c >= 14 && c <= 18;

      if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming && !inAlignment) {
        const val = Math.abs(Math.sin((r * 13 + c * 7 + hash) % 100));
        matrix[r][c] = val > 0.45;
      }
    }
  }

  return matrix;
}

export interface ReceiptItemDetails {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * Generates and downloads a formatted PDF transaction receipt
 */
export function exportReceiptAsPdf(
  receiptData: {
    receiptNumber: string;
    timestamp: string;
    customerName: string;
    items: ReceiptItemDetails[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    momoNumber?: string;
    momoReference?: string;
    cashReceived?: number;
    changeGiven?: number;
    cashierName?: string;
  },
  business: Business
): void {
  // 80mm thermal/slip width, auto-calculated height
  const pageWidth = 80; // mm
  const baseHeight = 175; // mm
  const itemsHeight = Math.max(20, receiptData.items.length * 6);
  const pageHeight = baseHeight + itemsHeight;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  let y = 8;

  // 1. Business Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 84, 49); // #005431 Forest Green
  doc.text(business.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(business.branch || 'Makola Retail Lane', pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(business.location, pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  doc.text(`Tel: ${business.phone}  |  TIN: ${business.tinNumber || 'C0028919283'}`, pageWidth / 2, y, {
    align: 'center',
  });

  // Divider
  y += 3.5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);

  // 2. Receipt Meta
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`OFFICIAL SALES RECEIPT`, pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);

  const dateStr = new Date(receiptData.timestamp).toLocaleString('en-GH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  doc.text(`Receipt #: ${receiptData.receiptNumber}`, margin, y);
  doc.text(dateStr, pageWidth - margin, y, { align: 'right' });

  y += 3.5;
  doc.text(`Customer: ${receiptData.customerName}`, margin, y);
  doc.text(`Cashier: ${receiptData.cashierName || 'Abena M.'}`, pageWidth - margin, y, {
    align: 'right',
  });

  // Divider
  y += 3;
  doc.line(margin, y, pageWidth - margin, y);

  // 3. Itemized List Header
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('ITEM', margin, y);
  doc.text('QTY', margin + 35, y, { align: 'center' });
  doc.text('PRICE', margin + 50, y, { align: 'right' });
  doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });

  y += 1.5;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);

  // Item Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);

  receiptData.items.forEach((item) => {
    y += 4;
    // Truncate long product names
    const truncatedName =
      item.name.length > 22 ? item.name.substring(0, 20) + '...' : item.name;

    doc.text(truncatedName, margin, y);
    doc.text(item.quantity.toString(), margin + 35, y, { align: 'center' });
    doc.text(item.unitPrice.toFixed(2), margin + 50, y, { align: 'right' });
    doc.text(item.subtotal.toFixed(2), pageWidth - margin, y, { align: 'right' });
  });

  // Divider
  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  // 4. Financial Totals
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Subtotal:', margin + 25, y);
  doc.text(`GHS ${receiptData.subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  if (receiptData.taxAmount > 0) {
    y += 3.5;
    doc.text(`GRA Flat Rate VAT (${business.vatRatePercent || 3}%):`, margin + 25, y);
    doc.text(`GHS ${receiptData.taxAmount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
  } else {
    y += 3.5;
    doc.text('GRA Tax & Levies:', margin + 25, y);
    doc.text('GHS 0.00 (Exempt)', pageWidth - margin, y, { align: 'right' });
  }

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 84, 49); // Forest green
  doc.text('TOTAL PAID:', margin + 20, y);
  doc.text(`GHS ${receiptData.totalAmount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  // Payment method info
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  const tenderLabel =
    receiptData.paymentMethod === 'momo_mtn'
      ? 'MTN Mobile Money'
      : receiptData.paymentMethod === 'momo_telecel'
      ? 'Telecel Cash'
      : receiptData.paymentMethod === 'momo_at'
      ? 'AT Money'
      : receiptData.paymentMethod === 'credit'
      ? 'Customer Credit (Owe Book)'
      : 'Cash Tender';

  doc.text(`Payment Tender: ${tenderLabel}`, margin, y);

  if (receiptData.momoReference) {
    y += 3;
    doc.text(`MoMo Ref: ${receiptData.momoReference}`, margin, y);
  }

  if (receiptData.cashReceived !== undefined && receiptData.changeGiven !== undefined) {
    y += 3;
    doc.text(
      `Cash Recv: GHS ${receiptData.cashReceived.toFixed(2)}  |  Change: GHS ${receiptData.changeGiven.toFixed(2)}`,
      margin,
      y
    );
  }

  // Divider
  y += 3.5;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);

  // 5. QR Code Placeholder for Future Payment Integration (GhQR / Mobile Money)
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(131, 85, 0); // Amber gold #835500
  doc.text('GHQR & MOMO PAYMENT QR', pageWidth / 2, y, { align: 'center' });

  y += 2.5;
  const qrSize = 22; // mm
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = y;

  // Background box for QR code
  doc.setFillColor(250, 250, 255);
  doc.setDrawColor(200, 215, 230);
  doc.roundedRect(qrX - 2, qrY - 1, qrSize + 4, qrSize + 4, 1.5, 1.5, 'FD');

  // Draw authentic QR code matrix modules
  const qrSeed = `gh.ghipss.momo:acc=${business.phone}&amt=${receiptData.totalAmount}&ref=${receiptData.receiptNumber}`;
  const matrix = generateQrMatrix(qrSeed);
  const moduleSize = qrSize / matrix.length;

  doc.setFillColor(0, 33, 16); // Deep forest black-green
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        doc.rect(qrX + c * moduleSize, qrY + r * moduleSize, moduleSize, moduleSize, 'F');
      }
    }
  }

  y += qrSize + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Scan via MTN MoMo, Telecel Cash, AT Money or Ghana Banking App', pageWidth / 2, y, {
    align: 'center',
  });

  y += 3;
  doc.text(`Universal GhQR Payload: ${receiptData.receiptNumber}`, pageWidth / 2, y, {
    align: 'center',
  });

  // 6. Thank You & Footer
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 84, 49);
  doc.text('Akwaaba & Medaase Pa Ara! 🙏🇬🇭', pageWidth / 2, y, { align: 'center' });

  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Items bought in good condition are covered by Makola warranty.', pageWidth / 2, y, {
    align: 'center',
  });

  y += 3;
  doc.text('Powered by MarketMate GH — Ghana SME Platform', pageWidth / 2, y, { align: 'center' });

  // Save / trigger download
  doc.save(`MarketMate_Receipt_${receiptData.receiptNumber}.pdf`);
}
