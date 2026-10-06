export type UserRole = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  businessId: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  currency: 'GHS';
  country: 'Ghana';
  location: string;
  branch: string;
  ownerId: string;
  phone: string;
  tinNumber?: string;
  graVatFlatRateEnabled: boolean; // GRA 3% Flat Rate VAT Scheme
  vatRatePercent: number; // e.g. 3% standard flat rate + 1% COVID levy or 0% exempt
  monthlyExpenseCap: number;
  cashDrawerFloatGHS: number;
  momoSettings: {
    mtnNumber?: string;
    mtnMerchantName?: string;
    telecelNumber?: string;
    atMoneyNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: 'Provisions' | 'Beverages' | 'Toiletries' | 'Spices' | 'Canned Goods' | 'Grains & Rice' | 'Other';
  costPrice: number; // in GHS
  sellingPrice: number; // in GHS
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string; // 'tin', 'sachet', 'bottle', 'bar', 'bag', 'box', 'piece'
  supplierId?: string;
  supplierName?: string;
  imageUrl?: string;
  lastRestockDate: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'momo_mtn' | 'momo_telecel' | 'momo_at' | 'credit';

export interface Sale {
  id: string;
  receiptNumber: string;
  businessId: string;
  customerId?: string;
  customerName: string;
  totalAmount: number;
  costAmount: number;
  grossProfit: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  momoNumber?: string;
  momoReference?: string;
  status: 'completed' | 'pending' | 'voided';
  itemsSummary: string;
  itemCount: number;
  cashReceived?: number;
  changeGiven?: number;
  cashierId: string;
  cashierName?: string;
  timestamp: string; // ISO 8601
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  profit: number;
}

export type ExpenseCategory =
  | 'Stock Purchase'
  | 'Shop Rent'
  | 'ECG / Power'
  | 'Trotro / Fuel'
  | 'Wages & Chow'
  | 'Packaging / Bags'
  | 'Data & Airtime'
  | 'Assembly Toll'
  | 'Other Expense';

export type PaymentChannel = 'Cash' | 'MoMo' | 'Personal';

export interface Expense {
  id: string;
  businessId: string;
  amount: number;
  category: ExpenseCategory;
  paymentChannel: PaymentChannel;
  payee: string;
  memo: string;
  receiptImageUrl?: string;
  date: string;
  recordedBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  whatsappNumber?: string;
  location?: string;
  notes?: string;
  outstandingCredit: number;
  creditLimit: number;
  status: 'active' | 'overdue' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCredit {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  saleId?: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  description: string;
  status: 'pending' | 'partially_paid' | 'cleared' | 'overdue';
  createdAt: string;
}

export interface CreditPayment {
  id: string;
  businessId: string;
  creditId: string;
  customerId: string;
  customerName: string;
  amountPaid: number;
  paymentMethod: 'cash' | 'momo_mtn' | 'momo_telecel' | 'momo_at' | 'bank';
  reference?: string;
  notes?: string;
  recordedAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  whatsappNumber: string;
  marketLocation: string; // e.g. "Makola Lane 3", "Kaneshie Market", "Tema Industrial Area"
  categoriesSupplied: string;
  leadTimeDays: number;
  createdAt: string;
}

export type StockMovementType = 'sale' | 'restock' | 'adjustment' | 'damaged' | 'return';

export interface InventoryTransaction {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceId?: string; // saleId or purchase order ID
  reason?: string;
  timestamp: string;
}

export type NotificationType = 'low_stock' | 'debt_due' | 'daily_summary' | 'sale_target';

export interface Notification {
  id: string;
  businessId: string;
  userId?: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  dataPayload?: Record<string, unknown>;
  createdAt: string;
}

export type SubscriptionPlan = 'free_starter' | 'pro_trader' | 'enterprise_wholesale';

export interface Subscription {
  id: string;
  businessId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  priceGHS: number;
  billingCycle: 'monthly' | 'annual';
  currentPeriodEnd: string;
  createdAt: string;
}

// Business Calculations Metrics Interface
export interface BusinessMetrics {
  dailySales: number;
  dailySalesCount: number;
  dailyGrossProfit: number;
  dailyNetProfit: number;
  dailyExpenses: number;
  weeklySales: number;
  weeklyExpenses: number;
  weeklyNetProfit: number;
  monthlySales: number;
  lastMonthSales: number;
  monthlyExpenses: number;
  monthlyGrossProfit: number;
  monthlyNetProfit: number;
  monthOverMonthGrowthPercent: number;
  outstandingCustomerCredit: number;
  overdueCreditCount: number;
  totalDebtorsCount: number;
  inventoryValueSelling: number;
  inventoryValueCost: number;
  unrealizedProfit: number;
  totalCatalogCount: number;
  lowStockItemsCount: number;
  outOfStockCount: number;
  bestSellingProducts: {
    productId: string;
    productName: string;
    category: string;
    quantitySold: number;
    revenueGHS: number;
    profitGHS: number;
  }[];
  lowStockAlerts: {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    suggestedRestock: number;
    supplierName?: string;
    supplierPhone?: string;
    supplierWhatsapp?: string;
  }[];
  recentStockMovements: InventoryTransaction[];
}

// POS Cart Item
export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}
