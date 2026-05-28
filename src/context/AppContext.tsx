/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserStickerInventory, TradeOffer, AppNotification } from '../types';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
  Timestamp,
  updateDoc,
  where,
  deleteDoc
} from 'firebase/firestore';

interface AppContextType {
  currentUser: UserProfile | null;
  inventory: { [code: string]: number };
  allUsers: { profile: UserProfile; stickers: { [code: string]: number } }[];
  trades: TradeOffer[];
  notifications: AppNotification[];
  isDemoMode: boolean;
  loading: boolean;
  authInProgress: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateStickerCount: (code: string, count: number) => Promise<void>;
  updateUserLocation: (location: string) => Promise<void>;
  createTradeOffer: (receiverId: string, offered: string[], requested: string[]) => Promise<void>;
  updateTradeStatus: (tradeId: string, status: 'accepted' | 'declined' | 'cancelled') => Promise<void>;
  clearNotification: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Local Storage Key Consts
const LS_CURRENT_USER = 'panini2026_user';
const LS_INVENTORY = 'panini2026_inventory';
const LS_TRADES = 'panini2026_trades';
const LS_NOTIFICATIONS = 'panini2026_notifications';
const LS_MOCK_USERS = 'panini2026_mock_users';
const REDIRECT_FLOW_KEY = 'repeclub_google_redirect_pending';

// Real mock data representing local collectors for rich demonstration
const INITIAL_MOCK_USERS = [
  {
    profile: {
      uid: 'mock_mateo',
      name: 'Mateo (Belgrano)',
      email: 'mateo@album2026.com',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      location: 'Belgrano, CABA',
      updatedAt: new Date().toISOString()
    },
    stickers: {
      'MEX1': 1, 'RSA10': 2, 'KOR5': 1, 'BRA10': 3, 'ARG10': 0, 'FWC1': 2, 'CC3': 2, 'USA9': 2, 'GER10': 1, 'ESP5': 0
    }
  },
  {
    profile: {
      uid: 'mock_clara',
      name: 'Clara (Palermo)',
      email: 'clara@album2026.com',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
      location: 'Palermo, CABA',
      updatedAt: new Date().toISOString()
    },
    stickers: {
      'ARG10': 3, 'BRA10': 0, 'MEX1': 0, 'FRA10': 2, 'FWC9': 2, 'CC1': 1, 'URU7': 2, 'CAN5': 1, 'SUI3': 1, 'USA9': 0
    }
  },
  {
    profile: {
      uid: 'mock_benjamin',
      name: 'Benja (Caballito)',
      email: 'benji@album2026.com',
      photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
      location: 'Caballito, CABA',
      updatedAt: new Date().toISOString()
    },
    stickers: {
      'ESP5': 2, 'ARG10': 1, 'BRA10': 1, 'MEX1': 2, 'GER10': 3, 'FWC1': 0, 'CC3': 0, 'USA9': 1, 'CAN5': 2, 'RSA10': 0
    }
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [inventory, setInventory] = useState<{ [code: string]: number }>({});
  const [allUsers, setAllUsers] = useState<{ profile: UserProfile; stickers: { [code: string]: number } }[]>([]);
  const [trades, setTrades] = useState<TradeOffer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [authInProgress, setAuthInProgress] = useState(false);

  const isDemoMode = !isFirebaseConfigured;

  // INITIALIZE LOCAL STORAGE OR SYNC DIRECTLY FROM FIREBASE
  useEffect(() => {
    if (isDemoMode) {
      // 1. DEMO/LOCAL STORAGE MODE
      const storedInventory = localStorage.getItem(LS_INVENTORY);
      const storedTrades = localStorage.getItem(LS_TRADES);
      const storedNotifications = localStorage.getItem(LS_NOTIFICATIONS);
      const storedMockUsers = localStorage.getItem(LS_MOCK_USERS);

      setCurrentUser(null);
      localStorage.removeItem(LS_CURRENT_USER);

      setInventory(storedInventory ? JSON.parse(storedInventory) : {});
      setTrades(storedTrades ? JSON.parse(storedTrades) : []);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : [
        {
          id: 'notif_welcome',
          userId: 'demo_user',
          title: '🏆 ¡Bienvenid@ al Álbum 2026!',
          body: 'Sumá tus figus, marcá las repes y armá canjes al toque. ¡Vamos a completar ese álbum!',
          type: 'trade_update',
          tradeId: '',
          read: false,
          createdAt: new Date().toISOString()
        }
      ]);

      if (storedMockUsers) {
        setAllUsers(JSON.parse(storedMockUsers));
      } else {
        setAllUsers(INITIAL_MOCK_USERS);
        localStorage.setItem(LS_MOCK_USERS, JSON.stringify(INITIAL_MOCK_USERS));
      }
      setLoading(false);
    } else {
      // 2. FIREBASE ONLINE MODE
      if (!auth || !db) return;

      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            sessionStorage.removeItem(REDIRECT_FLOW_KEY);
            setAuthInProgress(false);
          }
        })
        .catch((err: AuthError) => {
          sessionStorage.removeItem(REDIRECT_FLOW_KEY);
          setAuthInProgress(false);
          console.error('Google redirect error:', err);
          window.dispatchEvent(new CustomEvent('app-error', {
            detail: {
              message: 'No pudimos completar el inicio de sesion en iPhone. Proba abrirlo en Safari y volver a tocar "Iniciar con Google".'
            }
          }));
        });

      const unsubAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        setLoading(true);
        try {
          if (fbUser) {
            const userDocRef = doc(db, 'users', fbUser.uid);
            
            let userProfile: UserProfile | null = null;
            try {
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                userProfile = userSnap.data() as UserProfile;
              } else {
                // Create new user profile document in Firestore
                const newProfile: UserProfile = {
                  uid: fbUser.uid,
                  name: fbUser.displayName || 'Coleccionista',
                  email: fbUser.email || '',
                  photoURL: fbUser.photoURL || null,
                  location: 'San Vicente',
                  updatedAt: new Date().toISOString()
                };
                await setDoc(userDocRef, newProfile);
                userProfile = newProfile;
              }
            } catch (err) {
              console.warn('Error fetching user profile from Firestore, using fallback profile:', err);
              userProfile = {
                uid: fbUser.uid,
                name: fbUser.displayName || 'Coleccionista',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || null,
                location: 'San Vicente',
                updatedAt: new Date().toISOString()
              };
            }

            setCurrentUser(userProfile);

            // Listen to user inventory with safety triggers
            const invDocRef = doc(db, 'users', fbUser.uid, 'inventory', 'stickers');
            const unsubInventory = onSnapshot(invDocRef, (snap) => {
              if (snap.exists()) {
                setInventory(snap.data().stickers || {});
              } else {
                setInventory({});
              }
            }, (err) => {
              console.warn(`Firestore inventory subscription error: ${err.message}`);
            });

            // Listen to all active users profile & their inventories with safety triggers
            const usersQuery = collection(db, 'users');
            const unsubAllUsers = onSnapshot(usersQuery, async (usersSnap) => {
              const loadedUsers: { profile: UserProfile; stickers: { [code: string]: number } }[] = [];
              
              for (const d of usersSnap.docs) {
                if (d.id === fbUser.uid) continue; // skip current
                const prof = d.data() as UserProfile;
                
                // Load their public inventory
                try {
                  const innerStickersDoc = await getDoc(doc(db, 'users', d.id, 'inventory', 'stickers'));
                  const stickersData = innerStickersDoc.exists() ? innerStickersDoc.data().stickers || {} : {};
                  loadedUsers.push({ profile: prof, stickers: stickersData });
                } catch (e) {
                  console.warn(`Failed loading inventory for user ${d.id}`);
                }
              }
              
              // In Firebase mode, only show real collectors from Firestore.
              setAllUsers(loadedUsers);
            }, (err) => {
              console.warn(`Firestore active users subscription warning: ${err.message}`);
              setAllUsers([]);
            });

            // Listen to trades for current user
            const senderTradesQuery = query(collection(db, 'trades'), where('senderId', '==', fbUser.uid));
            const receiverTradesQuery = query(collection(db, 'trades'), where('receiverId', '==', fbUser.uid));

            const unsubSenderTrades = onSnapshot(senderTradesQuery, (snap) => {
              const senderTrades = snap.docs.map(d => d.data() as TradeOffer);
              setTrades(prev => {
                const other = prev.filter(t => t.receiverId === fbUser.uid);
                return [...other, ...senderTrades];
              });
            }, (err) => {
              console.warn(`Sender trades sub error: ${err.message}`);
            });

            const unsubReceiverTrades = onSnapshot(receiverTradesQuery, (snap) => {
              const receiverTrades = snap.docs.map(d => d.data() as TradeOffer);
              setTrades(prev => {
                const other = prev.filter(t => t.senderId === fbUser.uid);
                return [...other, ...receiverTrades];
              });
            }, (err) => {
              console.warn(`Receiver trades sub error: ${err.message}`);
            });

            // Listen to notifications
            const notifQuery = query(collection(db, 'notifications'), where('userId', '==', fbUser.uid));
            const unsubNotifications = onSnapshot(notifQuery, (snap) => {
              const loadedNotifs = snap.docs.map(d => d.data() as AppNotification);
              setNotifications(loadedNotifs);
            }, (err) => {
              console.warn(`Notifications sub error: ${err.message}`);
            });

            setLoading(false);
            setAuthInProgress(false);

            return () => {
              unsubInventory();
              unsubAllUsers();
              unsubSenderTrades();
              unsubReceiverTrades();
              unsubNotifications();
            };
          } else {
            setCurrentUser(null);
            setInventory({});
            setTrades([]);
            setNotifications([]);
            setLoading(false);
            setAuthInProgress(false);
          }
        } catch (globalSetupErr) {
          console.error('Fatal initialization error in Auth listener:', globalSetupErr);
          setLoading(false);
          setAuthInProgress(false);
        }
      });

      return () => unsubAuth();
    }
  }, [isDemoMode]);

  // SIGN IN FLOW
  const signIn = async () => {
    if (isDemoMode) {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          message: 'El modo invitado ya no esta disponible. Configura Firebase para iniciar sesion con Google.'
        }
      }));
      return;
    }

    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setAuthInProgress(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const authErr = err as AuthError;
      const shouldFallbackToRedirect =
        authErr?.code === 'auth/popup-blocked' ||
        authErr?.code === 'auth/operation-not-supported-in-this-environment';

      if (shouldFallbackToRedirect) {
        sessionStorage.setItem(REDIRECT_FLOW_KEY, '1');
        await signInWithRedirect(auth, provider);
        return;
      }

      if (authErr?.code === 'auth/unauthorized-domain') {
        window.dispatchEvent(new CustomEvent('app-error', {
          detail: {
            message: 'Dominio no autorizado en Firebase Auth. Agrega tu dominio de Netlify en Authentication > Settings > Authorized domains.'
          }
        }));
      }

      console.error('Google Sign-In Error:', err);
      setAuthInProgress(false);
    }
  };

  // SIGN OUT FLOW
  const signOut = async () => {
    if (isDemoMode) {
      setCurrentUser(null);
      localStorage.removeItem(LS_CURRENT_USER);
      localStorage.removeItem(LS_INVENTORY);
      localStorage.removeItem(LS_TRADES);
      localStorage.removeItem(LS_NOTIFICATIONS);
      setInventory({});
      setTrades([]);
      setNotifications([]);
      return;
    }

    if (!auth) return;
    await firebaseSignOut(auth);
  };

  // UPDATE STICKER COUNTS
  const updateStickerCount = async (code: string, count: number) => {
    // Keep count protected within safe limits
    const safeCount = Math.max(0, Math.min(99, count));
    const nextInventory = { ...inventory, [code]: safeCount };
    if (safeCount === 0) {
      delete nextInventory[code];
    }
    setInventory(nextInventory);

    if (isDemoMode) {
      localStorage.setItem(LS_INVENTORY, JSON.stringify(nextInventory));
    } else {
      if (!currentUser || !db) return;
      const docRef = doc(db, 'users', currentUser.uid, 'inventory', 'stickers');
      try {
        await setDoc(docRef, {
          userId: currentUser.uid,
          stickers: nextInventory,
          updatedAt: Timestamp.now().toDate().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/inventory/stickers`);
      }
    }
  };

  // UPDATE USER LOCATION
  const updateUserLocation = async (location: string) => {
    if (!currentUser) return;
    const nextProfile = { ...currentUser, location, updatedAt: new Date().toISOString() };
    setCurrentUser(nextProfile);

    if (isDemoMode) {
      localStorage.setItem(LS_CURRENT_USER, JSON.stringify(nextProfile));
    } else {
      if (!db) return;
      const docRef = doc(db, 'users', currentUser.uid);
      try {
        await setDoc(docRef, {
          ...nextProfile,
          updatedAt: Timestamp.now().toDate().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    }
  };

  // CREATE TRADE OFFER
  const createTradeOffer = async (receiverId: string, offered: string[], requested: string[]) => {
    if (!currentUser) return;
    
    const tradeId = isDemoMode 
      ? `trade_${Date.now()}` 
      : doc(collection(db!, 'trades')).id;

    const receiverName = allUsers.find(u => u.profile.uid === receiverId)?.profile.name || 'Colega figu';

    const newTrade: TradeOffer = {
      id: tradeId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      receiverId,
      receiverName,
      offeredStickers: offered,
      requestedStickers: requested,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Prepare matching notification for recipient
    const notifId = isDemoMode ? `notif_${Date.now()}` : doc(collection(db!, 'notifications')).id;
    const newNotification: AppNotification = {
      id: notifId,
      userId: receiverId,
      title: '🤝 ¡Te llegó una propuesta de canje!',
      body: `${currentUser.name} te quiere canjear figus. Te ofrece ${offered.length} y te pide ${requested.length}.`,
      type: 'trade_incoming',
      tradeId,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      // Save offer locally
      const updatedTrades = [newTrade, ...trades];
      setTrades(updatedTrades);
      localStorage.setItem(LS_TRADES, JSON.stringify(updatedTrades));

      // Update mock users to store active actions if needed, and write recipient notification list
      // If mock receiver is Mateo/Clara/Benjamin, let's append the notification in the stored array or trigger an alert
      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(updatedNotifications));
    } else {
      if (!db) return;
      try {
        await setDoc(doc(db, 'trades', tradeId), newTrade);
        await setDoc(doc(db, 'notifications', notifId), newNotification);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `trades/${tradeId}`);
      }
    }
  };

  // UPDATE TRADE STATUS (Accept, decline, cancel)
  const updateTradeStatus = async (tradeId: string, status: 'accepted' | 'declined' | 'cancelled') => {
    if (!currentUser) return;

    let updatedTrade: TradeOffer | undefined;
    const updatedTrades = trades.map(t => {
      if (t.id === tradeId) {
        updatedTrade = { ...t, status, updatedAt: new Date().toISOString() };
        return updatedTrade;
      }
      return t;
    });

    setTrades(updatedTrades);

    // If accepted, execute exchange locally if in demo mode! This is incredible and rewarding:
    // Actually exchange the physical stickers in inventory when a trade is accepted!
    if (status === 'accepted' && updatedTrade) {
      const isSender = updatedTrade.senderId === currentUser.uid;
      const nextInv = { ...inventory };
      
      const outgoingStickers = isSender ? updatedTrade.offeredStickers : updatedTrade.requestedStickers;
      const incomingStickers = isSender ? updatedTrade.requestedStickers : updatedTrade.offeredStickers;

      // Remove / decrement offered
      outgoingStickers.forEach(code => {
        if (nextInv[code] && nextInv[code] > 0) {
          nextInv[code] = nextInv[code] - 1;
          if (nextInv[code] === 0) {
            delete nextInv[code];
          }
        }
      });

      // Add incoming
      incomingStickers.forEach(code => {
        nextInv[code] = (nextInv[code] || 0) + 1;
      });

      setInventory(nextInv);
      if (isDemoMode) {
        localStorage.setItem(LS_INVENTORY, JSON.stringify(nextInv));
      } else {
        // sync to firebase
        try {
          await setDoc(doc(db!, 'users', currentUser.uid, 'inventory', 'stickers'), {
            userId: currentUser.uid,
            stickers: nextInv,
            updatedAt: Timestamp.now().toDate().toISOString()
          });
        } catch (e) {
          console.error('Failed syncing inventory upon swap accept');
        }
      }
    }

    // Prepare notifications alerting participant of status updates
    if (updatedTrade) {
      const recipientId = updatedTrade.senderId === currentUser.uid ? updatedTrade.receiverId : updatedTrade.senderId;
      const notifId = isDemoMode ? `notif_status_${Date.now()}` : doc(collection(db!, 'notifications')).id;
      
      let alertMsg = '';
      if (status === 'accepted') alertMsg = '🤝 ¡Te aceptaron la propuesta! Canje listo.';
      if (status === 'declined') alertMsg = '❌ Te rechazaron la propuesta de canje.';
      if (status === 'cancelled') alertMsg = '🛑 Se canceló la propuesta de canje.';

      const newNotification: AppNotification = {
        id: notifId,
        userId: recipientId,
        title: '📊 Novedades del canje',
        body: `${currentUser.name} ${status === 'accepted' ? 'aceptó' : status === 'declined' ? 'rechazó' : 'canceló'} el canje.`,
        type: 'trade_update',
        tradeId,
        read: false,
        createdAt: new Date().toISOString()
      };

      if (isDemoMode) {
        localStorage.setItem(LS_TRADES, JSON.stringify(updatedTrades));
        const updatedNotifs = [newNotification, ...notifications];
        setNotifications(updatedNotifs);
        localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(updatedNotifs));
      } else {
        if (!db) return;
        try {
          await updateDoc(doc(db, 'trades', tradeId), {
            status,
            updatedAt: Timestamp.now().toDate().toISOString()
          });
          await setDoc(doc(db, 'notifications', notifId), newNotification);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `trades/${tradeId}`);
        }
      }
    }
  };

  // CLEAR INDIVIDUAL NOTIFICATION
  const clearNotification = async (notifId: string) => {
    const nextNotifs = notifications.filter(n => n.id !== notifId);
    setNotifications(nextNotifs);

    if (isDemoMode) {
      localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(nextNotifs));
    } else {
      if (!db) return;
      try {
        await deleteDoc(doc(db, 'notifications', notifId));
      } catch (err) {
        console.error('Failed deleting notification:', err);
      }
    }
  };

  // MARK ALL AS READ
  const markAllNotificationsAsRead = async () => {
    const nextNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(nextNotifs);

    if (isDemoMode) {
      localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(nextNotifs));
    } else {
      if (!currentUser || !db) return;
      // loop update
      try {
        for (const notif of notifications) {
          if (!notif.read) {
            await updateDoc(doc(db, 'notifications', notif.id), { read: true });
          }
        }
      } catch (e) {
        console.error('Failed reading notifications in bulk');
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        inventory,
        allUsers,
        trades,
        notifications,
        isDemoMode,
        loading,
        authInProgress,
        signIn,
        signOut,
        updateStickerCount,
        updateUserLocation,
        createTradeOffer,
        updateTradeStatus,
        clearNotification,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
