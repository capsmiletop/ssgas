'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import Dashboard from '@/components/Dashboard';
import { authStorage } from '@/lib/auth';

type AppState = 'login' | 'password-change' | 'dashboard';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('login');
  const [passwordChangeUsername, setPasswordChangeUsername] = useState<string>('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const session = authStorage.getSession();
    if (session) {
      // Check if password change is required
      if (session.user.usr_Cambiar === 1) {
        setPasswordChangeUsername(session.user.usr_Nombre);
        setIsFirstLogin(!session.user.usr_Clave || session.user.usr_Clave === '');
        setAppState('password-change');
      } else {
        setAppState('dashboard');
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    setAppState('dashboard');
  };

  const handlePasswordChangeRequest = (username: string) => {
    setPasswordChangeUsername(username);
    const session = authStorage.getSession();
    setIsFirstLogin(session?.user.usr_Cambiar === 1 || !session?.user.usr_Clave || session?.user.usr_Clave === '');
    setAppState('password-change');
  };

  const handlePasswordChangeSuccess = () => {
    setAppState('dashboard');
  };

  const handlePasswordChangeCancel = () => {
    // If password change was mandatory, logout
    authStorage.clearSession();
    setAppState('login');
  };

  const handleLogout = () => {
    setAppState('login');
    setPasswordChangeUsername('');
    setIsFirstLogin(false);
  };

  return (
    <>
      {appState === 'login' && (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onPasswordChangeRequest={handlePasswordChangeRequest}
        />
      )}

      {appState === 'password-change' && (
        <PasswordChangeForm
          username={passwordChangeUsername}
          isFirstLogin={isFirstLogin}
          onPasswordChangeSuccess={handlePasswordChangeSuccess}
          onCancel={isFirstLogin ? undefined : handlePasswordChangeCancel}
        />
      )}

      {appState === 'dashboard' && (
        <Dashboard onLogout={handleLogout} />
      )}
    </>
  );
}

