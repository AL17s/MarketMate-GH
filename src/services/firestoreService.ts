import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Product,
  Sale,
  SaleItem,
  Expense,
  Customer,
  CustomerCredit,
  CreditPayment,
  Supplier,
  InventoryTransaction,
  Notification,
  Subscription,
  Business,
  User,
} from '../types/models';
import {
  INITIAL_BUSINESS,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_CREDIT,
  INITIAL_CREDIT_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SALE_ITEMS,
  INITIAL_SUBSCRIPTION,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER,
} from './seedData';

// Local storage keys for instant zero-latency offline resilience
export const STORAGE_KEYS = {
  USER: 'marketmate_user',
  BUSINESS: 'marketmate_business',
  PRODUCTS: 'marketmate_products',
  SALES: 'marketmate_sales',
  SALE_ITEMS: 'marketmate_sale_items',
  EXPENSES: 'marketmate_expenses',
  CUSTOMERS: 'marketmate_customers',
  CREDIT: 'marketmate_customer_credit',
  CREDIT_PAYMENTS: 'marketmate_credit_payments',
  SUPPLIERS: 'marketmate_suppliers',
  TRANSACTIONS: 'marketmate_transactions',
  NOTIFICATIONS: 'marketmate_notifications',
  SUBSCRIPTION: 'marketmate_subscription',
  ONBOARDING_COMPLETED: 'marketmate_onboarding_completed',
  IS_DEMO_MODE: 'marketmate_is_demo_mode',
};

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // NOTE: Do NOT write fallback to localStorage on initial read!
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage write failed:', err);
  }
}

export class MarketMateDataStore {
  // In-memory state: fallbacks are empty arrays so first-time users start clean without demo clutter
  user: User = getLocalData(STORAGE_KEYS.USER, INITIAL_USER);
  business: Business = getLocalData(STORAGE_KEYS.BUSINESS, INITIAL_BUSINESS);
  products: Product[] = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  sales: Sale[] = getLocalData<Sale[]>(STORAGE_KEYS.SALES, []);
  saleItems: SaleItem[] = getLocalData<SaleItem[]>(STORAGE_KEYS.SALE_ITEMS, []);
  expenses: Expense[] = getLocalData<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  customers: Customer[] = getLocalData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  customerCredit: CustomerCredit[] = getLocalData<CustomerCredit[]>(STORAGE_KEYS.CREDIT, []);
  creditPayments: CreditPayment[] = getLocalData<CreditPayment[]>(STORAGE_KEYS.CREDIT_PAYMENTS, []);
  suppliers: Supplier[] = getLocalData<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  transactions: InventoryTransaction[] = getLocalData<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  notifications: Notification[] = getLocalData<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  subscription: Subscription = getLocalData(STORAGE_KEYS.SUBSCRIPTION, INITIAL_SUBSCRIPTION);

  private listeners: (() => void)[] = [];

