import React, { useState } from 'react';
import { Subscription, Business } from '../../types/models';

interface SubscriptionViewProps {
  subscription: Subscription;
  business: Business;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ subscription, business }) => {
  const [selectedPlan, setSelectedPlan] = useState<'free_starter' | 'pro_trader' | 'enterprise_wholesale'>(
    subscription.plan
  );
  const [showMoMoModal, setShowMoMoModal] = useState(false);
  const [payingPlanPrice, setPayingPlanPrice] = useState(120);
  const [payingPlanTitle, setPayingPlanTitle] = useState('Pro Trader');
  const [momoNumber, setMomoNumber] = useState('024 123 4567');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      id: 'free_starter',
      title: 'Free Starter',
      price: 'GH₵ 0',
      period: 'Forever free',
      desc: 'Ideal for single market table sellers starting their record-keeping.',
      features: [
        'Up to 30 sales / day',
        'Offline IndexedDB cache',
        'Basic credit book (5 debtors)',
        'Standard thermal receipts',
      ],
      current: subscription.plan === 'free_starter',
    },
    {
      id: 'pro_trader',
      title: 'Pro Trader',
      price: 'GH₵ 120',
      period: 'per month',
      desc: 'Most popular for busy Makola, Kejetia, and Kaneshie provisions shops.',
      popular: true,
      features: [
        'Unlimited sales & POS registers',
        'Full Credit Book & Debtors ledger',
        'Instant WhatsApp receipts & debt reminders',
        'Ask Mate AI Gemini Business Advisor (Unlimited)',
        'Firebase Real-time multi-device cloud sync',
        'GRA 3% Flat Rate VAT tax summaries',
      ],
      current: subscription.plan === 'pro_trader',
    },
    {
      id: 'enterprise_wholesale',
      title: 'Enterprise Wholesale',
      price: 'GH₵ 350',
      period: 'per month',
      desc: 'For multi-branch wholesale warehouses with shop boys and cashiers.',
      features: [
        'Everything in Pro Trader',
        'Multiple stalls / warehouse locations',
        'Role-Based Cashier permissions (Owner vs Cashier)',
        'Bulk Barcode Sticker printing',
        'Dedicated WhatsApp VIP onboarding',
      ],
      current: subscription.plan === 'enterprise_wholesale',
    },
  ];

  const handleOpenUpgrade = (title: string, price: number) => {
    setPayingPlanTitle(title);
    setPayingPlanPrice(price);
    setShowMoMoModal(true);
    setPaymentSuccess(false);
  };

  const handleSimulateMoMoPay = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setShowMoMoModal(false);
      setPaymentSuccess(false);
    }, 2500);
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-1.5 text-[#835500] mb-1">
          <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
          <span className="text-[11px] font-mono-num uppercase tracking-wider font-bold">
            Subscription &amp; Mobile Money Billing
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          MarketMate GH Plans
        </h1>
        <p className="text-xs md:text-sm text-gray-500">
          Transparent, pay-as-you-grow pricing for Ghanaian SMEs. Pay conveniently with MTN MoMo, Telecel Cash, or AT Money.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
              p.popular
                ? 'bg-white border-[#005431] ring-2 ring-[#005431]/20 shadow-md relative'
                : 'bg-white border-gray-100 shadow-xs'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#005431] text-white text-[10px] font-mono-num font-bold uppercase tracking-wider">
                Ghana Market Favorite
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                {p.current && (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#005431] text-[10px] font-mono-num font-bold">
                    Active Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">{p.desc}</p>

              <div className="mb-6">
                <span className="text-3xl font-extrabold font-mono-num text-gray-900">{p.price}</span>
                <span className="text-xs text-gray-500 font-mono-num ml-1">/ {p.period}</span>
              </div>

              <div className="space-y-2.5 text-xs text-gray-700 pb-6 border-t border-gray-100 pt-4">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">
                      check_circle
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={p.current}
              onClick={() => handleOpenUpgrade(p.title, p.id === 'pro_trader' ? 120 : 350)}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                p.current
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : p.popular
                  ? 'bg-[#005431] hover:bg-[#0d6e43] text-white shadow-xs'
                  : 'bg-gray-900 hover:bg-black text-white shadow-xs'
              }`}
            >
              {p.current ? 'Currently Subscribed' : `Pay via MoMo (${p.price})`}
            </button>
          </div>
        ))}
      </div>

      {/* MODAL: MoMo Prompt Simulation */}
      {showMoMoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Pay via Mobile Money</h3>
              <button
                type="button"
                onClick={() => setShowMoMoModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-[#f0f3ff] rounded-xl flex justify-between items-center font-mono-num">
                <span>Plan: {payingPlanTitle}</span>
                <span className="font-bold text-base text-[#005431]">GH₵ {payingPlanPrice}.00</span>
              </div>

              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Your MoMo Wallet Number
                </label>
                <input
                  type="tel"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-xs font-mono-num font-bold text-gray-900 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                An STK Push prompt will be sent to <strong>{momoNumber}</strong>. Enter your secret MoMo PIN to authorize payment.
              </div>

              {paymentSuccess ? (
                <div className="p-3 bg-emerald-50 rounded-xl text-center text-[#005431] font-bold">
                  ✓ Payment Approved! Upgraded to {payingPlanTitle}.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulateMoMoPay}
                  className="w-full py-3 bg-[#005431] text-white rounded-xl font-bold hover:bg-[#0d6e43] shadow-xs"
                >
                  Send STK Push Prompt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
