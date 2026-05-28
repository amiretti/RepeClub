/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, User, LogOut, Loader2, Sparkles, Check, Trash2, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const Header: React.FC = () => {
  const {
    currentUser,
    notifications,
    signIn,
    signOut,
    isDemoMode,
    clearNotification,
    markAllNotificationsAsRead,
    updateUserLocation
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [locInput, setLocInput] = useState(currentUser?.location || '');
  const [isUpdatingLoc, setIsUpdatingLoc] = useState(false);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const profilePanelRef = useRef<HTMLDivElement>(null);
  const prevNotifOpen = useRef(false);
  const prevProfileOpen = useRef(false);

  const unreadNotifs = notifications.filter(n => !n.read);

  useEffect(() => {
    if (notifOpen && !prevNotifOpen.current) {
      notifPanelRef.current?.focus();
    }
    if (!notifOpen && prevNotifOpen.current) {
      notifButtonRef.current?.focus();
    }
    prevNotifOpen.current = notifOpen;
  }, [notifOpen]);

  useEffect(() => {
    if (profileOpen && !prevProfileOpen.current) {
      profilePanelRef.current?.focus();
    }
    if (!profileOpen && prevProfileOpen.current) {
      profileButtonRef.current?.focus();
    }
    prevProfileOpen.current = profileOpen;
  }, [profileOpen]);

  const handleUpdateLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingLoc(true);
    await updateUserLocation(locInput);
    setIsUpdatingLoc(false);
    setProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Title Brand */}
        <div className="flex items-center">
          <img
            src="/logo-repeclub.svg"
            alt="Logo de RepeClub"
            className="w-14 h-14 rounded-2xl shadow-lg shadow-slate-200"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <div className="relative">
            <button
              id="notif_bell_btn"
              ref={notifButtonRef}
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
                if (unreadNotifs.length > 0) {
                  markAllNotificationsAsRead();
                }
              }}
              aria-label="Abrir notificaciones"
              aria-expanded={notifOpen}
              aria-controls="notifications_panel"
              className="p-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-xl relative transition-colors focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notification Drawer Dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  id="notifications_panel"
                  role="dialog"
                  aria-modal="false"
                  aria-label="Panel de notificaciones"
                  ref={notifPanelRef}
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNotifOpen(false);
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
                            onClick={() => clearNotification(notif.id)}
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
          </div>

          {/* User Profile Avatar Card */}
          {currentUser ? (
            <div className="relative">
              <button
                id="profile_dropdown_btn"
                ref={profileButtonRef}
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                aria-label="Abrir perfil"
                aria-expanded={profileOpen}
                aria-controls="profile_panel"
                className="flex items-center gap-1.5 focus:outline-none"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-xl object-cover border border-sky-100 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 bg-amber-450 text-white bg-amber-400 font-extrabold rounded-xl flex items-center justify-center text-xs shadow-xs border border-amber-305">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    id="profile_panel"
                    role="dialog"
                    aria-modal="false"
                    aria-label="Panel de perfil"
                    ref={profilePanelRef}
                    tabIndex={-1}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setProfileOpen(false);
                      }
                    }}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-400 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
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

                    {/* Edit Location Form */}
                    <form onSubmit={handleUpdateLoc} className="p-4 border-b border-slate-100">
                      <label htmlFor="locality_input" className="text-[10px] font-bold text-slate-500 block mb-1">Poné o cambiá tu localidad</label>
                      <div className="flex gap-1">
                        <input
                          id="locality_input"
                          type="text"
                          value={locInput}
                          onChange={(e) => setLocInput(e.target.value)}
                          placeholder="Ej: Palermo, CABA"
                          required
                          className="flex-1 text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-350 bg-slate-50/50"
                        />
                        <button
                          type="submit"
                          disabled={isUpdatingLoc}
                          aria-label="Guardar zona"
                          className="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white p-2 rounded-xl transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Esto ayuda a que te encuentren más fácil para canjear.</p>
                    </form>

                    {/* App Sync Banner */}
                    {isDemoMode && (
                      <div className="p-3 bg-blue-50/50 mx-3 mt-3 rounded-xl border border-blue-100/50 text-center">
                        <p className="text-[9px] font-semibold text-blue-950 leading-tight">
                          ⭐️ Estás en modo local. Conectate con Firebase para sincronizar todo y canjear con gente cerca.
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-slate-105 flex gap-2">
                      <button
                        onClick={signOut}
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
            </div>
          ) : (
            <button
              onClick={signIn}
              aria-label="Entrar con Google"
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-200 transition-all hover:brightness-105 active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              Entrar
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
