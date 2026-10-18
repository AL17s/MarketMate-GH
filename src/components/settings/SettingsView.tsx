import React, { useState } from 'react';
import { Business } from '../../types/models';

interface SettingsViewProps {
  business: Business;
  onUpdateBusiness: (updates: Partial<Business>) => Promise<Business>;
  onResetStore?: () => void;
  onClearSampleData?: () => void;
  onReloadDemoData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  onUpdateBusiness,
  onResetStore,
  onClearSampleData,
  onReloadDemoData,
}) => {
  const [name, setName] = useState(business.name);
  const [branch, setBranch] = useState(business.branch);
  const [location, setLocation] = useState(business.location);
  const [phone, setPhone] = useState(business.phone);
  const [tinNumber, setTinNumber] = useState(business.tinNumber || 'C0028919283');
  const [monthlyExpenseCap, setMonthlyExpenseCap] = useState(business.monthlyExpenseCap.toString());
  const [cashDrawerFloat, setCashDrawerFloat] = useState(business.cashDrawerFloatGHS.toString());
  const [graFlatRate, setGraFlatRate] = useState(business.graVatFlatRateEnabled);

  // Mobile Money Settings
  const [mtnNumber, setMtnNumber] = useState(business.momoSettings.mtnNumber || '0244123890');
  const [mtnMerchantName, setMtnMerchantName] = useState(
    business.momoSettings.mtnMerchantName || 'Abena Provisions Ltd'
  );
  const [telecelNumber, setTelecelNumber] = useState(business.momoSettings.telecelNumber || '0205882190');
  const [atMoneyNumber, setAtMoneyNumber] = useState(business.momoSettings.atMoneyNumber || '0261993420');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation dialogs
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateBusiness({
      name,
      branch,
      location,
      phone,
      tinNumber,
      monthlyExpenseCap: parseFloat(monthlyExpenseCap) || 8500,
      cashDrawerFloatGHS: parseFloat(cashDrawerFloat) || 650,
      graVatFlatRateEnabled: graFlatRate,
      vatRatePercent: graFlatRate ? 3 : 0,
      momoSettings: {
        mtnNumber,
        mtnMerchantName,
        telecelNumber,
        atMoneyNumber,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    showToast('Store settings saved successfully!');
  };

  const handleConfirmResetStore = () => {
    setShowResetConfirm(false);
    if (onResetStore) {
      onResetStore();
      showToast('Store reset to clean state. Ready for new profile setup.');
    }
  };

  const handleConfirmClearData = () => {
    setShowClearConfirm(false);
    if (onClearSampleData) {
      onClearSampleData();
      showToast('Sample data cleared. Catalog is now empty.');
    }
  };

  const handleConfirmReloadDemo = () => {
    setShowReloadConfirm(false);
    if (onReloadDemoData) {
      onReloadDemoData();
      showToast('Sample Makola Market data restored!');
    }
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 text-[#835500] mb-1">
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span className="text-[11px] font-mono-num uppercase tracking-wider font-bold">
            System Configuration
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Store &amp; Payment Settings
        </h1>
        <p className="text-xs md:text-sm text-gray-500">
          Configure Ghanaian Mobile Money merchant details, GRA Flat Rate scheme, and register defaults.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stall & Profile Details */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#005431] text-[18px]">storefront</span>
            <span>Business Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Store Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Branch / Stall Number
              </label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Market Location / City
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Official Contact Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>
          </div>
        </div>

        {/* Ghana Mobile Money Integration Architecture */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
          <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#835500] text-[18px]">phone_android</span>
              <span>Mobile Money (MoMo) Merchant Configuration</span>
            </h2>
            <span className="text-[10px] font-mono-num font-bold text-[#005431] bg-emerald-50 px-2 py-0.5 rounded">
              STK PUSH READY
            </span>
          </div>

          <p className="text-gray-500">
            These numbers receive customer instant deposits and appear automatically on digital WhatsApp receipts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                MTN MoMo Merchant / SIM Number
              </label>
              <input
                type="text"
                value={mtnNumber}
                onChange={(e) => setMtnNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                MTN Registered Merchant Name
              </label>
              <input
                type="text"
                value={mtnMerchantName}
                onChange={(e) => setMtnMerchantName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Telecel Cash Number
              </label>
              <input
                type="text"
                value={telecelNumber}
                onChange={(e) => setTelecelNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                AT Money (AirtelTigo) Number
              </label>
              <input
                type="text"
                value={atMoneyNumber}
                onChange={(e) => setAtMoneyNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* GRA Tax & Expense Caps */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8b1f09] text-[18px]">account_balance</span>
            <span>Ghana Revenue Authority (GRA) &amp; Register Float</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                TIN Number
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Morning Cash Drawer Float (GH₵)
              </label>
              <input
                type="number"
                value={cashDrawerFloat}
                onChange={(e) => setCashDrawerFloat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Monthly Outflow Cap (GH₵)
              </label>
              <input
                type="number"
                value={monthlyExpenseCap}
                onChange={(e) => setMonthlyExpenseCap(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-[#f0f3ff] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 block">GRA 3% VAT Flat Rate Scheme (VFRS)</span>
              <span className="text-gray-500 text-[11px]">
                Toggle on to automatically compute 3% flat rate VAT on checkout receipts.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGraFlatRate(!graFlatRate)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                graFlatRate ? 'bg-[#005431]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  graFlatRate ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-1">
          {savedSuccess && (
            <span className="text-xs font-mono-num text-[#005431] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Settings Updated Successfully!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#005431] text-white font-bold text-xs hover:bg-[#0d6e43] shadow-sm transition-all"
          >
            Save All Settings
          </button>
        </div>
      </form>

      {/* STORE DATA MANAGEMENT SECTION */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
        <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8b1f09] text-[20px]">database</span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Store Data Management</h2>
              <p className="text-gray-500 text-[11px]">
                Manage offline ledger data, clear sample demos, or reset store profile.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono-num font-bold text-[#8b1f09] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase">
            Admin Controls
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Reset Store / Start Clean */}
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-red-900 font-bold mb-1">
                <span className="material-symbols-outlined text-red-600 text-[18px]">restart_alt</span>
                <span>Reset Store / Start Clean</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Clears all sales, expenses, debts, and products, and launches the Setup Wizard so you can
                re-enter your shop profile and MoMo details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              <span>Reset Store / Start Clean</span>
            </button>
          </div>

          {/* Card 2: Clear Sample Data */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-amber-950 font-bold mb-1">
                <span className="material-symbols-outlined text-amber-700 text-[18px]">cleaning_services</span>
                <span>Clear Sample Data</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Wipes demo sales, demo expenses, and sample products, giving you a fresh, empty catalog while
                retaining your current shop name and settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">mop</span>
              <span>Clear Sample Data</span>
            </button>
          </div>

          {/* Card 3: Reload Demo Data */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-950 font-bold mb-1">
                <span className="material-symbols-outlined text-[#005431] text-[18px]">auto_stories</span>
                <span>Reload Demo Data</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Restores sample Makola Market inventory (16 items), realistic POS sales history, and customer
                debt records for feature exploration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReloadConfirm(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#005431] hover:bg-[#0d6e43] text-white font-bold text-xs transition-colors shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Reload Demo Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: Reset Store */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">restart_alt</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Reset Store &amp; Start Clean?</h3>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              This will wipe all existing transactions, sales, expenses, and inventory items, clearing
              localStorage and launching the Setup Wizard so you can configure a brand new shop profile.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetStore}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm"
              >
                Yes, Reset &amp; Re-enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Clear Sample Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">cleaning_services</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Clear Sample Data?</h3>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              This will remove all demo sales, expenses, customer credit debts, and sample products, giving you
              a fresh empty catalog. Your store name and MoMo wallet settings will remain intact.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearData}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
              >
                Yes, Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Reload Demo Data */}
      {showReloadConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#005431] mx-auto flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">auto_stories</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Reload Makola Demo Store?</h3>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              This will populate your catalog with 16 Ghanaian provisions (Ideal Milk, Frytol, Gino, Peak),
              sample POS sales, debtor balances, and suppliers for test driving features.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowReloadConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReloadDemo}
                className="flex-1 py-2.5 rounded-xl bg-[#005431] hover:bg-[#0d6e43] text-white font-bold text-xs shadow-sm"
              >
                Yes, Reload Demo
              </button>
            </div>
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
