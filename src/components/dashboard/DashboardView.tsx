import React, { useState } from 'react';
import { Business, BusinessMetrics, Sale } from '../../types/models';
import { formatGHS } from '../../services/calculations';
import { exportReceiptAsPdf } from '../../services/pdfService';

interface DashboardViewProps {
  business: Business;
  metrics: BusinessMetrics;
  recentSales: Sale[];
  onNavigate: (path: string) => void;
  onQuickSale: () => void;
  onQuickExpense: () => void;
  onQuickAddStock: () => void;
  onQuickAddDebt: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  business,
  metrics,
  recentSales,
  onNavigate,
  onQuickSale,
  onQuickExpense,
  onQuickAddStock,
  onQuickAddDebt,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'momo' | 'credit'>('all');
  const [testPingSuccess, setTestPingSuccess] = useState(false);

  // Format today's date in British/Ghanaian style
  const todayDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const filteredSales = recentSales.filter((sale) => {
    if (filterType === 'all') return true;
    if (filterType === 'cash') return sale.paymentMethod === 'cash';
    if (filterType === 'momo')
      return (
        sale.paymentMethod === 'momo_mtn' ||
        sale.paymentMethod === 'momo_telecel' ||
        sale.paymentMethod === 'momo_at'
      );
    if (filterType === 'credit') return sale.paymentMethod === 'credit';
    return true;
  });

