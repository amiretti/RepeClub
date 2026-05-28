/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, User } from 'lucide-react';
import { NotificationsPanel } from './header/NotificationsPanel';
import { ProfilePanel } from './header/ProfilePanel';

const LOCALITY_OPTIONS = [
  'San Vicente',
  'Los Sembrados',
  'Colonia Margarita',
  'María Juana',
  'San Martín',
  'Angélica'
];

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
    setLocInput(currentUser?.location || '');
  }, [currentUser?.location]);

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

            <NotificationsPanel
              open={notifOpen}
              panelRef={notifPanelRef}
              notifications={notifications}
              onClose={() => setNotifOpen(false)}
              onClearNotification={clearNotification}
            />
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
                    className="w-8 h-8 rounded-full object-cover border border-sky-100 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 bg-amber-450 text-white bg-amber-400 font-extrabold rounded-full flex items-center justify-center text-xs shadow-xs border border-amber-305">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              <ProfilePanel
                open={profileOpen}
                panelRef={profilePanelRef}
                currentUser={currentUser}
                locInput={locInput}
                localityOptions={LOCALITY_OPTIONS}
                isUpdatingLoc={isUpdatingLoc}
                isDemoMode={isDemoMode}
                onClose={() => setProfileOpen(false)}
                onLocInputChange={setLocInput}
                onUpdateLocation={handleUpdateLoc}
                onSignOut={signOut}
              />
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
