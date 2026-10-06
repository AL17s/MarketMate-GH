import React, { useState } from 'react';
import { Business } from '../../types/models';

interface SettingsViewProps {
  business: Business;
  onUpdateBusiness: (updates: Partial<Business>) => Promise<Business>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ business, onUpdateBusiness }) => {
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
  const [mtnMerchantName, setMtnMerchantName] = useState(business.momoSettings.mtnMerchantName || 'Abena Provisions Ltd');
  const [telecelNumber, setTelecelNumber] = useState(business.momoSettings.telecelNumber || '0205882190');
  const [atMoneyNumber, setAtMoneyNumber] = useState(business.momoSettings.atMoneyNumber || '0261993420');

  const [savedSuccess, setSavedSuccess] = useState(false);

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
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Store Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Branch / Stall Number</label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Market Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Official Contact Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 font-mono-num focus:outline-none"
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

        <div className="flex items-center justify-end gap-3 pt-2">
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
    </div>
  );
};
