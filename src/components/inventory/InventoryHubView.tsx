import React, { useState } from 'react';
import { Product, Business, BusinessMetrics, Supplier } from '../../types/models';
import { formatGHS } from '../../services/calculations';
import { generateWhatsAppRestockOrderUrl } from '../../services/whatsappService';

interface InventoryHubViewProps {
  products: Product[];
  business: Business;
  metrics: BusinessMetrics;
  suppliers: Supplier[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  onAdjustStock: (productId: string, delta: number, reason: string) => Promise<Product | null>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<Product | null>;
}

export const InventoryHubView: React.FC<InventoryHubViewProps> = ({
  products,
  business,
  metrics,
  suppliers,
  onAddProduct,
  onAdjustStock,
  onUpdateProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'healthy' | 'low' | 'out'>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkCountModal, setShowBulkCountModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Product['category']>('Provisions');
  const [newSku, setNewSku] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('12.00');
  const [newSellingPrice, setNewSellingPrice] = useState('15.00');
  const [newStock, setNewStock] = useState('24');
  const [newThreshold, setNewThreshold] = useState('5');
  const [newUnit, setNewUnit] = useState('tin');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered rows
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'healthy') matchesStatus = p.stockQuantity > p.lowStockThreshold;
    if (statusFilter === 'low')
      matchesStatus = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
    if (statusFilter === 'out') matchesStatus = p.stockQuantity <= 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleInlineCountAdjust = async (productId: string, delta: number) => {
    await onAdjustStock(productId, delta, 'Inline counter adjustment');
    showToast(`Updated count (${delta > 0 ? '+' : ''}${delta})`);
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newCostPrice) || 0;
    const sell = parseFloat(newSellingPrice) || 0;
    const qty = parseInt(newStock, 10) || 0;
    const thresh = parseInt(newThreshold, 10) || 5;

    await onAddProduct({
      businessId: business.id,
      name: newTitle.trim(),
      category: newCategory,
      sku: newSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      costPrice: cost,
      sellingPrice: sell,
      stockQuantity: qty,
      lowStockThreshold: thresh,
      unit: newUnit,
      lastRestockDate: new Date().toISOString(),
    });

    showToast(`Product "${newTitle}" added to inventory!`);
    setShowAddModal(false);
    setNewTitle('');
    setNewSku('');
  };

