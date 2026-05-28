/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, LogOut, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile } from '../../types';

interface ProfilePanelProps {
  open: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  currentUser: UserProfile;
  locInput: string;
  localityOptions: string[];
  isUpdatingLoc: boolean;
  isDemoMode: boolean;
  onClose: () => void;
  onLocInputChange: (value: string) => void;
  onUpdateLocation: (e: React.FormEvent) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  open,
  panelRef,
  currentUser,
  locInput,
  localityOptions,
  isUpdatingLoc,
  isDemoMode,
  onClose,
  onLocInputChange,
  onUpdateLocation,
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
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1">
              <MapPin className="w-3 h-3 text-sky-600 flex-shrink-0" />
              <span className="truncate">Zona: <strong>{currentUser.location || 'Sin cargar'}</strong></span>
            </div>
          </div>

          <form onSubmit={onUpdateLocation} className="p-4 border-b border-slate-100">
            <label htmlFor="locality_input" className="text-[10px] font-bold text-slate-500 block mb-1">Poné o cambiá tu localidad</label>
            <div className="flex gap-1">
              <select
                id="locality_input"
                value={locInput}
                onChange={(e) => onLocInputChange(e.target.value)}
                required
                className="flex-1 text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
              >
                <option value="" disabled>Seleccioná tu localidad</option>
                {localityOptions.map((locality) => (
                  <option key={locality} value={locality}>
                    {locality}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isUpdatingLoc || !locInput}
                aria-label="Guardar zona"
                className="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white p-2 rounded-xl transition-all"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Esto ayuda a que te encuentren más fácil para canjear.</p>
          </form>

          {isDemoMode && (
            <div className="p-3 bg-blue-50/50 mx-3 mt-3 rounded-xl border border-blue-100/50 text-center">
              <p className="text-[9px] font-semibold text-blue-950 leading-tight">
                ⭐️ Estás en modo local. Conectate con Firebase para sincronizar todo y canjear con gente cerca.
              </p>
            </div>
          )}

          <div className="p-3 bg-slate-105 flex gap-2">
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
