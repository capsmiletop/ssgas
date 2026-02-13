'use client';

import { useState, useEffect } from 'react';
import { authStorage } from '@/lib/auth';
import ReportView from './ReportView';
import DataEntryForm from './DataEntryForm';
import Sidebar from './Sidebar';
import Header from './Header';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <div className={`app-layout ${mobileMenuOpen ? 'menu-open' : ''}`}>
      <Sidebar
        activeModule={activeModule}
        onModuleChange={(module) => {
          setActiveModule(module);
          setMobileMenuOpen(false);
        }}
        permissions={permissions}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <div className="main-content">
        <Header
          userName={user?.usr_Nombre || 'User'}
          onLogout={handleLogout}
          onMenuToggle={handleMenuToggle}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        <main className="content-area">
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
        </main>
      </div>
    </div>
  );
}

