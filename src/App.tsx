/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLoadingScreen } from './components/AppLoadingScreen';
import { LandingScreen } from './components/LandingScreen';
import { AppShell } from './components/AppShell';

function AppContent() {
  const { currentUser, signIn, loading, authInProgress } = useApp();
  const [activeTab, setActiveTab] = useState<'album' | 'canjes' | 'config'>('album');
  const [liveAnnouncement, setLiveAnnouncement] = useState('Estás en colección');
  const [appAlert, setAppAlert] = useState<string | null>(null);

  useEffect(() => {
    const onAppError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message || 'Uy, pasó algo inesperado.';
      setAppAlert(message);
    };

    window.addEventListener('app-error', onAppError as EventListener);
    return () => {
      window.removeEventListener('app-error', onAppError as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!appAlert) return;
    const timerId = window.setTimeout(() => setAppAlert(null), 6000);
    return () => window.clearTimeout(timerId);
  }, [appAlert]);

  useEffect(() => {
    setLiveAnnouncement(
      activeTab === 'album'
        ? 'Estás en colección'
        : activeTab === 'canjes'
          ? 'Estás en canjes'
          : 'Estás en configuración'
    );
  }, [activeTab]);

  if (loading) {
    return <AppLoadingScreen />;
  }

  // ONBOARDING / LANDING PAGE: If no user is authenticated
  if (!currentUser) {
    return <LandingScreen signIn={signIn} authInProgress={authInProgress} />;
  }

  // MAIN COLLECTION VIEW
  return <AppShell activeTab={activeTab} setActiveTab={setActiveTab} liveAnnouncement={liveAnnouncement} appAlert={appAlert} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
