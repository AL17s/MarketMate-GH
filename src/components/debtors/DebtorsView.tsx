import React, { useState } from 'react';
import { CustomerCredit, CreditPayment, Customer, Business } from '../../types/models';
import { formatGHS } from '../../services/calculations';
import { generateWhatsAppDebtReminderUrl } from '../../services/whatsappService';

interface DebtorsViewProps {
  credits: CustomerCredit[];
  payments: CreditPayment[];
  customers: Customer[];
  business: Business;
  onRecordPayment: (
    creditId: string,
    amount: number,
    paymentMethod: 'cash' | 'momo_mtn' | 'momo_telecel' | 'momo_at' | 'bank',
    reference?: string
  ) => Promise<CreditPayment | null>;
  onAddCredit: (credit: Omit<CustomerCredit, 'id' | 'createdAt'>) => Promise<void>;
}

export const DebtorsView: React.FC<DebtorsViewProps> = ({
  credits,
  payments,
  customers,
  business,
  onRecordPayment,
  onAddCredit,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'cleared'>('all');
  const [selectedCreditForPayment, setSelectedCreditForPayment] = useState<CustomerCredit | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo_mtn' | 'momo_telecel' | 'momo_at'>('momo_mtn');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Credit Modal
  const [showNewCreditModal, setShowNewCreditModal] = useState(false);
  const [newCustId, setNewCustId] = useState(customers[0]?.id || '');
  const [newCreditAmount, setNewCreditAmount] = useState('100.00');
  const [newCreditDesc, setNewCreditDesc] = useState('');
  const [newCreditDueDays, setNewCreditDueDays] = useState('7');

  const totalOutstanding = credits
    .filter((c) => c.status !== 'cleared')
    .reduce((sum, c) => sum + c.balance, 0);

  const overdueCredits = credits.filter((c) => c.status === 'overdue');
  const overdueTotal = overdueCredits.reduce((sum, c) => sum + c.balance, 0);

  const filteredCredits = credits.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'pending' || c.status === 'partially_paid';
    if (filter === 'overdue') return c.status === 'overdue';
    if (filter === 'cleared') return c.status === 'cleared';
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenPayment = (credit: CustomerCredit) => {
    setSelectedCreditForPayment(credit);
    setPaymentAmount(credit.balance.toString());
    setPaymentRef(`MM-PAY-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleConfirmPayment = async () => {
    if (!selectedCreditForPayment) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid repayment amount');
      return;
    }

    await onRecordPayment(
      selectedCreditForPayment.id,
      amount,
      paymentMethod,
      paymentRef || undefined
    );

    showToast(`Payment of GH₵ ${amount.toFixed(2)} recorded for ${selectedCreditForPayment.customerName}!`);
    setSelectedCreditForPayment(null);
  };

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === newCustId) || customers[0];
    const amt = parseFloat(newCreditAmount) || 0;
    const days = parseInt(newCreditDueDays, 10) || 7;
    const due = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

    await onAddCredit({
      businessId: business.id,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      amount: amt,
      amountPaid: 0,
      balance: amt,
      dueDate: due,
      description: newCreditDesc || 'Store items taken on credit',
      status: 'pending',
    });

    showToast(`Credit entry of GH₵ ${amt.toFixed(2)} created for ${cust.name}!`);
    setShowNewCreditModal(false);
    setNewCreditDesc('');
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[#835500] mb-1">
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span className="text-[11px] font-mono-num uppercase tracking-wider font-bold">
              {business.name} • Debtors Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Credit Book (Debtors)
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Track customer trust accounts, due dates, partial payments, and dispatch WhatsApp MoMo reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewCreditModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#005431] text-white text-xs font-bold hover:bg-[#0d6e43] shadow-xs active:scale-95 transition-all self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>+ Add Customer Debt</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-mono-num uppercase tracking-wider text-gray-400 font-bold">
            Total Outstanding Credit
          </span>
          <div className="my-2 text-2xl font-bold font-mono-num text-[#835500]">
            {formatGHS(totalOutstanding)}
          </div>
          <span className="text-xs text-gray-500">Across {customers.filter((c) => c.outstandingCredit > 0).length} active debtors</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#8b1f09] font-bold">
            Overdue Bills (Action Required)
          </span>
          <div className="my-2 text-2xl font-bold font-mono-num text-[#8b1f09]">
            {formatGHS(overdueTotal)}
          </div>
          <span className="text-xs text-red-600 font-semibold">{overdueCredits.length} accounts passed due date</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-mono-num uppercase tracking-wider text-gray-400 font-bold">
            Recent Repayments (30d)
          </span>
          <div className="my-2 text-2xl font-bold font-mono-num text-[#005431]">
            {formatGHS(payments.reduce((s, p) => s + p.amountPaid, 0))}
          </div>
          <span className="text-xs text-gray-500">{payments.length} partial or full collections</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono-num font-bold">
        {(['all', 'pending', 'overdue', 'cleared'] as const).map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive
                  ? 'bg-[#005431] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {f === 'all'
                ? 'All Debts'
                : f === 'pending'
                ? 'Pending & Partial'
                : f === 'overdue'
                ? `Overdue (${overdueCredits.length})`
                : 'Cleared'}
            </button>
          );
        })}
      </div>

      {/* Debtors List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f3ff] text-gray-500 font-mono-num uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer &amp; Phone</th>
                <th className="py-3 px-4">Items / Note</th>
                <th className="py-3 px-4 text-right">Original Debt</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCredits.map((c) => {
                const isOverdue = c.status === 'overdue';
                const isCleared = c.status === 'cleared';

                return (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{c.customerName}</div>
                      <div className="text-[11px] font-mono-num text-gray-400">{c.customerPhone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate">{c.description}</td>
                    <td className="py-3.5 px-4 text-right font-mono-num text-gray-500">
                      GH₵ {c.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#835500]">
                      GH₵ {c.balance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-gray-600">
                      {c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono-num font-bold ${
                          isCleared
                            ? 'bg-emerald-100 text-[#005431]'
                            : isOverdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCleared && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const url = generateWhatsAppDebtReminderUrl(c, business);
                                window.open(url, '_blank');
                              }}
                              className="px-2 py-1 rounded-md bg-[#f0f3ff] hover:bg-[#e7eeff] text-[#005431] font-bold flex items-center gap-1 transition-colors"
                              title="Send WhatsApp MoMo Reminder"
                            >
                              <span className="material-symbols-outlined text-[15px]">chat</span>
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(c)}
                              className="px-2 py-1 rounded-md bg-[#005431] hover:bg-[#0d6e43] text-white font-bold transition-colors"
                            >
                              Record Payment
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Debt Payment */}
      {selectedCreditForPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Record Debt Payment</h3>
                <p className="text-gray-500">Debtor: {selectedCreditForPayment.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCreditForPayment(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-[#f0f3ff] p-3 rounded-xl flex justify-between items-center font-mono-num">
                <span className="text-gray-600">Total Outstanding Balance:</span>
                <span className="text-base font-bold text-[#835500]">
                  GH₵ {selectedCreditForPayment.balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Amount Received (GH₵)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-base font-mono-num font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'momo_mtn', label: 'MTN MoMo' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'momo_telecel', label: 'Telecel Cash' },
                    { id: 'momo_at', label: 'AT Money' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 px-3 rounded-lg font-bold transition-all text-left ${
                        paymentMethod === m.id
                          ? 'bg-[#005431] text-white shadow-xs'
                          : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Transaction / MoMo Reference
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. MM9824"
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-xs font-mono-num text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCreditForPayment(null)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 rounded-lg bg-[#005431] text-white font-bold hover:bg-[#0d6e43]"
                >
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Customer Debt */}
      {showNewCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Record New Debt in Credit Book</h3>
              <button
                type="button"
                onClick={() => setShowNewCreditModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCredit} className="py-4 space-y-4">
              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Customer / Debtor
                </label>
                <select
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] font-semibold text-gray-900 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Debt Amount (GH₵)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newCreditAmount}
                  onChange={(e) => setNewCreditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-sm font-mono-num font-bold text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Items Taken / Description
                </label>
                <input
                  type="text"
                  required
                  value={newCreditDesc}
                  onChange={(e) => setNewCreditDesc(e.target.value)}
                  placeholder="e.g. 2x Cartons Ideal Milk, 1x Box Lipton"
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-xs text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Due In (Days)
                </label>
                <select
                  value={newCreditDueDays}
                  onChange={(e) => setNewCreditDueDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] font-semibold text-gray-900 focus:outline-none"
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="14">14 Days (2 Weeks)</option>
                  <option value="30">30 Days (End of Month)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewCreditModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#005431] text-white font-bold hover:bg-[#0d6e43]"
                >
                  Save to Credit Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
