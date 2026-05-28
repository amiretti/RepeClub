/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNotification } from '../../types';

interface NotificationsPanelProps {
  open: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  notifications: AppNotification[];
  onClose: () => void;
  onClearNotification: (id: string) => Promise<void>;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  open,
  panelRef,
  notifications,
  onClose,
  onClearNotification
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="notifications_panel"
          role="dialog"
          aria-modal="false"
          aria-label="Panel de notificaciones"
          ref={panelRef}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-2"
        >
          <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="text-xs font-bold text-gray-800">Notificaciones ⚡</span>
            {notifications.length > 0 && (
              <span className="text-[10px] text-gray-500 font-medium">
                {notifications.length} total
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No tenés alertas por ahora.
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b border-gray-50 justify-between flex items-start text-xs ${
                    notif.read ? 'bg-white' : 'bg-blue-50/30'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-gray-800 text-[11px]">{notif.title}</p>
                    <p className="text-gray-600 mt-0.5 leading-tight">{notif.body}</p>
                    <span className="text-[9px] text-gray-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => onClearNotification(notif.id)}
                    aria-label="Eliminar notificación"
                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