  hasConfiguredBusiness(): boolean {
    try {
      const onboarded = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (onboarded === 'true') return true;
      if (onboarded === 'false') return false;
      return localStorage.getItem(STORAGE_KEYS.BUSINESS) !== null;
    } catch {
      return false;
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  // --- SALES MUTATIONS ---
  async addSale(
    sale: Omit<Sale, 'id' | 'createdAt'>,
    items: Omit<SaleItem, 'id' | 'saleId'>[]
  ): Promise<Sale> {
    const saleId = `sal_${Date.now()}`;
    const newSale: Sale = {
      ...sale,
      id: saleId,
      createdAt: new Date().toISOString(),
    };

    const newItems: SaleItem[] = items.map((item, index) => ({
      ...item,
      id: `sli_${Date.now()}_${index}`,
      saleId,
    }));

    // Update stock & inventory transactions
    const updatedProducts = [...this.products];
    const newTransactions: InventoryTransaction[] = [];

    newItems.forEach((item) => {
      const prodIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        const prevStock = prod.stockQuantity;
        const newStock = Math.max(0, prevStock - item.quantity);
        updatedProducts[prodIndex] = {
          ...prod,
          stockQuantity: newStock,
          updatedAt: new Date().toISOString(),
        };

        newTransactions.push({
          id: `tx_${Date.now()}_${item.productId}`,
          businessId: this.business.id,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          referenceId: saleId,
          reason: `POS sale #${newSale.receiptNumber}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // If paymentMethod is credit, append to customer credit book
    let updatedCredits = [...this.customerCredit];
    let updatedCustomers = [...this.customers];

    if (sale.paymentMethod === 'credit' && sale.customerId) {
      const creditId = `crd_${Date.now()}`;
      const newCredit: CustomerCredit = {
        id: creditId,
        businessId: this.business.id,
        customerId: sale.customerId,
        customerName: sale.customerName,
        saleId,
        amount: sale.totalAmount,
        amountPaid: 0,
        balance: sale.totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        description: sale.itemsSummary || `${sale.itemCount} items`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      updatedCredits.unshift(newCredit);

      const custIndex = updatedCustomers.findIndex((c) => c.id === sale.customerId);
      if (custIndex >= 0) {
        updatedCustomers[custIndex] = {
          ...updatedCustomers[custIndex],
          outstandingCredit: (updatedCustomers[custIndex].outstandingCredit || 0) + sale.totalAmount,
          status: 'active',
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // Update in-memory state & persist
    this.sales = [newSale, ...this.sales];
    this.saleItems = [...newItems, ...this.saleItems];
    this.products = updatedProducts;
    this.transactions = [...newTransactions, ...this.transactions];
    this.customerCredit = updatedCredits;
    this.customers = updatedCustomers;

    setLocalData(STORAGE_KEYS.SALES, this.sales);
    setLocalData(STORAGE_KEYS.SALE_ITEMS, this.saleItems);
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);
    setLocalData(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    setLocalData(STORAGE_KEYS.CREDIT, this.customerCredit);
    setLocalData(STORAGE_KEYS.CUSTOMERS, this.customers);

    // Sync to Firestore in background
    try {
      await setDoc(doc(db, 'sales', saleId), newSale);
      for (const item of newItems) {
        await setDoc(doc(db, 'sale_items', item.id), item);
      }
      for (const p of updatedProducts) {
        await setDoc(doc(db, 'products', p.id), p);
      }
    } catch {
      // Offline mode: saved locally
    }

    this.notify();
    return newSale;
  }

  // --- EXPENSE MUTATIONS ---
  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const expenseId = `exp_${Date.now()}`;
    const newExpense: Expense = {
      ...expense,
      id: expenseId,
      createdAt: new Date().toISOString(),
    };

    this.expenses = [newExpense, ...this.expenses];
    setLocalData(STORAGE_KEYS.EXPENSES, this.expenses);

    try {
      await setDoc(doc(db, 'expenses', expenseId), newExpense);
    } catch {
      // Offline mode
    }

    this.notify();
    return newExpense;
  }

  async deleteExpense(id: string): Promise<void> {
    this.expenses = this.expenses.filter((e) => e.id !== id);
    setLocalData(STORAGE_KEYS.EXPENSES, this.expenses);

    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch {
      // Offline mode
    }

    this.notify();
  }

  // --- PRODUCT & STOCK MUTATIONS ---
  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const productId = `prod_${Date.now()}`;
    const newProduct: Product = {
      ...product,
      id: productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products = [newProduct, ...this.products];
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);

    try {
      await setDoc(doc(db, 'products', productId), newProduct);
    } catch {
      // Offline
    }

    this.notify();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx < 0) return null;

    const updated = {
      ...this.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.products[idx] = updated;
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);

    try {
      await updateDoc(doc(db, 'products', id), updates);
    } catch {
      // Offline
    }

    this.notify();
    return updated;
  }

  async adjustStock(productId: string, delta: number, reason: string): Promise<Product | null> {
    const idx = this.products.findIndex((p) => p.id === productId);
    if (idx < 0) return null;

    const prod = this.products[idx];
    const prevStock = prod.stockQuantity;
    const newStock = Math.max(0, prevStock + delta);

    const updatedProd: Product = {
      ...prod,
      stockQuantity: newStock,
      lastRestockDate: delta > 0 ? new Date().toISOString() : prod.lastRestockDate,
      updatedAt: new Date().toISOString(),
    };
    this.products[idx] = updatedProd;

    const tx: InventoryTransaction = {
      id: `tx_${Date.now()}`,
      businessId: this.business.id,
      productId,
      productName: prod.name,
      type: delta > 0 ? 'restock' : 'adjustment',
      quantityChange: delta,
      previousStock: prevStock,
      newStock: newStock,
      reason,
      timestamp: new Date().toISOString(),
    };

    this.transactions = [tx, ...this.transactions];
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);
    setLocalData(STORAGE_KEYS.TRANSACTIONS, this.transactions);

    try {
      await setDoc(doc(db, 'products', productId), updatedProd);
      await setDoc(doc(db, 'inventory_transactions', tx.id), tx);
    } catch {
      // Offline
    }

    this.notify();
    return updatedProd;
  }

  // --- CUSTOMER & DEBT MUTATIONS ---
  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const customerId = `cust_${Date.now()}`;
    const newCustomer: Customer = {
      ...customer,
      id: customerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.customers = [newCustomer, ...this.customers];
    setLocalData(STORAGE_KEYS.CUSTOMERS, this.customers);

    try {
      await setDoc(doc(db, 'customers', customerId), newCustomer);
    } catch {
      // Offline
    }

    this.notify();
    return newCustomer;
  }

  async recordCreditPayment(
    creditId: string,
    amount: number,
    paymentMethod: 'cash' | 'momo_mtn' | 'momo_telecel' | 'momo_at' | 'bank',
    reference?: string
  ): Promise<CreditPayment | null> {
    const crdIndex = this.customerCredit.findIndex((c) => c.id === creditId);
    if (crdIndex < 0) return null;

    const credit = this.customerCredit[crdIndex];
    const newPaid = credit.amountPaid + amount;
    const newBalance = Math.max(0, credit.amount - newPaid);
    const newStatus = newBalance === 0 ? 'cleared' : 'partially_paid';

    this.customerCredit[crdIndex] = {
      ...credit,
      amountPaid: newPaid,
      balance: newBalance,
      status: newStatus,
    };

    // Update customer total outstanding debt
    const custIndex = this.customers.findIndex((c) => c.id === credit.customerId);
    if (custIndex >= 0) {
      const cust = this.customers[custIndex];
      const updatedBalance = Math.max(0, cust.outstandingCredit - amount);
      this.customers[custIndex] = {
        ...cust,
        outstandingCredit: updatedBalance,
        status: updatedBalance === 0 ? 'active' : cust.status,
        updatedAt: new Date().toISOString(),
      };
    }

    const payment: CreditPayment = {
      id: `pay_${Date.now()}`,
      businessId: this.business.id,
      creditId,
      customerId: credit.customerId,
      customerName: credit.customerName,
      amountPaid: amount,
      paymentMethod,
      reference,
      recordedAt: new Date().toISOString(),
    };

    this.creditPayments = [payment, ...this.creditPayments];

    setLocalData(STORAGE_KEYS.CREDIT, this.customerCredit);
    setLocalData(STORAGE_KEYS.CUSTOMERS, this.customers);
    setLocalData(STORAGE_KEYS.CREDIT_PAYMENTS, this.creditPayments);

    try {
      await setDoc(doc(db, 'customer_credit', creditId), this.customerCredit[crdIndex]);
      await setDoc(doc(db, 'credit_payments', payment.id), payment);
      if (custIndex >= 0) {
        await setDoc(doc(db, 'customers', credit.customerId), this.customers[custIndex]);
      }
    } catch {
      // Offline
    }

    this.notify();
    return payment;
  }

  // --- SUPPLIERS MUTATIONS ---
  async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
    const supplierId = `sup_${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplier,
      id: supplierId,
      createdAt: new Date().toISOString(),
    };

    this.suppliers = [newSupplier, ...this.suppliers];
    setLocalData(STORAGE_KEYS.SUPPLIERS, this.suppliers);

    try {
      await setDoc(doc(db, 'suppliers', supplierId), newSupplier);
    } catch {
      // Offline
    }

    this.notify();
    return newSupplier;
  }

  // --- NOTIFICATIONS MUTATIONS ---
  async markNotificationRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  // --- BUSINESS SETTINGS ---
  async updateBusiness(updates: Partial<Business>): Promise<Business> {
    this.business = {
      ...this.business,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setLocalData(STORAGE_KEYS.BUSINESS, this.business);

    try {
      await setDoc(doc(db, 'businesses', this.business.id), this.business);
    } catch {
      // Offline
    }

    this.notify();
    return this.business;
  }

  // --- DATA MANAGEMENT (FRESH START & RESTORE) ---
  async initializeCleanStore(config: {
    ownerName: string;
    shopName: string;
    branch: string;
    location: string;
    phone: string;
    momoProvider?: 'mtn' | 'telecel' | 'at';
    momoNumber?: string;
    momoMerchantName?: string;
    cashDrawerFloatGHS?: number;
    graVatFlatRateEnabled?: boolean;
  }): Promise<Business> {
    const businessId = `biz_${Date.now()}`;
    const userId = `usr_${Date.now()}`;

    const momoSettings = {
      mtnNumber: config.momoProvider === 'mtn' ? config.momoNumber || config.phone : '',
      mtnMerchantName: config.momoProvider === 'mtn' ? config.momoMerchantName || config.shopName : '',
      telecelNumber: config.momoProvider === 'telecel' ? config.momoNumber || config.phone : '',
      atMoneyNumber: config.momoProvider === 'at' ? config.momoNumber || config.phone : '',
    };

    const now = new Date().toISOString();

    const newBusiness: Business = {
      id: businessId,
      name: config.shopName.trim() || 'My Ghana Shop',
      branch: config.branch.trim() || 'Main Stall',
      location: config.location.trim() || 'Makola Market, Accra',
      ownerId: userId,
      phone: config.phone.trim(),
      currency: 'GHS',
      country: 'Ghana',
      cashDrawerFloatGHS: config.cashDrawerFloatGHS ?? 500,
      monthlyExpenseCap: 5000,
      graVatFlatRateEnabled: !!config.graVatFlatRateEnabled,
      vatRatePercent: config.graVatFlatRateEnabled ? 3 : 0,
      momoSettings,
      createdAt: now,
      updatedAt: now,
    };

    const newUser: User = {
      id: userId,
      email: 'owner@marketmate.gh',
      displayName: config.ownerName.trim() || 'Shop Owner',
      phone: config.phone.trim(),
      role: 'owner',
      businessId,
      createdAt: now,
      updatedAt: now,
    };

    const welcomeNotif: Notification = {
      id: `notif_${Date.now()}`,
      businessId,
      title: '🇬🇭 Akwaaba to MarketMate GH!',
      body: `Welcome, ${newUser.displayName}! Your shop "${newBusiness.name}" is now ready. Start by adding your first product in Inventory or recording a quick sale.`,
      type: 'daily_summary',
      read: false,
      createdAt: new Date().toISOString(),
    };

    this.business = newBusiness;
    this.user = newUser;
    this.products = [];
    this.sales = [];
    this.saleItems = [];
    this.expenses = [];
    this.customers = [];
    this.customerCredit = [];
    this.creditPayments = [];
    this.suppliers = [];
    this.transactions = [];
    this.notifications = [welcomeNotif];

    setLocalData(STORAGE_KEYS.BUSINESS, this.business);
    setLocalData(STORAGE_KEYS.USER, this.user);
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);
    setLocalData(STORAGE_KEYS.SALES, this.sales);
    setLocalData(STORAGE_KEYS.SALE_ITEMS, this.saleItems);
    setLocalData(STORAGE_KEYS.EXPENSES, this.expenses);
    setLocalData(STORAGE_KEYS.CUSTOMERS, this.customers);
    setLocalData(STORAGE_KEYS.CREDIT, this.customerCredit);
    setLocalData(STORAGE_KEYS.CREDIT_PAYMENTS, this.creditPayments);
    setLocalData(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    setLocalData(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      localStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, 'false');
    } catch (err) {
      console.warn('LocalStorage flags update failed:', err);
    }

    try {
      await setDoc(doc(db, 'businesses', businessId), newBusiness);
      await setDoc(doc(db, 'users', userId), newUser);
    } catch {
      // Offline mode
    }

    this.notify();
    return newBusiness;
  }

  loadDemoStore(): void {
    this.products = [...INITIAL_PRODUCTS];
    this.sales = [...INITIAL_SALES];
    this.saleItems = [...INITIAL_SALE_ITEMS];
    this.expenses = [...INITIAL_EXPENSES];
    this.customers = [...INITIAL_CUSTOMERS];
    this.customerCredit = [...INITIAL_CUSTOMER_CREDIT];
    this.creditPayments = [...INITIAL_CREDIT_PAYMENTS];
    this.suppliers = [...INITIAL_SUPPLIERS];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.business = { ...INITIAL_BUSINESS };
    this.user = { ...INITIAL_USER };
    this.subscription = { ...INITIAL_SUBSCRIPTION };

    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);
    setLocalData(STORAGE_KEYS.SALES, this.sales);
    setLocalData(STORAGE_KEYS.SALE_ITEMS, this.saleItems);
    setLocalData(STORAGE_KEYS.EXPENSES, this.expenses);
    setLocalData(STORAGE_KEYS.CUSTOMERS, this.customers);
    setLocalData(STORAGE_KEYS.CREDIT, this.customerCredit);
    setLocalData(STORAGE_KEYS.CREDIT_PAYMENTS, this.creditPayments);
    setLocalData(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    setLocalData(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    setLocalData(STORAGE_KEYS.BUSINESS, this.business);
    setLocalData(STORAGE_KEYS.USER, this.user);
    setLocalData(STORAGE_KEYS.SUBSCRIPTION, this.subscription);

    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      localStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, 'true');
    } catch (err) {
      console.warn('LocalStorage flags update failed:', err);
    }

    this.notify();
  }

  resetStoreAndStartClean(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      localStorage.removeItem(STORAGE_KEYS.BUSINESS);
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.SALE_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.CREDIT);
      localStorage.removeItem(STORAGE_KEYS.CREDIT_PAYMENTS);
      localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.IS_DEMO_MODE);
    } catch (err) {
      console.warn('Error clearing localStorage for reset:', err);
    }

    this.business = { ...INITIAL_BUSINESS };
    this.user = { ...INITIAL_USER };
    this.products = [];
    this.sales = [];
    this.saleItems = [];
    this.expenses = [];
    this.customers = [];
    this.customerCredit = [];
    this.creditPayments = [];
    this.suppliers = [];
    this.transactions = [];
    this.notifications = [];

    this.notify();
  }

  clearSampleData(): void {
    this.sales = [];
    this.saleItems = [];
    this.expenses = [];
    this.products = [];
    this.transactions = [];
    this.customerCredit = [];
    this.creditPayments = [];
    this.notifications = [
      {
        id: `notif_${Date.now()}`,
        businessId: this.business.id,
        title: '✨ Fresh Store Ledger Ready',
        body: 'Sample data cleared. You can now add your real products, record sales, and log expenses.',
        type: 'daily_summary',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    setLocalData(STORAGE_KEYS.SALES, this.sales);
    setLocalData(STORAGE_KEYS.SALE_ITEMS, this.saleItems);
    setLocalData(STORAGE_KEYS.EXPENSES, this.expenses);
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);
    setLocalData(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    setLocalData(STORAGE_KEYS.CREDIT, this.customerCredit);
    setLocalData(STORAGE_KEYS.CREDIT_PAYMENTS, this.creditPayments);
    setLocalData(STORAGE_KEYS.NOTIFICATIONS, this.notifications);

    this.notify();
  }

  reloadSampleData(): void {
    this.loadDemoStore();
  }

  // --- BATCH PRODUCT IMPORT ---
  importProducts(
    newItems: Array<{
      name: string;
      sku?: string;
      barcode?: string;
      category?: Product['category'];
      costPrice: number;
      sellingPrice: number;
      stockQuantity: number;
      lowStockThreshold?: number;
      unit?: string;
    }>
  ): number {
    const existing = [...this.products];
    let addedCount = 0;

    newItems.forEach((item, index) => {
      if (!item.name || !item.sellingPrice) return;

      const generatedSku = item.sku || `SKU-${Date.now().toString().slice(-4)}-${index}`;
      const existingIdx = existing.findIndex(
        (p) =>
          p.sku.toLowerCase() === generatedSku.toLowerCase() ||
          p.name.toLowerCase() === item.name.toLowerCase()
      );

      const category = item.category || 'Provisions';
      const unit = item.unit || 'piece';
      const lowThreshold = item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10;

      if (existingIdx >= 0) {
        // Update existing product stock & prices
        existing[existingIdx] = {
          ...existing[existingIdx],
          sellingPrice: item.sellingPrice,
          costPrice: item.costPrice || existing[existingIdx].costPrice,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: lowThreshold,
          category,
          unit,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Add new
        existing.push({
          id: `prod_${Date.now()}_${index}`,
          businessId: this.business.id,
          name: item.name,
          sku: generatedSku,
          barcode: item.barcode,
          category,
          costPrice: item.costPrice || item.sellingPrice * 0.75,
          sellingPrice: item.sellingPrice,
          stockQuantity: item.stockQuantity || 0,
          lowStockThreshold: lowThreshold,
          unit,
          lastRestockDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    this.products = existing;
    setLocalData(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();
    return addedCount;
  }
}

export const store = new MarketMateDataStore();
