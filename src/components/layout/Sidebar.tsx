import React from 'react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onQuickSale: () => void;
  onQuickExpense: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  onQuickSale,
  onQuickExpense,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard (Home)', icon: 'grid_view' },
    { id: 'point-of-sale', label: 'Sales & POS', icon: 'receipt_long' },
    { id: 'expenses', label: 'Expenses', icon: 'trending_down' },
    { id: 'inventory', label: 'Inventory & Stock', icon: 'inventory_2' },
    { id: 'debtors-credit-book', label: 'Credit Book (Debtors)', icon: 'menu_book' },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping' },
    { id: 'analytics', label: 'Reports & Analytics', icon: 'query_stats' },
    { id: 'mate-ai-advisor', label: 'Ask Mate AI', icon: 'smart_toy', isAi: true, badge: 'PRO' },
  ];

  const systemItems = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'subscription', label: 'Upgrade Plan', icon: 'workspace_premium' },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Top 2 Quick Action Buttons */}
      <div className="p-3.5">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onQuickSale();
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#005431] text-white rounded-lg text-xs font-bold hover:bg-[#0d6e43] active:scale-[0.98] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>+ Sale</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onQuickExpense();
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#ffdad3]/50 text-[#8b1f09] hover:bg-[#ffdad3] rounded-lg text-xs font-bold active:scale-[0.98] transition-all border border-[#8b1f09]/10"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>- Expense</span>
          </button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                isActive
                  ? 'bg-[#005431] text-white shadow-sm font-bold'
                  : 'text-gray-600 hover:bg-[#f0f3ff] hover:text-gray-900'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isActive ? 'text-white' : item.isAi ? 'text-[#835500]' : 'text-gray-500'
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-auto text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#ffddb4] text-[#291800]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 pb-1">
          <span className="px-3 text-[11px] font-mono-num uppercase tracking-wider text-gray-400 font-bold">
            System
          </span>
        </div>

        {systemItems.map((item) => {
          const isActive = currentPath === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                isActive
                  ? 'bg-[#005431] text-white shadow-sm font-bold'
                  : 'text-gray-600 hover:bg-[#f0f3ff] hover:text-gray-900'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Offline Mode Active Card */}
      <div className="p-3 bg-[#f0f3ff] m-3 rounded-xl border border-blue-100/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono-num text-gray-500 uppercase font-bold tracking-wider">
            Offline Mode Active
          </span>
          <span className="w-2 h-2 rounded-full bg-[#feae2c] animate-pulse"></span>
        </div>
        <p className="text-xs text-gray-600 leading-snug">
          Transactions safe in local cache. Syncs when network returns.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-72 z-30 hidden lg:flex flex-col">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
