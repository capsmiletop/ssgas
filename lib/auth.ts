import { User, UserPermissions } from '@/types';

export interface AuthSession {
  user: User;
  permissions: UserPermissions | null;
}

// Simple session storage using localStorage (client-side)
// In production, use secure HTTP-only cookies or JWT tokens
export const authStorage = {
  getSession: (): AuthSession | null => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem('auth_session');
    return session ? JSON.parse(session) : null;
  },

  setSession: (session: AuthSession): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_session', JSON.stringify(session));
  },

  clearSession: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_session');
  },

  hasPermission: (module: 'Dashboard' | 'DataEntry' | 'Report' | 'Settings' | 'UserManagement'): boolean => {
    const session = authStorage.getSession();
    if (!session || !session.permissions) return false;
    return session.permissions[module] === 1;
  },
};

