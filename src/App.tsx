/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { DashboardLayout } from './components/DashboardLayout';
import { NotificationProvider } from './components/NotificationProvider';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const [authData, setAuthData] = useState<{ isAuthenticated: boolean; role: string; userEmail: string; isLoading: boolean }>({
    isAuthenticated: false,
    role: 'Worker',
    userEmail: '',
    isLoading: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.email));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setAuthData({
              isAuthenticated: true,
              role: data.role,
              userEmail: user.email,
              isLoading: false
            });
          } else {
            // Check if it's the main admin
            if (user.email === 'ahmedzayn.x@gmail.com') {
              const newAdmin = {
                email: user.email,
                name: user.displayName || 'أحمد زين',
                role: 'Admin',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, 'users', user.email), newAdmin);
              setAuthData({
                isAuthenticated: true,
                role: 'Admin',
                userEmail: user.email,
                isLoading: false
              });
            } else {
              // Unauthorized user
              await signOut(auth);
              setAuthData({
                isAuthenticated: false,
                role: 'Worker',
                userEmail: '',
                isLoading: false
              });
              alert('عذراً، هذا الحساب غير مسجل في النظام. يرجى التواصل مع المدير.');
            }
          }
        } catch (error) {
          console.error('Error fetching role:', error);
          setAuthData(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthData({
          isAuthenticated: false,
          role: 'Worker',
          userEmail: '',
          isLoading: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authData.isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-text2 font-bold animate-pulse">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      {authData.isAuthenticated ? (
        <DashboardLayout onLogout={handleLogout} userRole={authData.role} userEmail={authData.userEmail} />
      ) : (
        <Login onLogin={() => {}} />
      )}
    </NotificationProvider>
  );
}
