import React, { useState } from 'react';
import { Product, Customer, CartItem, PaymentMethod, Business, Sale } from '../../types/models';
import { generateWhatsAppReceiptUrl } from '../../services/whatsappService';
import { exportReceiptAsPdf, ReceiptItemDetails } from '../../services/pdfService';

interface PosTerminalViewProps {
  products: Product[];
  customers: Customer[];
  business: Business;
  dailySalesTotal: number;
  onCompleteSale: (
    saleData: {
      customerId?: string;
      customerName: string;
      totalAmount: number;
      costAmount: number;
      grossProfit: number;
      paymentMethod: PaymentMethod;
      momoNumber?: string;
      momoReference?: string;
      itemsSummary: string;
      itemCount: number;
      cashReceived?: number;
      changeGiven?: number;
    },
    items: {
      productId: string;
      productName: string;
      unitCost: number;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      profit: number;
    }[]
  ) => Promise<Sale>;
  onAddNewDebtor: (name: string, phone: string) => void;
}

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  products,
  customers,
  business,
  dailySalesTotal,
  onCompleteSale,
  onAddNewDebtor,
}) => {
  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([
    { product: products[0] || ({} as Product), quantity: 2 },
    { product: products[2] || ({} as Product), quantity: 2 },
    { product: products[1] || ({} as Product), quantity: 2 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walkin');
  const [selectedTender, setSelectedTender] = useState<PaymentMethod>('cash');
  const [momoNumber, setMomoNumber] = useState('024 123 4567');
  const [momoReference, setMomoReference] = useState(`MM${Math.floor(1000 + Math.random() * 9000)}`);
  const [cashReceived, setCashReceived] = useState<number>(150);

  // Modals & Feedback
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('10.00');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Order code
  const [orderNumber] = useState(`MM-2024-${Math.floor(100 + Math.random() * 900)}`);

  // Cart calculations
  const rawSubtotal = cart.reduce(
    (acc, item) => acc + (item.customPrice || item.product.sellingPrice || 0) * item.quantity,
    0
  );
  const totalCost = cart.reduce(
    (acc, item) => acc + (item.product.costPrice || 0) * item.quantity,
    0
  );
  const totalUnits = cart.reduce((acc, item) => acc + item.quantity, 0);

  // GRA Tax check (Flat Rate 3% if enabled in settings, else Exempt)
  const taxAmount = business.graVatFlatRateEnabled
    ? (rawSubtotal * (business.vatRatePercent || 3)) / 100
    : 0;
  const totalPayable = rawSubtotal + taxAmount;
  const changeAmount = Math.max(0, cashReceived - totalPayable);

  // Filter products
  const categories = [
    'ALL',
    'Provisions',
    'Beverages',
    'Canned Goods',
    'Toiletries',
    'Spices',
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: Product, quantity = 1, customPrice?: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { product, quantity, customPrice }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  const handleQuickAddCustom = () => {
    const price = parseFloat(customItemPrice) || 5;
    const qty = parseInt(customItemQty, 10) || 1;
    const virtualProduct: Product = {
      id: `custom_${Date.now()}`,
      businessId: business.id,
      name: customItemName.trim() || 'Custom Market Item',
      sku: 'CUST-SKU',
      category: 'Provisions',
      costPrice: price * 0.75,
      sellingPrice: price,
      stockQuantity: 999,
      lowStockThreshold: 0,
      unit: 'item',
      lastRestockDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addToCart(virtualProduct, qty, price);
    setShowCustomModal(false);
    setCustomItemName('');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('The cart is empty. Please select products first.');
      return;
    }

    const assignedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const customerName =
      selectedCustomerId === 'walkin'
        ? 'Walk-in Customer'
        : assignedCustomer?.name || 'Customer';

    const itemsSummary = cart
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(', ');

    const lineItems = cart.map((i) => {
      const price = i.customPrice || i.product.sellingPrice;
      const sub = price * i.quantity;
      const cost = i.product.costPrice * i.quantity;
      return {
        productId: i.product.id,
        productName: i.product.name,
        unitCost: i.product.costPrice,
        unitPrice: price,
        quantity: i.quantity,
        subtotal: sub,
        profit: sub - cost,
      };
    });

    const newSale = await onCompleteSale(
      {
        customerId: selectedCustomerId !== 'walkin' ? selectedCustomerId : undefined,
        customerName,
        totalAmount: totalPayable,
        costAmount: totalCost,
        grossProfit: totalPayable - totalCost,
        paymentMethod: selectedTender,
        momoNumber: selectedTender.startsWith('momo') ? momoNumber : undefined,
        momoReference: selectedTender.startsWith('momo') ? momoReference : undefined,
        itemsSummary,
        itemCount: totalUnits,
        cashReceived: selectedTender === 'cash' ? cashReceived : undefined,
        changeGiven: selectedTender === 'cash' ? changeAmount : undefined,
      },
      lineItems
    );

    setLastSaleReceipt(newSale);
    setShowReceiptModal(true);
    setCart([]);
    showToast(`Sale GH₵ ${totalPayable.toFixed(2)} completed! Receipt #${newSale.receiptNumber}`);
  };

  const handlePromptNewDebtor = () => {
    const name = prompt('Enter customer full name or chop bar title:');
    if (!name) return;
    const phone = prompt('Enter customer phone number (for WhatsApp payment reminders):', '024') || '';
    onAddNewDebtor(name, phone);
  };

  const handleExportCartPdf = () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Add items before exporting receipt PDF.');
      return;
    }

    const itemDetails: ReceiptItemDetails[] = cart.map((i) => {
      const price = i.customPrice || i.product.sellingPrice;
      return {
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: price,
        subtotal: price * i.quantity,
      };
    });

    const assignedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const customerName =
      selectedCustomerId === 'walkin'
        ? 'Walk-in Customer'
        : assignedCustomer?.name || 'Valued Customer';

    exportReceiptAsPdf(
      {
        receiptNumber: orderNumber,
        timestamp: new Date().toISOString(),
        customerName,
        items: itemDetails,
        subtotal: rawSubtotal,
        taxAmount,
        totalAmount: totalPayable,
        paymentMethod: selectedTender,
        momoNumber: selectedTender.startsWith('momo') ? momoNumber : undefined,
        momoReference: selectedTender.startsWith('momo') ? momoReference : undefined,
        cashReceived: selectedTender === 'cash' ? cashReceived : undefined,
        changeGiven: selectedTender === 'cash' ? changeAmount : undefined,
        cashierName: 'Abena Mensah',
      },
      business
    );

    showToast(`Exported Formatted PDF Receipt #${orderNumber} with QR Code!`);
  };

  return (
    <div className="w-full px-4 md:px-8 py-4 max-w-[1440px] mx-auto space-y-4">
      {/* 1. Top Context & Live Counter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f0f3ff] p-3 rounded-2xl border border-blue-50/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#005431] text-white shrink-0">
            <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">Terminal 01</span>
              <span className="text-[11px] font-mono-num px-2 py-0.5 rounded-full bg-[#ffddb4] text-[#291800] font-bold tracking-wider uppercase">
                {business.branch} Retail Lane
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              Fast Checkout Mode • Tap items or barcode scan to append cart
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-xs border border-gray-100">
            <span className="material-symbols-outlined text-[#005431] text-[18px]">bolt</span>
            <span className="text-[11px] font-mono-num text-gray-600 font-semibold uppercase">Daily Sales:</span>
            <span className="text-sm font-mono-num text-[#005431] font-bold">
              GH₵ {dailySalesTotal.toFixed(2)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-xs border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-[#005431] animate-ping"></span>
            <span className="text-xs font-mono-num text-gray-600">
              Cash Drawer: <strong>GH₵ {business.cashDrawerFloatGHS.toFixed(2)} Float</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Products Catalog (Left) vs Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section: Product Catalog (Col 7 / 12) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 min-w-0">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-2.5 rounded-xl shadow-xs border border-gray-100">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[22px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item name, brand, or scan barcode..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#f0f3ff] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005431] transition-all"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    const randomProd = products[Math.floor(Math.random() * products.length)];
                    addToCart(randomProd);
                    showToast(`Scanned Barcode [${randomProd.barcode || randomProd.sku}]: Added ${randomProd.name}`);
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors text-xs font-semibold"
                title="Barcode Scanner"
              >
                <span className="material-symbols-outlined text-[18px] text-[#005431]">barcode_scanner</span>
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-100 text-emerald-950 hover:bg-emerald-200 transition-colors text-xs font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ Custom Item</span>
              </button>
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const count = cat === 'ALL' ? products.length : products.filter((p) => p.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all ${
                    isActive
                      ? 'bg-[#005431] text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {cat === 'ALL' ? `All Items (${count})` : `${cat} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Touch-Friendly Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const isLow = p.stockQuantity <= p.lowStockThreshold;
              const isOut = p.stockQuantity <= 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className="group relative flex flex-col text-left p-2.5 bg-white rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:border-emerald-200 active:scale-[0.97] transition-all overflow-hidden"
                >
                  {/* Image or Category placeholder */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#f0f3ff] mb-2 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-100/60 flex items-center justify-center text-[#005431]">
                        <span className="material-symbols-outlined text-3xl">inventory_2</span>
                      </div>
                    )}

                    {/* Stock badge */}
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono-num font-bold shadow-xs ${
                        isOut
                          ? 'bg-red-100 text-red-800'
                          : isLow
                          ? 'bg-red-100 text-red-800 flex items-center gap-1'
                          : 'bg-white/90 backdrop-blur-xs text-[#005431]'
                      }`}
                    >
                      {isOut ? (
                        'Out of Stock'
                      ) : isLow ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                          Stock: {p.stockQuantity} Low
                        </>
                      ) : (
                        `Stock: ${p.stockQuantity}`
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[10px] font-mono-num text-gray-400 uppercase tracking-wider">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-[#005431] transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-gray-500">{p.unit}</p>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between pt-1">
                      <span className="text-sm font-mono-num text-[#005431] font-bold">
                        GH₵ {p.sellingPrice.toFixed(2)}
                      </span>
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#005431] flex items-center justify-center group-hover:bg-[#005431] group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rapid Keypad Quick Shortcuts */}
          <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#835500] text-[22px]">offline_bolt</span>
              <div>
                <p className="text-xs font-bold text-gray-900">Speed Keypad Shortcuts</p>
                <p className="text-[11px] text-gray-400">Tap quick picks to rapidly add small change items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nido = products.find((p) => p.name.includes('Ideal') || p.name.includes('Milk')) || products[0];
                  addToCart(nido, 1, 3.5);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#f0f3ff] text-gray-800 hover:bg-[#e7eeff] text-xs font-mono-num font-semibold transition-colors"
              >
                + Nido Sachet (GH₵ 3.50)
              </button>
              <button
                type="button"
                onClick={() => {
                  const lipton = products.find((p) => p.name.includes('Lipton')) || products[0];
                  addToCart(lipton, 1, 15.0);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#f0f3ff] text-gray-800 hover:bg-[#e7eeff] text-xs font-mono-num font-semibold transition-colors"
              >
                + Lipton 25s (GH₵ 15)
              </button>
            </div>
          </div>
        </section>

        {/* Right Section: Active Cart & Tender (Col 5 / 12) */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex flex-col">
                <span className="text-[11px] font-mono-num text-[#835500] uppercase font-bold tracking-wider">
                  Active Transaction
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-gray-900">Order #{orderNumber}</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearCart}
                className="flex items-center gap-1 text-[#8b1f09] hover:bg-red-50 p-1.5 rounded-lg text-xs font-semibold transition-colors"
                title="Clear active items"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                <span>Clear</span>
              </button>
            </div>

            {/* Customer Assignment Switcher */}
            <div className="bg-[#f0f3ff] p-2.5 rounded-xl my-3 border border-blue-50/50">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-mono-num text-gray-400 font-bold uppercase">
                  Customer Assignment
                </span>
                <button
                  type="button"
                  onClick={handlePromptNewDebtor}
                  className="text-[11px] text-[#005431] font-bold hover:underline"
                >
                  + New Debtor
                </button>
              </div>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value !== 'walkin') {
                      setSelectedTender('credit');
                    }
                  }}
                  className="w-full pl-3 pr-8 py-2 rounded-lg bg-white text-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#005431] appearance-none cursor-pointer border border-gray-100"
                >
                  <option value="walkin">👤 Walk-in Customer (Instant Cash / MoMo)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      📖 {c.name} {c.outstandingCredit > 0 ? `(Owes GH₵ ${c.outstandingCredit.toFixed(2)})` : '(Clean Credit)'}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Scrollable Cart Line Items */}
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 my-1">
              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-center">
                  <span className="material-symbols-outlined text-[48px] mb-2 text-gray-300">
                    production_quantity_limits
                  </span>
                  <p className="text-sm font-bold text-gray-700">The cart is currently empty</p>
                  <p className="text-xs text-gray-500">Tap items from the catalog on the left to add</p>
                </div>
              ) : (
                cart.map((item) => {
                  const price = item.customPrice || item.product.sellingPrice;
                  const itemSubtotal = price * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2 bg-[#f0f3ff]/70 rounded-xl group transition-all"
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {item.product.name}
                        </span>
                        <span className="text-[11px] font-mono-num text-gray-500">
                          GH₵ {price.toFixed(2)} × {item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white rounded-lg p-0.5 shadow-xs border border-gray-100">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono-num text-xs font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-16 text-right">
                          <span className="font-mono-num text-xs text-[#005431] font-bold">
                            GH₵ {itemSubtotal.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="py-2.5 my-2 bg-[#f0f3ff]/60 rounded-xl p-3 space-y-1.5 border border-blue-50/50">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Items Subtotal ({totalUnits} units)</span>
                <span className="font-mono-num font-bold text-gray-900">
                  GH₵ {rawSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span>Tax &amp; Levies (GRA Flat Rate)</span>
                  <span
                    className="material-symbols-outlined text-[14px] text-gray-400"
                    title="Informal SME Provisions Exemption Applied"
                  >
                    info
                  </span>
                </span>
                <span className="font-mono-num text-gray-400">
                  {taxAmount > 0 ? `GH₵ ${taxAmount.toFixed(2)}` : 'GH₵ 0.00 (Exempt)'}
                </span>
              </div>
              <div className="pt-2 flex justify-between items-baseline border-t border-gray-200/50">
                <div>
                  <span className="text-[11px] font-mono-num text-[#835500] uppercase font-bold tracking-wider">
                    Total Payable
                  </span>
                  <p className="text-[11px] text-gray-500">Ghana Cedis</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold font-mono-num text-[#005431]">
                    GH₵ {totalPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Tender Selection */}
            <div className="space-y-1.5 my-2">
              <span className="text-[10px] font-mono-num text-gray-400 font-bold uppercase">
                Payment Tender
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTender('cash')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all ${
                    selectedTender === 'cash'
                      ? 'bg-[#005431] text-white shadow-sm'
                      : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>Cash 💵</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTender('momo_mtn')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all ${
                    selectedTender === 'momo_mtn'
                      ? 'bg-[#005431] text-white shadow-sm'
                      : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#835500]">phone_android</span>
                  <span>MTN MoMo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTender('momo_telecel')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all ${
                    selectedTender === 'momo_telecel'
                      ? 'bg-[#005431] text-white shadow-sm'
                      : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#8b1f09]">cell_tower</span>
                  <span>Telecel Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTender('momo_at')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all ${
                    selectedTender === 'momo_at'
                      ? 'bg-[#005431] text-white shadow-sm'
                      : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">contactless</span>
                  <span>AT Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTender('credit')}
                  className={`col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all ${
                    selectedTender === 'credit'
                      ? 'bg-[#005431] text-white shadow-sm'
                      : 'bg-[#f0f3ff] text-gray-700 hover:bg-[#e7eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#8b1f09]">menu_book</span>
                  <span>Debtor Credit (Owe Later)</span>
                </button>
              </div>
            </div>

            {/* MoMo Details Panel (If Mobile Money Tender Selected) */}
            {selectedTender.startsWith('momo') && (
              <div className="p-3 bg-[#e7eeff] rounded-xl space-y-2 my-2 border border-blue-200/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 font-mono-num uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Instant Prompt to Customer Phone
                  </span>
                  <span className="text-[#005431] font-bold font-mono-num text-[11px]">STK Push Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono-num text-gray-500 uppercase block mb-1">
                      Subscriber MoMo Number
                    </label>
                    <input
                      type="tel"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="024 123 4567"
                      className="w-full px-3 py-1.5 rounded-lg bg-white text-xs font-mono-num text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431] border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-num text-gray-500 uppercase block mb-1">
                      Approval Ref / ID
                    </label>
                    <input
                      type="text"
                      value={momoReference}
                      onChange={(e) => setMomoReference(e.target.value)}
                      placeholder="MM8937"
                      className="w-full px-3 py-1.5 rounded-lg bg-white text-xs font-mono-num text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431] border border-gray-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cash Tender Change Calculation Box (If Cash) */}
            {selectedTender === 'cash' && (
              <div className="p-3 bg-[#f0f3ff] rounded-xl space-y-2 my-2 border border-blue-50/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num text-gray-500 uppercase font-semibold">
                    Cash Received Quick Picks:
                  </span>
                  <span className="font-mono-num text-[#835500] font-bold">
                    Change: GH₵ {changeAmount.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono-num font-bold">
                  {[
                    Math.ceil(totalPayable / 10) * 10,
                    Math.ceil((totalPayable + 10) / 10) * 10,
                    Math.ceil((totalPayable + 50) / 50) * 50,
                  ].map((presetAmt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashReceived(presetAmt)}
                      className="py-1.5 rounded bg-white hover:bg-gray-100 text-gray-900 shadow-xs border border-gray-100"
                    >
                      GH₵ {presetAmt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived(totalPayable)}
                    className="py-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-[#005431]"
                  >
                    Exact
                  </button>
                </div>
              </div>
            )}

            {/* Primary Confirm & Print Action */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#005431] text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm hover:bg-[#0d6e43] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[22px]">verified</span>
                <span>Confirm &amp; Print (GH₵ {totalPayable.toFixed(2)})</span>
              </button>

              {/* Secondary Options: Export PDF, WhatsApp receipt & Bluetooth Paper */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={handleExportCartPdf}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-lg bg-[#005431] text-white hover:bg-[#0d6e43] text-xs font-bold transition-colors shadow-xs"
                  title="Download formatted receipt as PDF with QR Code"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>PDF Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length === 0 && !lastSaleReceipt) {
                      alert('Add items to cart or complete a sale to generate WhatsApp receipt.');
                      return;
                    }
                    if (lastSaleReceipt) {
                      const url = generateWhatsAppReceiptUrl(lastSaleReceipt, business);
                      window.open(url, '_blank');
                    } else {
                      const tempSale: Sale = {
                        id: 'temp',
                        receiptNumber: orderNumber,
                        businessId: business.id,
                        customerName: selectedCustomerId !== 'walkin' ? 'Valued Customer' : 'Walk-in Customer',
                        totalAmount: totalPayable,
                        costAmount: totalCost,
                        grossProfit: totalPayable - totalCost,
                        taxAmount,
                        paymentMethod: selectedTender,
                        status: 'completed',
                        itemsSummary: cart.map((i) => `${i.quantity}x ${i.product.name}`).join(', '),
                        itemCount: totalUnits,
                        cashierId: 'usr_abena_01',
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                      };
                      const url = generateWhatsAppReceiptUrl(tempSale, business);
                      window.open(url, '_blank');
                    }
                  }}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-lg bg-[#f0f3ff] text-gray-800 hover:bg-[#e7eeff] text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#005431]">chat</span>
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Sending thermal receipt to 58mm Bluetooth Printer...');
                  }}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-lg bg-[#f0f3ff] text-gray-800 hover:bg-[#e7eeff] text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-gray-400">print</span>
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Offline Guarantee Footer */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-[10px] font-mono-num">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Recorded in local device vault • Instant sync back-office</span>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: Custom Unlisted Item */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#ffddb4] text-[#835500] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </span>
                <h3 className="font-bold text-gray-900 text-base">Custom Unlisted Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                  Item Name / Description
                </label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. Sachet Water Bag (500ml × 30)"
                  className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">
                    Price (GH₵)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-[#835500] font-bold">
                      GH₵
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 rounded-lg bg-[#f0f3ff] font-mono-num font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono-num text-gray-400 uppercase font-bold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#f0f3ff] font-mono-num font-bold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005431]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddCustom}
                  className="px-4 py-2 rounded-lg bg-[#005431] text-white font-bold hover:bg-[#0d6e43]"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printed Digital Receipt Preview */}
      {showReceiptModal && lastSaleReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-xs">
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h3 className="font-bold text-gray-900 text-base">{business.name}</h3>
              <p className="text-gray-500">{business.location}</p>
              <p className="font-mono-num text-gray-400">Tel: {business.phone}</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-[#005431] font-mono-num font-bold">
                Receipt #{lastSaleReceipt.receiptNumber}
              </div>
            </div>

            <div className="py-3 space-y-1.5 border-b border-dashed border-gray-300 font-mono-num text-gray-700">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(lastSaleReceipt.timestamp).toLocaleString('en-GH')}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{lastSaleReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-bold">{lastSaleReceipt.paymentMethod}</span>
              </div>
            </div>

            <div className="py-3 space-y-1 text-gray-800">
              <p className="font-bold text-gray-900 mb-1">Items Sold:</p>
              <p className="text-gray-600">{lastSaleReceipt.itemsSummary}</p>
              <div className="pt-2 flex justify-between font-mono-num font-bold text-sm text-[#005431]">
                <span>TOTAL:</span>
                <span>GH₵ {lastSaleReceipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* QR Code Placeholder for Future Payment Integration (GhQR & MoMo) */}
            <div className="py-3 px-3 my-2 rounded-xl bg-[#f0f3ff] border border-blue-100/60 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[10px] font-mono-num font-bold text-[#835500] uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#835500]"></span>
                GhQR / MoMo Payment QR Placeholder
              </div>

              {/* High-contrast QR Matrix Graphic */}
              <div className="w-24 h-24 bg-white p-2 rounded-lg shadow-xs border border-gray-200 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-2 border-[#005431] flex items-center justify-center p-0.5">
                    <div className="w-3 h-3 bg-[#005431]"></div>
                  </div>
                  <div className="w-6 h-6 border-2 border-[#005431] flex items-center justify-center p-0.5">
                    <div className="w-3 h-3 bg-[#005431]"></div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-0.5 my-1 px-1">
                  <div className="h-1 bg-[#005431]"></div>
                  <div className="h-1 bg-transparent"></div>
                  <div className="h-1 bg-[#005431]"></div>
                  <div className="h-1 bg-[#005431]"></div>
                  <div className="h-1 bg-transparent"></div>
                  <div className="h-1 bg-transparent"></div>
                  <div className="h-1 bg-[#005431]"></div>
                  <div className="h-1 bg-transparent"></div>
                  <div className="h-1 bg-[#005431]"></div>
                  <div className="h-1 bg-[#005431]"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-2 border-[#005431] flex items-center justify-center p-0.5">
                    <div className="w-3 h-3 bg-[#005431]"></div>
                  </div>
                  <div className="w-4 h-4 border border-[#005431] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#005431]"></div>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-gray-500 mt-2 font-mono-num">
                Scan with any Ghana Bank App or MoMo
              </span>
              <span className="text-[9px] text-gray-400 font-mono-num">
                GhIPSS Ref: #{lastSaleReceipt.receiptNumber}
              </span>
            </div>

            <div className="text-center py-2 text-gray-400 text-[11px] border-t border-dashed border-gray-300">
              Medaase pa ara! Thank you for shopping at Makola Market.
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const items: ReceiptItemDetails[] = [
                    {
                      name: lastSaleReceipt.itemsSummary || 'General Market Provisions',
                      quantity: lastSaleReceipt.itemCount || 1,
                      unitPrice: lastSaleReceipt.totalAmount / (lastSaleReceipt.itemCount || 1),
                      subtotal: lastSaleReceipt.totalAmount,
                    },
                  ];

                  exportReceiptAsPdf(
                    {
                      receiptNumber: lastSaleReceipt.receiptNumber,
                      timestamp: lastSaleReceipt.timestamp,
                      customerName: lastSaleReceipt.customerName,
                      items,
                      subtotal: lastSaleReceipt.totalAmount - (lastSaleReceipt.taxAmount || 0),
                      taxAmount: lastSaleReceipt.taxAmount || 0,
                      totalAmount: lastSaleReceipt.totalAmount,
                      paymentMethod: lastSaleReceipt.paymentMethod,
                      momoNumber: lastSaleReceipt.momoNumber,
                      momoReference: lastSaleReceipt.momoReference,
                      cashReceived: lastSaleReceipt.cashReceived,
                      changeGiven: lastSaleReceipt.changeGiven,
                      cashierName: 'Abena Mensah',
                    },
                    business
                  );
                  showToast(`Downloaded PDF Receipt #${lastSaleReceipt.receiptNumber}`);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#005431] text-white font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#0d6e43] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                <span>Download Formatted PDF Receipt</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = generateWhatsAppReceiptUrl(lastSaleReceipt, business);
                    window.open(url, '_blank');
                  }}
                  className="flex-1 py-2 rounded-lg bg-emerald-100 text-[#005431] font-bold flex items-center justify-center gap-1 text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111c2d] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]">done_all</span>
          </span>
          <div className="text-xs">
            <p className="font-bold">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
