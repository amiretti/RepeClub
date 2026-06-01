/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, MapPin, Settings2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile } from '../../types';

interface ProfilePanelProps {
  open: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  currentUser: UserProfile;
  onClose: () => void;
  onOpenSettings: () => void;
  onSignOut: () => Promise<void>;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  open,
  panelRef,
  currentUser,
  onClose,
  onOpenSettings,
  onSignOut
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="profile_panel"
          role="dialog"
          aria-modal="false"
          aria-label="Panel de perfil"
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
          className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-sky-100 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser.nickname || currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1">
              <MapPin className="w-3 h-3 text-sky-600 flex-shrink-0" />
              <span className="truncate">Zona: <strong>{currentUser.location || 'Sin cargar'}</strong></span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1">
              <Settings2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Radio: <strong>{currentUser.searchRadiusKm || 5} km</strong></span>
            </div>
          </div>

          <div className="p-3 bg-slate-105 flex gap-2">
            <button
              onClick={onOpenSettings}
              aria-label="Abrir configuración"
              className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configuración
            </button>
            <button
              onClick={onSignOut}
              aria-label="Cerrar sesión"
              className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
