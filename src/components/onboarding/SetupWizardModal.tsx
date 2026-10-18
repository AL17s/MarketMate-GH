import React, { useState } from 'react';
import { Business } from '../../types/models';

export interface CleanShopParams {
  ownerName: string;
  shopName: string;
  branch: string;
  location: string;
  phone: string;
  momoProvider: 'mtn' | 'telecel' | 'at';
  momoNumber: string;
  momoMerchantName: string;
  cashDrawerFloatGHS: number;
  graVatFlatRateEnabled: boolean;
}

interface SetupWizardModalProps {
  isOpen: boolean;
  initialBusiness: Business;
  onCompleteCleanShop: (params: CleanShopParams) => void;
  onExploreDemo: () => void;
  canDismiss?: boolean;
  onClose?: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  initialBusiness,
  onCompleteCleanShop,
  onExploreDemo,
  canDismiss = false,
  onClose,
}) => {
  // Wizard mode: 'create' (form) or 'choice'
  const [activeTab, setActiveTab] = useState<'create' | 'demo'>('create');

  // Form fields
  const [ownerName, setOwnerName] = useState('Abena Mensah');
  const [shopName, setShopName] = useState(initialBusiness.name || 'My Ghana Provisions');
  const [branch, setBranch] = useState(initialBusiness.branch || 'Stall #12, Market Lane');
  const [location, setLocation] = useState(initialBusiness.location || 'Makola Market, Accra');
  const [phone, setPhone] = useState(initialBusiness.phone || '0244123456');
  const [primaryMomoProvider, setPrimaryMomoProvider] = useState<'mtn' | 'telecel' | 'at'>('mtn');
  const [momoNumber, setMomoNumber] = useState(initialBusiness.momoSettings?.mtnNumber || '0244123456');
  const [momoMerchantName, setMomoMerchantName] = useState(
    initialBusiness.momoSettings?.mtnMerchantName || 'Abena Mensah'
  );
  const [cashDrawerFloat, setCashDrawerFloat] = useState(
    initialBusiness.cashDrawerFloatGHS?.toString() || '500'
  );
  const [graFlatRate, setGraFlatRate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    onCompleteCleanShop({
      ownerName: ownerName.trim() || 'Shop Owner',
      shopName: shopName.trim() || 'My Ghana Shop',
      branch: branch.trim() || 'Main Stall',
      location: location.trim() || 'Accra, Ghana',
      phone: phone.trim() || '0244123456',
      momoProvider: primaryMomoProvider,
      momoNumber: momoNumber.trim() || phone.trim(),
      momoMerchantName: momoMerchantName.trim() || ownerName.trim(),
      cashDrawerFloatGHS: parseFloat(cashDrawerFloat) || 500,
      graVatFlatRateEnabled: graFlatRate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-emerald-100 my-6 animate-in zoom-in-95 duration-200 relative">
        {/* Close button if dismissible */}
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="w-13 h-13 rounded-2xl bg-[#005431] text-white mx-auto flex items-center justify-center shadow-md mb-2.5">
            <span className="material-symbols-outlined text-[30px]">storefront</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#005431] text-[11px] font-mono-num font-bold uppercase tracking-wider">
            <span>🇬🇭</span>
            <span>MarketMate GH Welcome</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-2 tracking-tight">
            Akwaaba! Welcome to MarketMate GH
          </h2>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto mt-1">
            Choose how you would like to get started with your Ghanaian SME platform.
          </p>
        </div>

        {/* Two Clear Options Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f0f3ff] rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white text-[#005431] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            <span>Create My Shop (Clean)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'demo'
                ? 'bg-white text-[#835500] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_stories</span>
            <span>Explore Demo Store</span>
          </button>
        </div>

        {/* TAB 1: CREATE MY SHOP (Clean Start) */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-[11px] text-emerald-900">
              <span className="material-symbols-outlined text-[#005431] text-[18px] shrink-0 mt-0.5">
                verified
              </span>
              <div>
                <span className="font-bold">Fresh Register Guarantee:</span> This initializes your store
                with zero sales, zero expenses, and an empty product catalog ready for your real inventory.
              </div>
            </div>

            {/* Owner Name & Shop Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono-num text-gray-500 uppercase font-bold mb-1">
                  Owner Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Abena Mensah"
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>

              <div>
                <label className="block font-mono-num text-gray-500 uppercase font-bold mb-1">
                  Shop / Enterprise Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Abena Provisions & Wholesale"
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>
            </div>

            {/* Branch & Market Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Market / City Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Makola Market, Accra / Kumasi"
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Branch / Stall Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Stall #4B, Main Lane"
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                Store Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="024 412 3456"
                className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-gray-900 font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-[#005431]"
              />
            </div>

            {/* Primary Mobile Money Setup */}
            <div className="p-3.5 rounded-2xl bg-[#f0f3ff] border border-blue-100/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#835500] text-[18px]">
                    phone_android
                  </span>
                  Primary Mobile Money (MoMo) Wallet
                </span>
                <span className="text-[10px] font-mono-num font-bold text-[#005431] bg-emerald-100 px-2 py-0.5 rounded">
                  For WhatsApp Receipts
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPrimaryMomoProvider('mtn')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
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
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
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
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                    primaryMomoProvider === 'at'
                      ? 'bg-[#263143] text-white border-[#263143] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  AT Money
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-mono-num text-gray-500 text-[10px] uppercase font-bold mb-1">
                    MoMo Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    placeholder="024 412 3456"
                    className="w-full px-3 py-1.5 rounded-lg bg-white text-gray-900 font-mono-num font-bold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                  />
                </div>
                <div>
                  <label className="block font-mono-num text-gray-500 text-[10px] uppercase font-bold mb-1">
                    Registered Subscriber / Merchant Name
                  </label>
                  <input
                    type="text"
                    value={momoMerchantName}
                    onChange={(e) => setMomoMerchantName(e.target.value)}
                    placeholder="e.g. Abena Mensah"
                    className="w-full px-3 py-1.5 rounded-lg bg-white text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                  />
                </div>
              </div>
            </div>

            {/* Cash Drawer Float & GRA Vat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f0f3ff]">
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

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                className="w-full sm:w-auto text-gray-500 hover:text-gray-800 text-xs font-semibold"
              >
                Or explore with sample data instead →
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#005431] hover:bg-[#0d6e43] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>{isSubmitting ? 'Initializing Shop...' : 'Create Shop & Start Clean'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: EXPLORE DEMO STORE */}
        {activeTab === 'demo' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#835500] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">storefront</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    Abena Provisions &amp; Wholesale
                  </h4>
                  <p className="text-xs text-gray-500">Stall #4B, Makola Market, Accra</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Tour MarketMate GH with an active demo business. This loads 16 popular Ghanaian
                provisions (Ideal Milk, Frytol, Peak, Geisha, Gino), realistic POS daily sales, an
                active debtor credit book, and pre-computed gross profit analytics.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono-num text-[11px]">
                <div className="bg-white p-2 rounded-lg text-center border border-amber-100">
                  <span className="block font-bold text-[#005431]">16 SKUs</span>
                  <span className="text-gray-400 text-[10px]">Stock Catalog</span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-amber-100">
                  <span className="block font-bold text-[#835500]">GH₵ 19,450</span>
                  <span className="text-gray-400 text-[10px]">Sales Ledger</span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-amber-100">
                  <span className="block font-bold text-[#8b1f09]">GH₵ 1,280</span>
                  <span className="text-gray-400 text-[10px]">Debtors Book</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="w-full sm:w-auto text-gray-500 hover:text-gray-800 text-xs font-semibold"
              >
                ← Back to Create My Shop
              </button>

              <button
                type="button"
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#835500] hover:bg-[#6c4600] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                <span>Load Demo Makola Store 🚀</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
