import React from 'react';
import { Notification } from '../../types/models';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onNavigate: (path: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#005431] text-[22px]">notifications_active</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Alerts & Notifications</h3>
              <p className="text-xs text-gray-500">Firebase Cloud Messaging (FCM) live feed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">notifications_off</span>
              <p className="text-sm font-semibold">No active notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  n.read
                    ? 'bg-gray-50 border-gray-100 opacity-80'
                    : 'bg-white border-emerald-100 shadow-sm ring-1 ring-emerald-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.body}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono-num text-gray-400">
                  <span>{new Date(n.createdAt).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-2">
                    {n.type === 'low_stock' && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkAsRead(n.id);
                          onClose();
                          onNavigate('inventory');
                        }}
                        className="text-[#005431] font-bold hover:underline"
                      >
                        View Stock →
                      </button>
                    )}
                    {n.type === 'debt_due' && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkAsRead(n.id);
                          onClose();
                          onNavigate('debtors-credit-book');
                        }}
                        className="text-[#835500] font-bold hover:underline"
                      >
                        Open Debtors →
                      </button>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(n.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            FCM Background Daemon Active
          </span>
          <button
            type="button"
            onClick={() => {
              notifications.forEach((n) => onMarkAsRead(n.id));
            }}
            className="text-[#005431] font-bold hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
};
