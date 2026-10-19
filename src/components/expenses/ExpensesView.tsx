import React, { useState } from 'react';
import { Expense, ExpenseCategory, PaymentChannel, Business } from '../../types/models';
import { formatGHS } from '../../services/calculations';

interface ExpensesViewProps {
  expenses: Expense[];
  business: Business;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  business,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Stock Purchase');
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('Cash');
  const [payee, setPayee] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('Today, 02:45 PM');
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute today's and month's expenses
  const today = new Date();
  const todayExpenses = expenses.filter((e) => {
    const d = new Date(e.date || e.createdAt);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthlyCap = business.monthlyExpenseCap || 8500;
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date || e.createdAt);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthPercentage = Math.min(100, Math.round((currentMonthTotal / monthlyCap) * 100));
  const remainingMonthly = Math.max(0, monthlyCap - currentMonthTotal);

  // Categories config
  const categoryOptions: { name: ExpenseCategory; icon: string; color: string }[] = [
    { name: 'Stock Purchase', icon: 'inventory_2', color: 'text-emerald-700' },
    { name: 'Shop Rent', icon: 'storefront', color: 'text-[#835500]' },
    { name: 'ECG / Power', icon: 'bolt', color: 'text-[#835500]' },
    { name: 'Trotro / Fuel', icon: 'directions_bus', color: 'text-[#8b1f09]' },
    { name: 'Wages & Chow', icon: 'restaurant', color: 'text-[#835500]' },
    { name: 'Packaging / Bags', icon: 'shopping_bag', color: 'text-emerald-700' },
    { name: 'Data & Airtime', icon: 'wifi', color: 'text-[#835500]' },
    { name: 'Assembly Toll', icon: 'account_balance', color: 'text-gray-500' },
    { name: 'Other Expense', icon: 'pending_actions', color: 'text-[#8b1f09]' },
  ];

  const handleAdjustAmount = (delta: number) => {
    const cur = parseFloat(amountStr) || 0;
    setAmountStr((cur + delta).toFixed(2));
  };

  const handleClearAmount = () => {
    setAmountStr('');
  };

  const handleRefreshTime = () => {
    const now = new Date();
    setTimestamp(`Today, ${now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async (andReset = false) => {
    const amount = parseFloat(amountStr);
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    await onAddExpense({
      businessId: business.id,
      amount,
      category: selectedCategory,
      paymentChannel: selectedChannel,
      payee: payee.trim() || selectedCategory,
      memo: memo.trim() || `${selectedCategory} payout`,
      date: new Date().toISOString(),
      recordedBy: 'Abena Mensah',
    });

    showToast(`Expense GH₵ ${amount.toFixed(2)} (${selectedCategory}) recorded!`);
    setAmountStr('');
    setPayee('');
    setMemo('');
    setReceiptFileName(null);

    if (!andReset) {
      // scroll to recent
    }
  };

  const exportDailyCsv = () => {
    const headers = 'ID,Date,Category,Payment Channel,Payee,Memo,Amount (GHS)\n';
    const rows = todayExpenses
      .map(
        (e) =>
          `"${e.id}","${new Date(e.date).toLocaleTimeString('en-GH')}","${e.category}","${e.paymentChannel}","${e.payee}","${e.memo}",${e.amount}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MarketMate_Expenses_${today.toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Exported Daily Expenses CSV!');
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* 1. Top Analytical Banner & Budget Gauge */}
      <section className="w-full bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-red-50 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#ffdad3] flex items-center justify-center text-[#8b1f09] shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">payments</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-num text-gray-500 uppercase tracking-wider">
                Outflow Tracker • {business.branch}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ffddb4] text-[#291800] text-[10px] font-mono-num font-bold">
                Safe Margin
              </span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl md:text-2xl font-bold text-[#8b1f09] tracking-tight">
                Today's Expenses:
              </span>
              <span className="text-2xl md:text-3xl font-extrabold font-mono-num text-[#8b1f09] tracking-tight">
                {formatGHS(todayTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Budget Gauge */}
        <div className="flex flex-col w-full lg:w-96 gap-1.5 z-10 bg-[#f0f3ff] p-3 rounded-xl border border-blue-50/50">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-600 font-mono-num">
              Monthly Cap: GH₵ {monthlyCap.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-mono-num font-bold text-[#8b1f09]">
              GH₵ {currentMonthTotal.toFixed(2)} ({monthPercentage}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-[#8b1f09] rounded-full transition-all duration-500"
              style={{ width: `${monthPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono-num text-gray-500">
            <span>Remaining: GH₵ {remainingMonthly.toFixed(2)}</span>
            <span>18 days left in cycle</span>
          </div>
        </div>
      </section>

      {/* 2. Main Grid: Entry Card (Left) vs Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Record Business Payout (8 cols) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-gray-100">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Record Business Payout</h2>
              <p className="text-xs text-gray-500">Capture petty cash, transport, stock drops, and municipal tolls.</p>
            </div>
            <span className="text-xs font-mono-num text-[#005431] bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold border border-emerald-100">
              <span className="material-symbols-outlined text-[15px]">bolt</span> FAST ENTRY
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {/* Amount Entry Module */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-[#f0f3ff] border border-blue-50/50">
              <label className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold flex items-center justify-between">
                <span>Paid Out Amount</span>
                <span className="text-[#8b1f09] lowercase font-normal">zero pesewa leakage</span>
              </label>

              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-xs border border-gray-100 focus-within:ring-2 focus-within:ring-[#005431]">
                <span className="text-xl md:text-2xl font-bold font-mono-num text-[#835500] select-none">
                  GH₵
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-xl md:text-2xl font-mono-num text-gray-900 font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:text-[#8b1f09] flex items-center justify-center shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">backspace</span>
                </button>
              </div>

              {/* Quick Increment Preset Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                <span className="text-[11px] font-mono-num text-gray-400 font-bold shrink-0 mr-1">ADD:</span>
                {[10, 20, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAdjustAmount(val)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-800 text-xs font-mono-num font-bold shrink-0 shadow-xs border border-gray-100 active:scale-95 transition-all"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Dropdown & Quick-Picker Grid */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <label htmlFor="expense-category-select" className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1">
                  <span>Category Outflow</span>
                  <span className="text-gray-400 font-normal">(Dropdown &amp; Quick Select)</span>
                </label>
                <span className="text-xs font-semibold text-[#005431] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {selectedCategory}
                </span>
              </div>

              {/* Categorization Dropdown */}
              <div className="relative">
                <select
                  id="expense-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f3ff] text-gray-900 font-semibold text-xs border border-blue-100 focus:outline-none focus:ring-2 focus:ring-[#005431] appearance-none cursor-pointer pr-10 shadow-xs"
                >
                  <option value="Stock Purchase">Stock Purchase (Wholesale goods, inventory, restock)</option>
                  <option value="Shop Rent">Rent (Shop / Stall Rental, space lease)</option>
                  <option value="Trotro / Fuel">Transport (Trotro fare, loading fee, fuel, logistics)</option>
                  <option value="ECG / Power">Utility (ECG electricity tokens, water bill, waste)</option>
                  <option value="Wages & Chow">Wages &amp; Chow (Shop assistant daily pay &amp; lunch allowance)</option>
                  <option value="Packaging / Bags">Packaging / Bags (Polythene, cartons, sealing)</option>
                  <option value="Data & Airtime">Data &amp; Airtime (Internet bundles, client calls)</option>
                  <option value="Assembly Toll">Assembly Toll (District / AMA municipal ticket)</option>
                  <option value="Other Expense">Other Expense (Repairs, maintenance, miscellaneous)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-500 pointer-events-none text-[20px]">
                  arrow_drop_down
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {categoryOptions.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all text-xs font-semibold ${
                        isActive
                          ? 'bg-[#005431] text-white shadow-xs'
                          : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff] border border-blue-50/50'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] shrink-0 ${
                          isActive ? 'text-white' : cat.color
                        }`}
                      >
                        {cat.icon}
                      </span>
                      <span className="truncate leading-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Channel & Timestamp Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Channel */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold">
                  Paid From Account
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#f0f3ff] p-1 rounded-xl border border-blue-50/50">
                  {(['Cash', 'MoMo', 'Personal'] as PaymentChannel[]).map((chan) => {
                    const isActive = selectedChannel === chan;
                    return (
                      <button
                        key={chan}
                        type="button"
                        onClick={() => setSelectedChannel(chan)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-semibold gap-1 transition-all ${
                          isActive
                            ? 'bg-white text-gray-900 shadow-xs font-bold'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {chan === 'Cash' ? 'payments' : chan === 'MoMo' ? 'phone_android' : 'person'}
                        </span>
                        <span className="text-[11px] truncate">
                          {chan === 'Cash' ? 'Cash Box' : chan === 'MoMo' ? 'MoMo Wallet' : 'Owner Cash'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold">
                  Timestamp
                </label>
                <div className="flex items-center gap-2 bg-[#f0f3ff] px-3 py-2 rounded-xl h-[56px] border border-blue-50/50">
                  <span className="material-symbols-outlined text-gray-500 text-[20px]">calendar_today</span>
                  <input
                    type="text"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-gray-900 w-full focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRefreshTime}
                    className="text-[#005431] hover:bg-white p-1 rounded transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">update</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payee & Memo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold">
                  Supplier or Receiver
                </label>
                <div className="flex items-center gap-2 bg-[#f0f3ff] px-3 py-2.5 rounded-xl border border-blue-50/50">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">store</span>
                  <input
                    type="text"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    placeholder="e.g. ECG Prepaid Vendor / Kaneshie Driver"
                    className="bg-transparent text-xs text-gray-900 w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold">
                  Memo / Description
                </label>
                <div className="flex items-center gap-2 bg-[#f0f3ff] px-3 py-2.5 rounded-xl border border-blue-50/50">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">edit_note</span>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="e.g. 2 packs heavy black takeaway rubber"
                    className="bg-transparent text-xs text-gray-900 w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Audit Proof & Waybill Upload Tile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold">
                Audit Proof &amp; Receipt
              </label>
              <label className="w-full bg-[#f0f3ff] hover:bg-[#e7eeff] cursor-pointer p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 transition-all border border-dashed border-gray-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReceiptFileName(e.target.files[0].name);
                      showToast(`Attached photo: ${e.target.files[0].name}`);
                    }
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white text-[#005431] flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">
                      {receiptFileName ? `Receipt: ${receiptFileName}` : 'Snap Photo of Receipt or Waybill'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Attaches directly to offline Makola cloud backup
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-semibold shadow-xs">
                  {receiptFileName ? 'Change File' : 'Choose File'}
                </span>
              </label>
            </div>

            {/* Bottom Save CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full sm:flex-1 h-12 bg-[#005431] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#0d6e43] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Save Expense</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto px-5 h-12 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">queue</span>
                <span>Save &amp; Add Another</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Section: Outflow Split Donut + Today's Log (4/5 cols) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
          {/* Outflow Split Donut Card */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b1f09] text-[20px]">donut_large</span>
                <h3 className="text-base font-bold text-gray-900">Outflow Split</h3>
              </div>
              <span className="text-[11px] font-mono-num text-gray-400 font-bold uppercase">
                {todayExpenses.length} Entries
              </span>
            </div>

            <div className="flex items-center gap-4 py-1">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="text-gray-100"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="4.5"
                  />
                  <circle
                    className="text-[#8b1f09]"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14"
                    stroke="currentColor"
                    strokeDasharray="67.7 100"
                    strokeDashoffset="0"
                    strokeWidth="4.5"
                  />
                  <circle
                    className="text-[#feae2c]"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14"
                    stroke="currentColor"
                    strokeDasharray="19.3 100"
                    strokeDashoffset="-67.7"
                    strokeWidth="4.5"
                  />
                  <circle
                    className="text-[#005431]"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="14"
                    stroke="currentColor"
                    strokeDasharray="13.0 100"
                    strokeDashoffset="-87.0"
                    strokeWidth="4.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[9px] font-mono-num text-gray-400 uppercase">Restock</span>
                  <span className="text-xs font-mono-num font-bold text-gray-900">68%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8b1f09] shrink-0"></span>
                    <span className="truncate">Stock Restock</span>
                  </span>
                  <span className="font-mono-num font-bold text-gray-900">67.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#feae2c] shrink-0"></span>
                    <span className="truncate">ECG / Power</span>
                  </span>
                  <span className="font-mono-num font-bold text-gray-900">19.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#005431] shrink-0"></span>
                    <span className="truncate">Transport &amp; Food</span>
                  </span>
                  <span className="font-mono-num font-bold text-gray-900">13.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Log List */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Today's Log</h3>
                <span className="text-xs text-gray-500">Tap trash icon to remove entry</span>
              </div>
              <span className="text-xs font-mono-num font-bold text-[#8b1f09] bg-[#ffdad3] px-2.5 py-1 rounded-md">
                GH₵ {todayTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
              {todayExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors flex items-center justify-between gap-2 border border-blue-50/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white text-[#8b1f09] flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">
                        {exp.category === 'Stock Purchase'
                          ? 'inventory_2'
                          : exp.category === 'ECG / Power'
                          ? 'bolt'
                          : exp.category === 'Trotro / Fuel'
                          ? 'directions_bus'
                          : 'receipt'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-900 truncate">{exp.payee}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono-num text-gray-400">
                        <span className="px-1.5 py-0.2 rounded bg-white font-bold text-[#835500]">
                          {exp.paymentChannel}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(exp.date).toLocaleTimeString('en-GH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono-num font-bold text-[#8b1f09]">
                      GH₵ {exp.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp.id)}
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                      title="Delete expense"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reconciliation Footer */}
            <div className="p-3 rounded-xl bg-gray-50 flex items-center justify-between text-xs text-gray-500 border border-gray-100">
              <span className="flex items-center gap-1.5 text-[#005431] font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Makola Cashier Reconciled
              </span>
              <button
                type="button"
                onClick={exportDailyCsv}
                className="text-xs font-mono-num text-[#005431] font-bold hover:underline"
              >
                Export Daily CSV
              </button>
            </div>
          </div>

          {/* GRA Tax Pro-Tip Card */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-xs flex items-center gap-3">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmF75Krt262swYRJNQpSs8ikKFF1eTc6dk4Z44SCMELlUpsIFuxZnehoHAZ1ALd3iWxYmukBTPjmNzoTAqBxM0AW9JDzx_DpP7Nm70UE85tUrHYCuC_dYkBQqAMNaM4q4o4grWny4nxbkCwndXCpAimAe6L_kO_HL1tLlWNj3MnxMni01m-38NuDVvxiq5qaEtpXZj3x1Siaoq4m-Pz5pTHsAuNN9St0yVJzqNbWWQwpysCd6ljMnDCA"
              alt="Makola Market Provision Stall"
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#835500] font-bold">
                PRO-TIP FOR TODAY
              </span>
              <p className="text-xs text-gray-600 leading-snug">
                Attach fuel &amp; trotro waybills right when paying to claim deductible tax on annual GRA filings.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
