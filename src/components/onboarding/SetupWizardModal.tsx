import React, { useState } from 'react';
import { Business } from '../../types/models';

interface SetupWizardModalProps {
  isOpen: boolean;
  initialBusiness: Business;
  onComplete: (updated: Partial<Business>) => void;
  onSkipWithDemo: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  initialBusiness,
  onComplete,
  onSkipWithDemo,
}) => {
  const [shopName, setShopName] = useState(initialBusiness.name || '');
  const [branch, setBranch] = useState(initialBusiness.branch || '');
  const [location, setLocation] = useState(initialBusiness.location || '');
  const [phone, setPhone] = useState(initialBusiness.phone || '024');
  const [primaryMomoProvider, setPrimaryMomoProvider] = useState<'mtn' | 'telecel' | 'at'>('mtn');
  const [momoNumber, setMomoNumber] = useState(initialBusiness.momoSettings.mtnNumber || '024');
  const [momoMerchantName, setMomoMerchantName] = useState(initialBusiness.momoSettings.mtnMerchantName || '');
  const [cashDrawerFloat, setCashDrawerFloat] = useState(initialBusiness.cashDrawerFloatGHS?.toString() || '500');
  const [graFlatRate, setGraFlatRate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const momoSettings = { ...initialBusiness.momoSettings };
    if (primaryMomoProvider === 'mtn') {
      momoSettings.mtnNumber = momoNumber;
      momoSettings.mtnMerchantName = momoMerchantName || shopName;
    } else if (primaryMomoProvider === 'telecel') {
      momoSettings.telecelNumber = momoNumber;
    } else {
      momoSettings.atMoneyNumber = momoNumber;
    }

    onComplete({
      name: shopName.trim() || 'My Ghana Shop',
      branch: branch.trim() || 'Main Stall',
      location: location.trim() || 'Makola Market, Accra',
      phone: phone.trim(),
      cashDrawerFloatGHS: parseFloat(cashDrawerFloat) || 500,
      graVatFlatRateEnabled: graFlatRate,
      vatRatePercent: graFlatRate ? 3 : 0,
      momoSettings,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-emerald-100 my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-[#005431] text-white mx-auto flex items-center justify-center shadow-md mb-3">
            <span className="material-symbols-outlined text-[32px]">storefront</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#005431] text-xs font-mono-num font-bold uppercase tracking-wider">
            First-Launch Setup Wizard
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
            Akwaaba! Welcome to MarketMate GH 🇬🇭
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto mt-1">
            Let's configure your shop details and Mobile Money payment numbers in 60 seconds.
          </p>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Shop Name & Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-num text-gray-500 uppercase font-bold mb-1">
                Shop / Enterprise Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Abena Provisions &amp; Wholesale"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f3ff] text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>

            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Branch / Stall ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Stall #4B, Retail Lane"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f3ff] text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>
          </div>

          {/* Location & Official Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Market Location / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Makola Market, Accra"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>

            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="024 412 3890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f3ff] text-gray-900 font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>
          </div>

          {/* Primary Mobile Money Setup */}
          <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-blue-100/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#835500] text-[18px]">phone_android</span>
                Primary Mobile Money (MoMo) Wallet
              </span>
              <span className="text-[10px] font-mono-num font-bold text-[#005431] bg-emerald-100 px-2 py-0.5 rounded">
                For Customer Deposits
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrimaryMomoProvider('mtn')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                  primaryMomoProvider === 'mtn'
                    ? 'bg-[#feae2c] text-[#291800] border-[#835500] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                MTN MoMo
              </button>
              <button
                type="button"
                onClick={() => setPrimaryMomoProvider('telecel')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                  primaryMomoProvider === 'telecel'
                    ? 'bg-[#8b1f09] text-white border-[#8b1f09] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                Telecel Cash
              </button>
              <button
                type="button"
                onClick={() => setPrimaryMomoProvider('at')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                  primaryMomoProvider === 'at'
                    ? 'bg-[#263143] text-white border-[#263143] shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                AT Money
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block font-mono-num text-gray-500 text-[10px] uppercase font-bold mb-1">
                  MoMo Number
                </label>
                <input
                  type="tel"
                  required
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  placeholder="024 123 4567"
                  className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 font-mono-num font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>
              <div>
                <label className="block font-mono-num text-gray-500 text-[10px] uppercase font-bold mb-1">
                  Registered Name
                </label>
                <input
                  type="text"
                  value={momoMerchantName}
                  onChange={(e) => setMomoMerchantName(e.target.value)}
                  placeholder="e.g. Abena Mensah"
                  className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>
            </div>
          </div>

          {/* Cash Drawer & GRA Scheme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Morning Cash Float (GH₵)
              </label>
              <input
                type="number"
                value={cashDrawerFloat}
                onChange={(e) => setCashDrawerFloat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-gray-900 font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f3ff]">
              <div>
                <span className="font-bold text-gray-900 block text-xs">GRA 3% Flat Rate VAT</span>
                <span className="text-[10px] text-gray-500">Retail provisions scheme</span>
              </div>
              <button
                type="button"
                onClick={() => setGraFlatRate(!graFlatRate)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
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

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSkipWithDemo}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 font-semibold transition-colors text-center"
            >
              Explore with Demo Makola Stall
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#005431] hover:bg-[#0d6e43] text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Save &amp; Launch My Register</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
