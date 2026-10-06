import {
  Sale,
  Expense,
  CustomerCredit,
  Product,
  InventoryTransaction,
  BusinessMetrics,
  SaleItem,
} from '../types/models';

/**
 * Calculates start and end Date helpers for Ghanaian business days / weeks / months
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isWithinDays(targetDate: Date, referenceDate: Date, days: number): boolean {
  const diffTime = referenceDate.getTime() - targetDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

export function isPreviousMonth(targetDate: Date, referenceDate: Date): boolean {
  const prevMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  return (
    targetDate.getFullYear() === prevMonth.getFullYear() &&
    targetDate.getMonth() === prevMonth.getMonth()
  );
}

/**
 * Comprehensive calculation engine for MarketMate GH.
 * All financial results are calculated strictly from stored data without guesswork.
 */
export function calculateBusinessMetrics(
  sales: Sale[],
  saleItems: SaleItem[],
  expenses: Expense[],
  credits: CustomerCredit[],
  products: Product[],
  transactions: InventoryTransaction[],
  referenceDate: Date = new Date()
): BusinessMetrics {
  // 1. Daily Metrics
  const todaySales = sales.filter((s) => {
    const saleDate = new Date(s.timestamp || s.createdAt);
    return isSameDay(saleDate, referenceDate) && s.status !== 'voided';
  });

  const dailySales = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const dailySalesCost = todaySales.reduce((acc, s) => acc + (s.costAmount || 0), 0);
  const dailyGrossProfit = dailySales - dailySalesCost;

  const todayExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date || e.createdAt);
    return isSameDay(expDate, referenceDate);
  });
  const dailyExpenses = todayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const dailyNetProfit = dailyGrossProfit - dailyExpenses;

  // 2. Weekly Metrics (Past 7 Days inclusive)
  const weeklySalesList = sales.filter((s) => {
    const saleDate = new Date(s.timestamp || s.createdAt);
    return isWithinDays(saleDate, referenceDate, 7) && s.status !== 'voided';
  });
  const weeklySales = weeklySalesList.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const weeklySalesCost = weeklySalesList.reduce((acc, s) => acc + (s.costAmount || 0), 0);
  const weeklyGrossProfit = weeklySales - weeklySalesCost;

  const weeklyExpensesList = expenses.filter((e) => {
    const expDate = new Date(e.date || e.createdAt);
    return isWithinDays(expDate, referenceDate, 7);
  });
  const weeklyExpenses = weeklyExpensesList.reduce((acc, e) => acc + (e.amount || 0), 0);
  const weeklyNetProfit = weeklyGrossProfit - weeklyExpenses;

  // 3. Monthly Metrics (Current Month)
  const currentMonthSales = sales.filter((s) => {
    const saleDate = new Date(s.timestamp || s.createdAt);
    return isSameMonth(saleDate, referenceDate) && s.status !== 'voided';
  });
  const monthlySales = currentMonthSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const monthlySalesCost = currentMonthSales.reduce((acc, s) => acc + (s.costAmount || 0), 0);
  const monthlyGrossProfit = monthlySales - monthlySalesCost;

  const currentMonthExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date || e.createdAt);
    return isSameMonth(expDate, referenceDate);
  });
  const monthlyExpenses = currentMonthExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const monthlyNetProfit = monthlyGrossProfit - monthlyExpenses;

  // Previous Month Sales for Comparison
  const lastMonthSalesList = sales.filter((s) => {
    const saleDate = new Date(s.timestamp || s.createdAt);
    return isPreviousMonth(saleDate, referenceDate) && s.status !== 'voided';
  });
  const lastMonthSales = lastMonthSalesList.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  const monthOverMonthGrowthPercent =
    lastMonthSales > 0 ? ((monthlySales - lastMonthSales) / lastMonthSales) * 100 : 0;

  // 4. Customer Credit (Debtors Book)
  const activeCredits = credits.filter((c) => c.status !== 'cleared');
  const outstandingCustomerCredit = activeCredits.reduce(
    (acc, c) => acc + (c.balance || c.amount - (c.amountPaid || 0)),
    0
  );

  const overdueCreditCount = activeCredits.filter((c) => {
    if (!c.dueDate) return false;
    const due = new Date(c.dueDate);
    return due.getTime() < referenceDate.getTime() && c.balance > 0;
  }).length;

  const debtorIds = new Set(activeCredits.map((c) => c.customerId));
  const totalDebtorsCount = debtorIds.size;

  // 5. Inventory Valuation
  const inventoryValueSelling = products.reduce(
    (acc, p) => acc + p.sellingPrice * Math.max(0, p.stockQuantity),
    0
  );
  const inventoryValueCost = products.reduce(
    (acc, p) => acc + p.costPrice * Math.max(0, p.stockQuantity),
    0
  );
  const unrealizedProfit = inventoryValueSelling - inventoryValueCost;
  const totalCatalogCount = products.length;

  // 6. Low Stock Alerts
  const lowStockItems = products.filter(
    (p) => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0
  );
  const outOfStockItems = products.filter((p) => p.stockQuantity <= 0);

  const lowStockAlerts = [...lowStockItems, ...outOfStockItems].map((p) => {
    const targetBuffer = Math.max(p.lowStockThreshold * 3, 20);
    const deficit = Math.max(0, targetBuffer - p.stockQuantity);
    return {
      productId: p.id,
      productName: p.name,
      currentStock: p.stockQuantity,
      threshold: p.lowStockThreshold,
      suggestedRestock: deficit,
      supplierName: p.supplierName,
    };
  });

  // 7. Best Selling Products Ranking
  // Compute from Sale Items or fallback to parsing sales summary
  const productSalesMap = new Map<
    string,
    { name: string; category: string; qty: number; revenue: number; profit: number }
  >();

  // Initialize from products
  products.forEach((p) => {
    productSalesMap.set(p.id, {
      name: p.name,
      category: p.category,
      qty: 0,
      revenue: 0,
      profit: 0,
    });
  });

  saleItems.forEach((item) => {
    const existing = productSalesMap.get(item.productId);
    if (existing) {
      existing.qty += item.quantity || 0;
      existing.revenue += item.subtotal || 0;
      existing.profit += item.profit || item.subtotal - (item.unitCost || 0) * (item.quantity || 0);
    } else {
      productSalesMap.set(item.productId, {
        name: item.productName,
        category: 'Provisions',
        qty: item.quantity || 0,
        revenue: item.subtotal || 0,
        profit: item.profit || 0,
      });
    }
  });

  const bestSellingProducts = Array.from(productSalesMap.entries())
    .map(([id, stats]) => ({
      productId: id,
      productName: stats.name,
      category: stats.category,
      quantitySold: stats.qty,
      revenueGHS: stats.revenue,
      profitGHS: stats.profit,
    }))
    .filter((p) => p.quantitySold > 0)
    .sort((a, b) => b.quantitySold - a.quantitySold);

  // 8. Stock Movement Transactions (Sorted recent first)
  const recentStockMovements = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

  return {
    dailySales,
    dailySalesCount: todaySales.length,
    dailyGrossProfit,
    dailyNetProfit,
    dailyExpenses,
    weeklySales,
    weeklyExpenses,
    weeklyNetProfit,
    monthlySales,
    lastMonthSales,
    monthlyExpenses,
    monthlyGrossProfit,
    monthlyNetProfit,
    monthOverMonthGrowthPercent,
    outstandingCustomerCredit,
    overdueCreditCount,
    totalDebtorsCount,
    inventoryValueSelling,
    inventoryValueCost,
    unrealizedProfit,
    totalCatalogCount,
    lowStockItemsCount: lowStockItems.length + outOfStockItems.length,
    outOfStockCount: outOfStockItems.length,
    bestSellingProducts,
    lowStockAlerts,
    recentStockMovements,
  };
}

/**
 * Currency formatter helper in Ghana Cedis
 */
export function formatGHS(amount: number, includeDecimals = true): string {
  if (isNaN(amount) || amount === undefined || amount === null) return 'GH₵ 0.00';
  const formatted = amount.toLocaleString('en-GH', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
  return `GH₵ ${formatted}`;
}
