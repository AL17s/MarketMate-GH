import React, { useState, useEffect } from 'react';
import { store } from './services/firestoreService';
import { calculateBusinessMetrics } from './services/calculations';
import { testConnection } from './services/firebase';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosTerminalView } from './components/pos/PosTerminalView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { InventoryHubView } from './components/inventory/InventoryHubView';
import { DebtorsView } from './components/debtors/DebtorsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ReportsView } from './components/reports/ReportsView';
import { MateAiAdvisorView } from './components/ai/MateAiAdvisorView';
import { SettingsView } from './components/settings/SettingsView';
import { SubscriptionView } from './components/subscription/SubscriptionView';

export default function App() {
  // Navigation
  const [currentPath, setCurrentPath] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Reactive store state
  const [, setTick] = useState(0);

  useEffect(() => {
    // Validate Firestore connection on boot
    testConnection();

    // Subscribe to real-time store changes
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const business = store.business;
  const products = store.products;
  const sales = store.sales;
  const saleItems = store.saleItems;
  const expenses = store.expenses;
  const customers = store.customers;
  const credits = store.customerCredit;
  const creditPayments = store.creditPayments;
  const suppliers = store.suppliers;
  const transactions = store.transactions;
  const notifications = store.notifications;
  const subscription = store.subscription;

  // Re-calculate all business metrics dynamically
  const metrics = calculateBusinessMetrics(
    sales,
    saleItems,
    expenses,
    credits,
    products,
    transactions
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Fixed Top Header */}
      <Header
        business={business}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onNavigate={(path) => setCurrentPath(path)}
      />

      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={(path) => setCurrentPath(path)}
        onQuickSale={() => setCurrentPath('point-of-sale')}
        onQuickExpense={() => setCurrentPath('expenses')}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 pt-16 pb-24 lg:pb-8">
        <main className="w-full">
          {currentPath === 'dashboard' && (
            <DashboardView
              business={business}
              metrics={metrics}
              recentSales={sales.slice(0, 8)}
              onNavigate={(path) => setCurrentPath(path)}
              onQuickSale={() => setCurrentPath('point-of-sale')}
              onQuickExpense={() => setCurrentPath('expenses')}
              onQuickAddStock={() => setCurrentPath('inventory')}
              onQuickAddDebt={() => setCurrentPath('debtors-credit-book')}
            />
          )}

          {currentPath === 'point-of-sale' && (
            <PosTerminalView
              products={products}
              customers={customers}
              business={business}
              dailySalesTotal={metrics.dailySales}
              onCompleteSale={async (saleData, items) => {
                const completed = await store.addSale(
                  {
                    ...saleData,
                    businessId: business.id,
                    receiptNumber: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
                    taxAmount: 0,
                    status: 'completed',
                    cashierId: 'usr_abena_01',
                    timestamp: new Date().toISOString(),
                  },
                  items
                );
                return completed;
              }}
              onAddNewDebtor={async (name, phone) => {
                await store.addCustomer({
                  businessId: business.id,
                  name,
                  phone,
                  outstandingCredit: 0,
                  creditLimit: 500,
                  status: 'active',
                });
              }}
            />
          )}

          {currentPath === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              business={business}
              onAddExpense={async (exp) => {
                return await store.addExpense(exp);
              }}
              onDeleteExpense={async (id) => {
                await store.deleteExpense(id);
              }}
            />
          )}

          {currentPath === 'inventory' && (
            <InventoryHubView
              products={products}
              business={business}
              metrics={metrics}
              suppliers={suppliers}
              onAddProduct={async (prod) => {
                return await store.addProduct(prod);
              }}
              onAdjustStock={async (id, delta, reason) => {
                return await store.adjustStock(id, delta, reason);
              }}
              onUpdateProduct={async (id, updates) => {
                return await store.updateProduct(id, updates);
              }}
            />
          )}

          {currentPath === 'debtors-credit-book' && (
            <DebtorsView
              credits={credits}
              payments={creditPayments}
              customers={customers}
              business={business}
              onRecordPayment={async (creditId, amount, method, ref) => {
                return await store.recordCreditPayment(creditId, amount, method, ref);
              }}
              onAddCredit={async (credit) => {
                await store.addSale(
                  {
                    receiptNumber: `DEBT-${Date.now().toString().slice(-4)}`,
                    businessId: business.id,
                    customerId: credit.customerId,
                    customerName: credit.customerName,
                    totalAmount: credit.amount,
                    costAmount: credit.amount * 0.75,
                    grossProfit: credit.amount * 0.25,
                    taxAmount: 0,
                    paymentMethod: 'credit',
                    status: 'completed',
                    itemsSummary: credit.description,
                    itemCount: 1,
                    cashierId: 'usr_abena_01',
                    timestamp: new Date().toISOString(),
                  },
                  []
                );
              }}
            />
          )}

          {currentPath === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              business={business}
              onAddSupplier={async (sup) => {
                return await store.addSupplier(sup);
              }}
            />
          )}

          {currentPath === 'analytics' && (
            <ReportsView metrics={metrics} business={business} />
          )}

          {currentPath === 'mate-ai-advisor' && (
            <MateAiAdvisorView
              metrics={metrics}
              business={business}
              products={products}
              credits={credits}
              sales={sales}
              onNavigate={(path) => setCurrentPath(path)}
            />
          )}

          {currentPath === 'settings' && (
            <SettingsView
              business={business}
              onUpdateBusiness={async (updates) => {
                return await store.updateBusiness(updates);
              }}
            />
          )}

          {currentPath === 'subscription' && (
            <SubscriptionView subscription={subscription} business={business} />
          )}
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={async (id) => {
          await store.markNotificationRead(id);
        }}
        onNavigate={(path) => {
          setCurrentPath(path);
          setIsNotificationsOpen(false);
        }}
      />

      {/* Mobile Fixed Bottom Action Bar (Matching screenshot) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-3 border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setCurrentPath('point-of-sale')}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#005431] text-white text-xs font-bold shadow-xs active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Record Sale (GH₵)</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentPath('expenses')}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#ffdad3] text-[#8b1f09] text-xs font-bold active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">remove_circle</span>
          <span>Record Expense</span>
        </button>
      </div>
    </div>
  );
}
