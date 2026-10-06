import React, { useState } from 'react';
import { BusinessMetrics, Business } from '../../types/models';
import { formatGHS } from '../../services/calculations';

interface ReportsViewProps {
  metrics: BusinessMetrics;
  business: Business;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ metrics, business }) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const salesVal =
    timeframe === 'daily'
      ? metrics.dailySales
      : timeframe === 'weekly'
      ? metrics.weeklySales
      : metrics.monthlySales;

  const expenseVal =
    timeframe === 'daily'
      ? metrics.dailyExpenses
      : timeframe === 'weekly'
      ? metrics.weeklyExpenses
      : metrics.monthlyExpenses;

  const grossProfitVal =
    timeframe === 'daily'
      ? metrics.dailyGrossProfit
      : timeframe === 'weekly'
      ? metrics.weeklySales - metrics.weeklyExpenses
      : metrics.monthlyGrossProfit;

  const netProfitVal =
    timeframe === 'daily'
      ? metrics.dailyNetProfit
      : timeframe === 'weekly'
      ? metrics.weeklyNetProfit
      : metrics.monthlyNetProfit;

  // GRA Tax estimations
  const graTaxableRevenue = salesVal;
  const graVatRate = business.graVatFlatRateEnabled ? business.vatRatePercent || 3 : 0;
  const graEstimatedVatLiability = (graTaxableRevenue * graVatRate) / 100;

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[#835500] mb-1">
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            <span className="text-[11px] font-mono-num uppercase tracking-wider font-bold">
              Financial Health &amp; Auditing
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Real calculated numbers for Ghana Revenue Authority (GRA) compliance, margin analysis, and stock velocity.
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-gray-200 text-xs font-mono-num font-bold self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === 'daily' ? 'bg-[#005431] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === 'weekly' ? 'bg-[#005431] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past 7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === 'monthly' ? 'bg-[#005431] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* 4 Core Financial Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono-num uppercase text-gray-400 font-bold block mb-1">
            Gross Sales
          </span>
          <div className="text-2xl font-bold font-mono-num text-[#005431]">
            {formatGHS(salesVal)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Verified POS entries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono-num uppercase text-gray-400 font-bold block mb-1">
            Total Expenditures
          </span>
          <div className="text-2xl font-bold font-mono-num text-[#8b1f09]">
            {formatGHS(expenseVal)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Stock, rent, utilities &amp; payroll</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono-num uppercase text-gray-400 font-bold block mb-1">
            Gross Margin Profit
          </span>
          <div className="text-2xl font-bold font-mono-num text-gray-900">
            {formatGHS(grossProfitVal)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {salesVal > 0 ? ((grossProfitVal / salesVal) * 100).toFixed(1) : 0}% Gross Margin
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
          <span className="text-[11px] font-mono-num uppercase text-[#005431] font-bold block mb-1">
            Estimated Net Profit
          </span>
          <div className="text-2xl font-bold font-mono-num text-[#005431]">
            {formatGHS(netProfitVal)}
          </div>
          <p className="text-xs text-emerald-800 font-semibold mt-1">Clean net take-home</p>
        </div>
      </div>

      {/* GRA Tax Compliance & Flat Rate Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#835500] text-[22px]">account_balance</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Ghana Revenue Authority (GRA) Tax Audit</h3>
              <p className="text-xs text-gray-500">TIN: {business.tinNumber || 'C0028919283'} • VAT Flat Rate Scheme</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono-num font-bold ${
            business.graVatFlatRateEnabled ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-700'
          }`}>
            {business.graVatFlatRateEnabled ? '3% Flat Rate Scheme Active' : 'Informal Trader Exempt (0%)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-num">
          <div className="p-3 bg-[#f0f3ff] rounded-xl border border-blue-50/50">
            <span className="text-gray-400 block mb-1 uppercase font-bold">Taxable Turnover</span>
            <span className="text-base font-bold text-gray-900">{formatGHS(graTaxableRevenue)}</span>
          </div>
          <div className="p-3 bg-[#f0f3ff] rounded-xl border border-blue-50/50">
            <span className="text-gray-400 block mb-1 uppercase font-bold">Applied Scheme</span>
            <span className="text-base font-bold text-gray-900">{graVatRate}% (VAT / COVID Levy)</span>
          </div>
          <div className="p-3 bg-[#f0f3ff] rounded-xl border border-blue-50/50">
            <span className="text-gray-400 block mb-1 uppercase font-bold">Estimated Tax Liability</span>
            <span className="text-base font-bold text-[#835500]">{formatGHS(graEstimatedVatLiability)}</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed">
          Under the GRA VAT Flat Rate Scheme (VFRS), retailers in Ghana pay a 3% flat rate on taxable supplies without input VAT deduction. Small provision market stalls below the GH₵ 200,000 annual threshold remain classified under the exempt category.
        </p>
      </div>

      {/* Stock Velocity & Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="font-bold text-gray-900 text-base mb-3">Top 5 Best-Selling SKUs by Volume</h3>
          <div className="space-y-3">
            {metrics.bestSellingProducts.slice(0, 5).map((p, i) => (
              <div key={p.productId} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#f0f3ff]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-gray-700 font-bold flex items-center justify-center font-mono-num">
                    {i + 1}
                  </span>
                  <span className="font-bold text-gray-900">{p.productName}</span>
                </div>
                <div className="text-right font-mono-num font-bold text-[#005431]">
                  {p.quantitySold} units ({formatGHS(p.revenueGHS)})
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="font-bold text-gray-900 text-base mb-3">Stock Audit Trail (Recent Movement)</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {metrics.recentStockMovements.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                  <span className="font-semibold text-gray-800">{tx.productName}</span>
                  <span className="text-[11px] font-mono-num text-gray-400 block">{tx.reason}</span>
                </div>
                <span className={`font-mono-num font-bold ${tx.quantityChange < 0 ? 'text-[#8b1f09]' : 'text-[#005431]'}`}>
                  {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange} units
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
