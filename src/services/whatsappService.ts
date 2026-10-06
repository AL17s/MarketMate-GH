import { Sale, CustomerCredit, Product, Business } from '../types/models';

/**
 * Format Ghanaian phone number for wa.me URL
 * Converts '0244123456' -> '233244123456'
 */
export function formatGhanaPhoneForWhatsApp(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('233')) return clean;
  if (clean.startsWith('0')) return '233' + clean.slice(1);
  return '233' + clean;
}

/**
 * Generates instant WhatsApp receipt link
 */
export function generateWhatsAppReceiptUrl(sale: Sale, business: Business, customerPhone?: string): string {
  const itemsText = sale.itemsSummary || `${sale.itemCount} items`;
  const paymentMethodLabel =
    sale.paymentMethod === 'momo_mtn'
      ? 'MTN MoMo'
      : sale.paymentMethod === 'momo_telecel'
      ? 'Telecel Cash'
      : sale.paymentMethod === 'momo_at'
      ? 'AT Money'
      : sale.paymentMethod === 'credit'
      ? 'Debtor Book (Credit)'
      : 'Cash';

  const msg = [
    `🧾 *${business.name.toUpperCase()}*`,
    `📍 ${business.location}`,
    `📞 Tel: ${business.phone}`,
    `--------------------------------`,
    `*DIGITAL SALES RECEIPT*`,
    `Receipt No: *#${sale.receiptNumber}*`,
    `Date & Time: ${new Date(sale.timestamp).toLocaleString('en-GH')}`,
    `Customer: ${sale.customerName}`,
    `--------------------------------`,
    `Items / Summary:`,
    `${itemsText}`,
    `--------------------------------`,
    `*TOTAL PAID: GH₵ ${sale.totalAmount.toFixed(2)}*`,
    `Payment Method: ${paymentMethodLabel}`,
    sale.momoReference ? `MoMo Ref: ${sale.momoReference}` : null,
    `--------------------------------`,
    `_Medaase pa ara! Thank you for your business in Makola Market._ 🙏🇬🇭`,
    `_Powered by MarketMate GH_`,
  ]
    .filter(Boolean)
    .join('\n');

  const encoded = encodeURIComponent(msg);
  if (customerPhone) {
    const formattedPhone = formatGhanaPhoneForWhatsApp(customerPhone);
    return `https://wa.me/${formattedPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Generates polite Ghanaian WhatsApp debt collection reminder
 */
export function generateWhatsAppDebtReminderUrl(
  credit: CustomerCredit,
  business: Business,
  customerPhone?: string
): string {
  const dueDateStr = credit.dueDate ? new Date(credit.dueDate).toLocaleDateString('en-GH') : 'due soon';
  const momoNumber = business.momoSettings.mtnNumber || business.phone;

  const msg = [
    `Akwaaba ${credit.customerName},`,
    ``,
    `Greetings from *${business.name}* at ${business.branch}.`,
    ``,
    `This is a friendly reminder regarding your outstanding credit balance:`,
    `• Amount Due: *GH₵ ${credit.balance.toFixed(2)}*`,
    `• Items: ${credit.description}`,
    `• Due Date: *${dueDateStr}*`,
    ``,
    `You can pay conveniently via MTN MoMo to:`,
    `📱 *${momoNumber}* (${business.momoSettings.mtnMerchantName || business.name})`,
    ``,
    `Kindly send a screenshot or reference once sent so we can balance your credit book.`,
    `Medaase and have a profitable day! 🙏`,
  ].join('\n');

  const phone = customerPhone || credit.customerPhone;
  const encoded = encodeURIComponent(msg);
  if (phone) {
    const formattedPhone = formatGhanaPhoneForWhatsApp(phone);
    return `https://wa.me/${formattedPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Generates WhatsApp Restock purchase order to wholesaler
 */
export function generateWhatsAppRestockOrderUrl(
  product: Product,
  business: Business,
  orderQty: number,
  supplierPhone?: string
): string {
  const msg = [
    `Hello ${product.supplierName || 'Wholesaler'},`,
    ``,
    `I would like to place an urgent restock order for *${business.name}* (${business.branch}):`,
    `• Item: *${product.name}*`,
    `• Quantity Needed: *${orderQty} ${product.unit}s*`,
    `• Stall Location: ${business.location}`,
    ``,
    `Please confirm stock availability, wholesale price, and delivery time.`,
    `Medaase! - ${business.ownerId || 'Abena'}`,
  ].join('\n');

  const encoded = encodeURIComponent(msg);
  if (supplierPhone) {
    const formattedPhone = formatGhanaPhoneForWhatsApp(supplierPhone);
    return `https://wa.me/${formattedPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
