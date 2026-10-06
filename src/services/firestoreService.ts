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
const STORAGE_KEYS = {
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
};

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
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
  // In-memory state cached from local storage and synced with Firestore
  user: User = getLocalData(STORAGE_KEYS.USER, INITIAL_USER);
  business: Business = getLocalData(STORAGE_KEYS.BUSINESS, INITIAL_BUSINESS);
  products: Product[] = getLocalData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  sales: Sale[] = getLocalData(STORAGE_KEYS.SALES, INITIAL_SALES);
  saleItems: SaleItem[] = getLocalData(STORAGE_KEYS.SALE_ITEMS, INITIAL_SALE_ITEMS);
  expenses: Expense[] = getLocalData(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  customers: Customer[] = getLocalData(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  customerCredit: CustomerCredit[] = getLocalData(STORAGE_KEYS.CREDIT, INITIAL_CUSTOMER_CREDIT);
  creditPayments: CreditPayment[] = getLocalData(STORAGE_KEYS.CREDIT_PAYMENTS, INITIAL_CREDIT_PAYMENTS);
  suppliers: Supplier[] = getLocalData(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  transactions: InventoryTransaction[] = getLocalData(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  notifications: Notification[] = getLocalData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  subscription: Subscription = getLocalData(STORAGE_KEYS.SUBSCRIPTION, INITIAL_SUBSCRIPTION);

  private listeners: (() => void)[] = [];

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
}

export const store = new MarketMateDataStore();
