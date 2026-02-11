'use client';

import { useState, useEffect } from 'react';
import { authStorage } from '@/lib/auth';
import ReportView from './ReportView';
import DataEntryForm from './DataEntryForm';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeModule, setActiveModule] = useState<'dashboard' | 'entry' | 'report' | 'settings' | 'users'>('dashboard');
  const [permissions, setPermissions] = useState<{
    Dashboard?: number;
    DataEntry?: number;
    Report?: number;
    Settings?: number;
    UserManagement?: number;
  } | null>(null);
  const [user, setUser] = useState<{ usr_Nombre: string } | null>(null);

  useEffect(() => {
    const session = authStorage.getSession();
    if (session) {
      setUser(session.user);
      setPermissions(session.permissions);
    }
  }, []);

  const hasPermission = (module: 'Dashboard' | 'DataEntry' | 'Report' | 'Settings' | 'UserManagement'): boolean => {
    if (!permissions) return false;
    return permissions[module] === 1;
  };

  const handleLogout = () => {
    authStorage.clearSession();
    onLogout();
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Gas Tracking System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#666' }}>Welcome, {user?.usr_Nombre}</span>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <nav className="nav">
        {hasPermission('Dashboard') && (
          <button
            className={`nav-link ${activeModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveModule('dashboard')}
          >
            Dashboard
          </button>
        )}
        {hasPermission('DataEntry') && (
          <button
            className={`nav-link ${activeModule === 'entry' ? 'active' : ''}`}
            onClick={() => setActiveModule('entry')}
          >
            Data Entry Form
          </button>
        )}
        {hasPermission('Report') && (
          <button
            className={`nav-link ${activeModule === 'report' ? 'active' : ''}`}
            onClick={() => setActiveModule('report')}
          >
            Stored Records (Report)
          </button>
        )}
        {hasPermission('Settings') && (
          <button
            className={`nav-link ${activeModule === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveModule('settings')}
          >
            Parameters (Settings)
          </button>
        )}
        {hasPermission('UserManagement') && (
          <button
            className={`nav-link ${activeModule === 'users' ? 'active' : ''}`}
            onClick={() => setActiveModule('users')}
          >
            User Management
          </button>
        )}
      </nav>

      <div style={{ marginTop: '20px' }}>
        {activeModule === 'dashboard' && hasPermission('Dashboard') && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Dashboard</h2>
            <ReportView />
          </div>
        )}

        {activeModule === 'entry' && hasPermission('DataEntry') && (
          <DataEntryForm />
        )}

        {activeModule === 'report' && hasPermission('Report') && (
          <ReportView />
        )}

        {activeModule === 'settings' && hasPermission('Settings') && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Parameters (Settings)</h2>
            <p>Settings module - Coming soon</p>
          </div>
        )}

        {activeModule === 'users' && hasPermission('UserManagement') && (
          <div className="card">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>User Management</h2>
            <p>User Management module - Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