  const handleSendShopBoyWhatsApp = () => {
    const lowCount = metrics.lowStockItemsCount;
    const text = encodeURIComponent(
      `MarketMate GH: Stock Restock Summary for ${business.name} (${business.branch}).\nCurrently, ${lowCount} items are below minimum shelf count and require urgent purchase.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleOrderSupplier = (product: Product) => {
    const supplier = suppliers.find((s) => s.id === product.supplierId) || suppliers[0];
    const orderQty = Math.max(12, product.lowStockThreshold * 2);
    const url = generateWhatsAppRestockOrderUrl(product, business, orderQty, supplier?.whatsappNumber);
    window.open(url, '_blank');
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 space-y-6 max-w-[1400px] mx-auto">
      {/* 1. Sub-Header Context & Quick Hub */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[#835500] mb-1">
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span className="text-[11px] font-mono-num uppercase tracking-wider font-bold">
              {business.branch} • Stock Master
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Stock &amp; Inventory Hub
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Real-time stock valuation, reorder thresholds, and fast batch counts.
          </p>
        </div>

        {/* Export & Actions Tray */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSendShopBoyWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f0f3ff] hover:bg-[#e7eeff] text-[#005431] text-xs font-semibold transition-all shadow-xs border border-blue-50/50"
          >
            <span className="material-symbols-outlined text-[18px] text-[#005431]">chat</span>
            <span>Send to Shop Boy (WhatsApp)</span>
          </button>

          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f0f3ff] hover:bg-[#e7eeff] text-gray-800 text-xs font-semibold shadow-xs border border-blue-50/50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Sheet</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-gray-100 z-30 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    showToast('Exported Stock Excel (.xlsx)');
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-xs"
                >
                  <span className="material-symbols-outlined text-[#005431] text-[18px]">table_chart</span>
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    showToast('Generated PDF Ledger Sheet');
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-xs"
                >
                  <span className="material-symbols-outlined text-[#8b1f09] text-[18px]">picture_as_pdf</span>
                  <span>PDF Ledger Sheet</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowBulkCountModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#feae2c] text-[#291800] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
            <span>Fast Bulk Count</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Stock Value */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl p-4 bg-[#005431] text-white shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[136px]">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#0d6e43] rounded-full opacity-40 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between z-10">
            <span className="text-[11px] font-mono-num uppercase tracking-wider text-emerald-200 font-bold">
              Total Stock Value
            </span>
            <span className="material-symbols-outlined text-[20px] text-emerald-200">
              account_balance_wallet
            </span>
          </div>
          <div className="z-10 mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-bold font-mono-num tracking-tight">
                {formatGHS(metrics.inventoryValueSelling, false)}
              </span>
            </div>
            <p className="text-[11px] font-mono-num text-emerald-200 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">trending_up</span> Cost Basis:{' '}
              {formatGHS(metrics.inventoryValueCost, false)}
            </p>
          </div>
        </div>

        {/* Total SKUs */}
        <div className="col-span-1 rounded-2xl p-4 bg-white text-gray-900 shadow-xs border border-gray-100 flex flex-col justify-between min-h-[136px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num uppercase tracking-wider text-gray-500 font-bold">
              Live Catalog
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#005431]">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl md:text-2xl font-bold font-mono-num">
              {metrics.totalCatalogCount} <span className="text-xs text-gray-500 font-normal">items</span>
            </div>
            <div className="flex items-center gap-1 text-[#005431] text-xs font-mono-num mt-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#005431]"></span> 4 Categories active
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="col-span-1 rounded-2xl p-4 bg-white text-gray-900 shadow-xs border border-gray-100 flex flex-col justify-between min-h-[136px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#835500] font-bold">
              Low Stock Warning
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffddb4]/60 flex items-center justify-center text-[#835500]">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-[#835500]">
              {metrics.lowStockItemsCount}{' '}
              <span className="text-xs text-gray-500 font-normal">need restock</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('low')}
              className="text-[11px] font-mono-num text-[#835500] hover:underline mt-1 block font-semibold"
            >
              Filter low items →
            </button>
          </div>
        </div>

        {/* Stock Out (Zero) */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl p-4 bg-white text-gray-900 shadow-xs border border-gray-100 flex flex-col justify-between min-h-[136px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#8b1f09] font-bold">
              Stock Out (Zero)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad3] flex items-center justify-center text-[#8b1f09]">
              <span className="material-symbols-outlined text-[20px]">production_quantity_limits</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl md:text-2xl font-bold font-mono-num text-[#8b1f09]">
              {metrics.outOfStockCount}{' '}
              <span className="text-xs text-gray-500 font-normal">shelves empty</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">Lipton Yellow Label, Milo 400g</p>
          </div>
        </div>
      </div>

      {/* 3. Fast Restock Queue (Priority) */}
      <div className="rounded-2xl bg-[#f0f3ff] p-5 shadow-xs border border-blue-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100/60">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#835500]"></span>
            </span>
            <h2 className="text-base font-bold text-gray-900">Fast Restock Queue</h2>
            <span className="px-2 py-0.5 rounded-full bg-[#ffddb4] text-[#291800] text-[10px] font-mono-num font-bold">
              Priority
            </span>
          </div>
          <span className="text-xs text-gray-500">Suppliers reachable via one-tap WhatsApp / Phone</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          {products
            .filter((p) => p.stockQuantity <= p.lowStockThreshold)
            .slice(0, 3)
            .map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#f0f3ff] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400">inventory_2</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-gray-900 truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-[#ffdad3] text-[#8b1f09] text-[10px] font-mono-num font-bold">
                        {item.stockQuantity} {item.unit}s left
                      </span>
                      <span className="text-[11px] text-gray-400">Target: {item.lowStockThreshold * 2}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-1">
                      Vendor: {item.supplierName || 'Makola Direct Wholesale'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOrderSupplier(item)}
                    className="flex-1 py-1.5 px-2 bg-[#005431] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>Order Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineCountAdjust(item.id, 12)}
                    className="px-2.5 py-1.5 bg-[#f0f3ff] hover:bg-[#e7eeff] rounded-lg text-[11px] font-mono-num font-bold text-gray-800"
                    title="Quick +12 intake"
                  >
                    +12 In
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 4. Action Bar & Filtering Tools */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, barcode SKU, or brand..."
              className="w-full pl-11 pr-4 py-2 bg-[#f0f3ff] rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005431]"
            />
          </div>

          {/* Filters & Add Product */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-[#f0f3ff] text-gray-800 text-xs font-semibold rounded-lg focus:outline-none cursor-pointer border border-blue-50/50"
            >
              <option value="ALL">All Categories</option>
              <option value="Provisions">Provisions &amp; Canned</option>
              <option value="Beverages">Beverages &amp; Dairy</option>
              <option value="Toiletries">Toiletries &amp; Care</option>
              <option value="Spices">Spices &amp; Seasonings</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#f0f3ff] text-gray-800 text-xs font-semibold rounded-lg focus:outline-none cursor-pointer border border-blue-50/50"
            >
              <option value="ALL">All Status</option>
              <option value="healthy">In Stock (Good)</option>
              <option value="low">Low Stock Only</option>
              <option value="out">Out of Stock</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#005431] text-white rounded-lg text-xs font-bold hover:bg-[#0d6e43] shadow-xs active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Inventory Table & Ledger */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 flex items-center justify-between bg-[#f0f3ff]/80 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">Catalog Items</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-gray-700 text-xs font-mono-num font-semibold shadow-xs">
              {filteredProducts.length} items shown
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono-num">
            <span className="hidden sm:inline">Inline count saves automatically</span>
            <span className="material-symbols-outlined text-[18px] text-[#005431]">offline_bolt</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-mono-num uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Product &amp; SKU</th>
                <th className="py-3 px-4 text-right">Cost (GH₵)</th>
                <th className="py-3 px-4 text-right">Selling (GH₵)</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Quantity (Units)</th>
                <th className="py-3 px-4">Last Restock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const margin =
                  p.sellingPrice > 0
                    ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1)
                    : '0';
                const isOut = p.stockQuantity <= 0;
                const isLow = p.stockQuantity <= p.lowStockThreshold && !isOut;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#005431] shrink-0">
                          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">{p.name}</div>
                          <div className="text-[11px] font-mono-num text-gray-400">
                            SKU: {p.sku} • {p.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num text-gray-500">
                      GH₵ {p.costPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-gray-900">
                      GH₵ {p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#005431] font-mono-num font-bold text-[11px]">
                        +{margin}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInlineCountAdjust(p.id, -1)}
                          className="w-7 h-7 rounded bg-[#f0f3ff] text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 active:scale-90"
                        >
                          -
                        </button>
                        <span
                          className={`font-mono-num font-bold w-10 text-center text-xs ${
                            isOut ? 'text-[#8b1f09]' : isLow ? 'text-[#835500]' : 'text-[#005431]'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInlineCountAdjust(p.id, 1)}
                          className="w-7 h-7 rounded bg-[#f0f3ff] text-gray-700 font-bold flex items-center justify-center hover:bg-gray-200 active:scale-90"
                        >
                          +
                        </button>

                        {isOut ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#ffdad3] text-[#8b1f09] text-[10px] font-mono-num font-bold ml-1">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#ffddb4] text-[#835500] text-[10px] font-mono-num font-bold ml-1">
                            Low (Min {p.lowStockThreshold})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#005431] text-[10px] font-mono-num font-bold ml-1">
                            Healthy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono-num">
                      {p.lastRestockDate ? new Date(p.lastRestockDate).toLocaleDateString('en-GB') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => showToast(`Sending barcode sticker [${p.sku}] to printer`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Print Barcode"
                        >
                          <span className="material-symbols-outlined text-[18px]">barcode</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newPrice = prompt(`Update selling price for ${p.name}:`, p.sellingPrice.toString());
                            if (newPrice && !isNaN(parseFloat(newPrice))) {
                              onUpdateProduct(p.id, { sellingPrice: parseFloat(newPrice) });
                              showToast(`Price updated to GH₵ ${parseFloat(newPrice).toFixed(2)}`);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Edit Price"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: + Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#f0f3ff] flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005431] text-[24px]">add_circle</span>
                <h3 className="font-bold text-gray-900 text-base">Add New Product</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono-num text-gray-500 uppercase font-bold">
                  Product Title &amp; Unit Size
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Geisha Mackerel 425g"
                  className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono-num text-gray-500 uppercase font-bold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs text-gray-900 focus:outline-none"
                  >
                    <option value="Provisions">Provisions</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Toiletries">Toiletries</option>
                    <option value="Spices">Spices</option>
                    <option value="Canned Goods">Canned Goods</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono-num text-gray-500 uppercase font-bold">SKU / Barcode</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="GSH-425"
                    className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs font-mono-num text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono-num text-gray-500 uppercase font-bold">Cost Price (GH₵)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs font-mono-num font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono-num text-gray-500 uppercase font-bold">Selling Price (GH₵)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs font-mono-num font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono-num text-gray-500 uppercase font-bold">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs font-mono-num font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono-num text-gray-500 uppercase font-bold">Low Threshold</label>
                  <input
                    type="number"
                    required
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f0f3ff] rounded-lg text-xs font-mono-num font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#005431] text-white font-bold hover:bg-[#0d6e43]"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Stock Counting Drawer */}
      {showBulkCountModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 bg-[#f0f3ff] flex items-center justify-between border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Quick Bulk Stock Count (End of Day)</h3>
                <p className="text-xs text-gray-500">Tap + or - directly as you count physical shelf boxes</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkCountModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-4 space-y-2 text-xs">
              {products.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-[#f0f3ff] rounded-xl border border-blue-50/50"
                >
                  <div>
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-[11px] font-mono-num text-gray-500">Current: {item.stockQuantity} {item.unit}s</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInlineCountAdjust(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 font-bold text-sm shadow-xs border border-gray-100 active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-mono-num font-bold text-base text-[#005431] w-8 text-center">
                      {item.stockQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInlineCountAdjust(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 font-bold text-sm shadow-xs border border-gray-100 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-mono-num text-[#005431] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                All counts cached locally
              </span>
              <button
                type="button"
                onClick={() => setShowBulkCountModal(false)}
                className="px-5 py-2 bg-[#005431] text-white font-bold rounded-lg hover:bg-[#0d6e43]"
              >
                Done Counting
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
