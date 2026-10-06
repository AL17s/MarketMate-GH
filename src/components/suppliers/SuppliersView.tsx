import React, { useState } from 'react';
import { Supplier, Business } from '../../types/models';

interface SuppliersViewProps {
  suppliers: Supplier[];
  business: Business;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<Supplier>;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  business,
  onAddSupplier,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('024');
  const [whatsapp, setWhatsapp] = useState('23324');
  const [location, setLocation] = useState('Makola Wholesale Block');
  const [categories, setCategories] = useState('Provisions & Beverages');
  const [leadTime, setLeadTime] = useState('1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddSupplier({
      businessId: business.id,
      name,
      contactPerson,
      phone,
      whatsappNumber: whatsapp,
      marketLocation: location,
      categoriesSupplied: categories,
      leadTimeDays: parseInt(leadTime, 10) || 1,
    });
    setShowAddModal(false);
    setName('');
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[#835500] mb-1">
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            <span className="text-[11px] font-mono-num uppercase tracking-wider font-bold">
              Vendor Directory
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Suppliers &amp; Wholesalers
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Official distributors in Makola, Kaneshie, and Tema for fast stock ordering.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#005431] text-white text-xs font-bold hover:bg-[#0d6e43] shadow-xs active:scale-95 transition-all self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          <span>+ Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-[#f0f3ff] text-gray-600 text-[10px] font-mono-num font-bold">
                  {sup.leadTimeDays} Day Lead Time
                </span>
                <span className="material-symbols-outlined text-gray-400">verified</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mt-2">{sup.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{sup.categoriesSupplied}</p>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 font-mono-num bg-[#f0f3ff] p-3 rounded-xl border border-blue-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-gray-400">person</span>
                <span>{sup.contactPerson || 'Sales Desk'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-gray-400">phone</span>
                <span>{sup.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                <span className="truncate">{sup.marketLocation}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`tel:${sup.phone}`}
                className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/${sup.whatsappNumber}?text=${encodeURIComponent(
                  `Hello ${sup.name}, placing restock inquiry from ${business.name} (${business.branch}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-3 rounded-lg bg-[#005431] hover:bg-[#0d6e43] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Add New Wholesaler</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="py-4 space-y-3">
              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Company / Depot Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Market Location / Lane</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Supplied Categories</label>
                <input
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-[#005431] text-white font-bold">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