  const handleTestPing = () => {
    setTestPingSuccess(true);
    setTimeout(() => setTestPingSuccess(false), 2500);
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. Store Greeting Header & Daily Meta */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-emerald-100/50 blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-36 h-36 rounded-full bg-amber-100/50 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-mono-num uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                {business.branch} • Online &amp; Synced
              </span>
              <span>•</span>
              <span className="font-bold text-gray-700">{todayDateStr}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Akwaaba, Abena! 👋
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl">
              Brisk trading morning in Makola Market. Your morning sales are outpacing yesterday by{' '}
              <span className="font-bold text-emerald-700">+18%</span>.
            </p>
          </div>

          {/* Quick Terminal Stat Pill */}
          <div className="flex items-center gap-3 self-start lg:self-auto bg-[#f0f3ff] px-4 py-3 rounded-xl border border-blue-50/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#005431] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[24px]">storefront</span>
            </div>
            <div className="leading-tight">
              <span className="block text-[11px] font-mono-num text-gray-500 uppercase font-semibold">
                Register Status
              </span>
              <span className="text-base font-bold text-gray-900">Counter #1 Open</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Summary Metrics Grid (5 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Today's Sales */}
        <div className="relative flex flex-col justify-between bg-white p-4 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num text-gray-500 uppercase font-bold tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#005431] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-[#005431] tracking-tight">
              {formatGHS(metrics.dailySales, false)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono-num text-[#005431] font-semibold">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>+18% vs yesterday</span>
            </div>
          </div>
          <div className="pt-1 text-gray-500 text-xs">
            {metrics.dailySalesCount} recorded transactions
          </div>
        </div>

        {/* Card 2: Expenses */}
        <div className="relative flex flex-col justify-between bg-white p-4 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num text-gray-500 uppercase font-bold tracking-wider">
              Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad3] text-[#8b1f09] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">trending_down</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-[#8b1f09] tracking-tight">
              {formatGHS(metrics.dailyExpenses, false)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono-num text-[#ac371f] font-semibold">
              <span className="material-symbols-outlined text-[15px]">error</span>
              <span>4 entries today</span>
            </div>
          </div>
          <div className="pt-1 text-gray-500 text-xs truncate" title="Fuel, Stock delivery, Lunch">
            Fuel, Stock delivery, Lunch
          </div>
        </div>

        {/* Card 3: Estimated Profit */}
        <div className="relative flex flex-col justify-between bg-white p-4 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num text-gray-500 uppercase font-bold tracking-wider">
              Estimated Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#005431] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-gray-900 tracking-tight">
              {formatGHS(metrics.dailyNetProfit, false)}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-mono-num font-bold">
              <span>
                {metrics.dailySales > 0
                  ? ((metrics.dailyNetProfit / metrics.dailySales) * 100).toFixed(1)
                  : '57.2'}
                % Margin
              </span>
            </div>
          </div>
          <div className="pt-1 text-gray-500 text-xs">Calculated net today</div>
        </div>

        {/* Card 4: Customers Owing (Debt) */}
        <div className="relative flex flex-col justify-between bg-white p-4 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num text-gray-500 uppercase font-bold tracking-wider">
              Customers Owing
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffddb4] text-[#835500] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-[#835500] tracking-tight">
              {formatGHS(metrics.outstandingCustomerCredit, false)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono-num text-[#835500] font-semibold">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span>{metrics.overdueCreditCount} overdue bills</span>
            </div>
          </div>
          <div className="pt-1 text-gray-500 text-xs">
            {metrics.totalDebtorsCount} debtors outstanding
          </div>
        </div>

        {/* Card 5: Low Stock Items */}
        <div className="relative flex flex-col justify-between bg-white p-4 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num text-gray-500 uppercase font-bold tracking-wider">
              Low Stock Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-red-600 tracking-tight">
              {metrics.lowStockItemsCount} Items
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-mono-num text-red-600 font-semibold">
              <span className="material-symbols-outlined text-[15px]">notification_important</span>
              <span>Immediate restock alert</span>
            </div>
          </div>
          <div className="pt-1 text-gray-500 text-xs truncate">Includes Ideal Milk &amp; Frytol</div>
        </div>
      </div>

      {/* 3. 6 Prominent Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Record Sale */}
        <button
          type="button"
          onClick={onQuickSale}
          className="group relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-[#005431] text-white hover:bg-[#0d6e43] active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">add_shopping_cart</span>
          </div>
          <span className="text-sm font-bold text-center">Record Sale</span>
        </button>

        {/* Record Expense */}
        <button
          type="button"
          onClick={onQuickExpense}
          className="group relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-[#8b1f09] text-white hover:bg-[#ac371f] active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </div>
          <span className="text-sm font-bold text-center">Record Expense</span>
        </button>

        {/* Add Stock */}
        <button
          type="button"
          onClick={onQuickAddStock}
          className="group relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-[#263143] text-white hover:bg-[#111c2d] active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <span className="text-sm font-bold text-center">Add Stock</span>
        </button>

        {/* Add Customer Debt */}
        <button
          type="button"
          onClick={onQuickAddDebt}
          className="group relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-[#feae2c] text-[#291800] hover:bg-[#ffb955] active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">menu_book</span>
          </div>
          <span className="text-sm font-bold text-center">Add Debt</span>
        </button>

        {/* View Report */}
        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          className="group relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-[#dee8ff] text-[#111c2d] hover:bg-[#cfdaf2] active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-900">
            <span className="material-symbols-outlined text-[24px]">bar_chart</span>
          </div>
          <span className="text-sm font-bold text-center">View Report</span>
        </button>

        {/* Ask AI */}
        <button
          type="button"
          onClick={() => onNavigate('mate-ai-advisor')}
          className="group relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-gradient-to-br from-[#005431] via-[#0d6e43] to-[#feae2c] text-white hover:opacity-95 active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-amber-200">auto_awesome</span>
          </div>
          <span className="text-sm font-bold text-center">Ask Mate AI</span>
        </button>
      </div>

      {/* 4. Visual Charts & Analytics Section (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart Left: Sales & Profit Trends (7 Days) */}
        <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Sales &amp; Profit Trends</h2>
                <span className="text-xs font-mono-num px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
                  Past 7 Days
                </span>
              </div>
              <p className="text-xs text-gray-500">Daily net revenue vs gross margin performance in GHS</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono-num">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#005431]"></span>
                <span className="text-gray-700 font-semibold">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#feae2c]"></span>
                <span className="text-gray-700 font-semibold">Profit</span>
              </div>
            </div>
          </div>

          {/* SVG 7-day Bar & Area Chart */}
          <div className="w-full h-64 relative flex items-end">
            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 540 220">
              <line stroke="#dee8ff" strokeDasharray="4 4" x1="0" x2="540" y1="40" y2="40"></line>
              <line stroke="#dee8ff" strokeDasharray="4 4" x1="0" x2="540" y1="95" y2="95"></line>
              <line stroke="#dee8ff" strokeDasharray="4 4" x1="0" x2="540" y1="150" y2="150"></line>
              <line stroke="#bec9bf" strokeWidth="1.5" x1="0" x2="540" y1="195" y2="195"></line>

              {/* Mon */}
              <rect className="fill-[#005431]/25 hover:fill-[#005431] transition-colors cursor-pointer" height="95" rx="3" width="22" x="25" y="100"></rect>
              <rect className="fill-[#feae2c]/70 hover:fill-[#feae2c] transition-colors cursor-pointer" height="50" rx="3" width="16" x="50" y="145"></rect>
              {/* Tue */}
              <rect className="fill-[#005431]/25 hover:fill-[#005431] transition-colors cursor-pointer" height="110" rx="3" width="22" x="100" y="85"></rect>
              <rect className="fill-[#feae2c]/70 hover:fill-[#feae2c] transition-colors cursor-pointer" height="65" rx="3" width="16" x="125" y="130"></rect>
              {/* Wed */}
              <rect className="fill-[#005431]/25 hover:fill-[#005431] transition-colors cursor-pointer" height="125" rx="3" width="22" x="175" y="70"></rect>
              <rect className="fill-[#feae2c]/70 hover:fill-[#feae2c] transition-colors cursor-pointer" height="75" rx="3" width="16" x="200" y="120"></rect>
              {/* Today (Highlighted peak) */}
              <rect className="fill-[#005431] transition-colors cursor-pointer" height="160" rx="3" width="22" x="250" y="35"></rect>
              <rect className="fill-[#feae2c] transition-colors cursor-pointer" height="105" rx="3" width="16" x="275" y="90"></rect>
              {/* Fri */}
              <rect className="fill-[#005431]/40 hover:fill-[#005431] transition-colors cursor-pointer" height="135" rx="3" width="22" x="325" y="60"></rect>
              <rect className="fill-[#feae2c]/70 hover:fill-[#feae2c] transition-colors cursor-pointer" height="80" rx="3" width="16" x="350" y="115"></rect>
              {/* Sat */}
              <rect className="fill-[#005431]/40 hover:fill-[#005431] transition-colors cursor-pointer" height="150" rx="3" width="22" x="400" y="45"></rect>
              <rect className="fill-[#feae2c]/70 hover:fill-[#feae2c] transition-colors cursor-pointer" height="90" rx="3" width="16" x="425" y="105"></rect>
              {/* Sun */}
              <rect className="fill-[#005431]/25 hover:fill-[#005431] transition-colors cursor-pointer" height="65" rx="3" width="22" x="475" y="130"></rect>
              <rect className="fill-[#feae2c]/70 hover:fill-[#feae2c] transition-colors cursor-pointer" height="35" rx="3" width="16" x="500" y="160"></rect>

              {/* Curve line */}
              <path d="M 36 100 Q 111 85, 186 70 T 261 35 T 336 60 T 411 45 T 486 130" fill="none" stroke="#005431" strokeLinecap="round" strokeWidth="2.5"></path>
              <circle className="fill-white stroke-[#005431] stroke-2" cx="261" cy="35" r="4.5"></circle>
            </svg>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-mono-num text-gray-500 pt-2 border-t border-gray-100">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span className="font-bold text-[#005431]">Today</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Chart Right: Best Selling Products Today */}
        <div className="lg:col-span-5 bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Best Selling Today</h2>
              <p className="text-xs text-gray-500">Top movers ranked by volume</p>
            </div>
            <span className="material-symbols-outlined text-[#835500]">local_fire_department</span>
          </div>

          <div className="flex flex-col gap-4">
            {metrics.bestSellingProducts.slice(0, 4).map((p, idx) => {
              const maxSold = metrics.bestSellingProducts[0]?.quantitySold || 50;
              const percent = Math.min(100, Math.round((p.quantitySold / maxSold) * 100));
              const barColors = ['bg-[#005431]', 'bg-[#0d6e43]', 'bg-[#feae2c]', 'bg-gray-400'];

              return (
                <div key={p.productId} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-900 truncate">
                      {idx + 1}. {p.productName}
                    </span>
                    <span className="font-mono-num text-[#005431] shrink-0">
                      {p.quantitySold} sold • GH₵ {p.revenueGHS.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColors[idx % barColors.length]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-mono-num">
            <span className="text-gray-500">{metrics.totalCatalogCount} catalog SKUs active</span>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-[#005431] font-bold hover:underline flex items-center gap-0.5"
            >
              Full Stock Sheet
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Recent Transactions & Live Feed */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions &amp; Live Feed</h2>
            <p className="text-xs text-gray-500">Transactions synchronized across registers in real-time</p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl self-start md:self-auto text-xs font-mono-num font-bold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-[#005431] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('cash')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'cash' ? 'bg-[#005431] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setFilterType('momo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'momo' ? 'bg-[#005431] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MoMo / MTN
            </button>
            <button
              type="button"
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'credit' ? 'bg-[#005431] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Credit
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f3ff] text-gray-500 font-mono-num uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4" scope="col">Customer / Description</th>
                <th className="py-3 px-4" scope="col">Time</th>
                <th className="py-3 px-4" scope="col">Items / Cart Summary</th>
                <th className="py-3 px-4 text-right" scope="col">Amount (GHS)</th>
                <th className="py-3 px-4 text-center" scope="col">Payment Method</th>
                <th className="py-3 px-4 text-right" scope="col">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => {
                const initials = (sale.customerName || 'WA')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                const timeStr = new Date(sale.timestamp).toLocaleTimeString('en-GH', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={sale.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#005431] flex items-center justify-center font-mono-num text-[11px] font-bold">
                          {initials}
                        </div>
                        <div>
                          <span className="block">{sale.customerName}</span>
                          <span className="text-[11px] font-mono-num text-gray-400 font-normal">
                            #{sale.receiptNumber}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono-num">{timeStr}</td>
                    <td className="py-3.5 px-4 text-gray-800">{sale.itemsSummary}</td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#005431]">
                      GH₵ {sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {sale.paymentMethod === 'momo_mtn' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffddb4] text-[#291800] text-[11px] font-mono-num font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#835500]"></span>
                          MTN MoMo
                        </span>
                      ) : sale.paymentMethod === 'momo_telecel' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 text-[11px] font-mono-num font-bold">
                          Telecel Cash
                        </span>
                      ) : sale.paymentMethod === 'credit' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad3] text-[#8b1f09] text-[11px] font-mono-num font-bold">
                          Book Debt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[11px] font-mono-num font-bold">
                          Cash
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sale.paymentMethod === 'credit' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[#835500] font-bold">
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            Pending Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[#005431] font-bold">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            Paid
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            exportReceiptAsPdf(
                              {
                                receiptNumber: sale.receiptNumber,
                                timestamp: sale.timestamp,
                                customerName: sale.customerName,
                                items: [
                                  {
                                    name: sale.itemsSummary || 'Makola Market Provisions',
                                    quantity: sale.itemCount || 1,
                                    unitPrice: sale.totalAmount / (sale.itemCount || 1),
                                    subtotal: sale.totalAmount,
                                  },
                                ],
                                subtotal: sale.totalAmount - (sale.taxAmount || 0),
                                taxAmount: sale.taxAmount || 0,
                                totalAmount: sale.totalAmount,
                                paymentMethod: sale.paymentMethod,
                                momoNumber: sale.momoNumber,
                                momoReference: sale.momoReference,
                                cashReceived: sale.cashReceived,
                                changeGiven: sale.changeGiven,
                                cashierName: 'Abena Mensah',
                              },
                              business
                            );
                          }}
                          className="p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-[#005431] transition-colors"
                          title="Download Formatted PDF Receipt"
                        >
                          <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>Showing last {filteredSales.length} of {recentSales.length} recorded transactions</span>
          <button
            type="button"
            onClick={() => onNavigate('point-of-sale')}
            className="text-[#005431] font-bold hover:underline inline-flex items-center gap-1"
          >
            Open Full Transaction Journal
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 6. Offline Status Sync Banner (Tactile High-Contrast Assurance) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#263143] text-white p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[#feae2c] text-[#291800] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">wifi_off</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">📱 Offline Mode Ready</span>
              <span className="px-2 py-0.5 rounded-full bg-[#0d6e43] text-emerald-100 text-[10px] font-mono-num uppercase font-bold">
                Local Engine
              </span>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              All sales are recorded locally and sync automatically when internet is available. Your sales counter
              never stops—even without network in the market stall.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-mono-num">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>IndexedDB Synced</span>
          </div>
          <button
            type="button"
            onClick={handleTestPing}
            className="px-3.5 py-2 rounded-lg bg-white text-gray-900 text-xs font-mono-num font-bold hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
          >
            {testPingSuccess ? '✓ Pong: 12ms' : 'Test Ping'}
          </button>
        </div>
      </div>
    </div>
  );
};
