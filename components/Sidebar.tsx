'use client';

interface SidebarProps {
  activeModule: 'dashboard' | 'entry' | 'report' | 'settings' | 'users';
  onModuleChange: (module: 'dashboard' | 'entry' | 'report' | 'settings' | 'users') => void;
  permissions: {
    Dashboard?: number;
    DataEntry?: number;
    Report?: number;
    Settings?: number;
    UserManagement?: number;
  } | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeModule,
  onModuleChange,
  permissions,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const hasPermission = (module: 'Dashboard' | 'DataEntry' | 'Report' | 'Settings' | 'UserManagement'): boolean => {
    if (!permissions) return false;
    return permissions[module] === 1;
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: '📊', permission: 'Dashboard' as const },
    { id: 'entry' as const, label: 'Data Entry', icon: '📝', permission: 'DataEntry' as const },
    { id: 'report' as const, label: 'Report', icon: '📈', permission: 'Report' as const },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️', permission: 'Settings' as const },
    { id: 'users' as const, label: 'Users', icon: '👥', permission: 'UserManagement' as const },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2 className="sidebar-title">Gas Tracking</h2>}
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => onModuleChange(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

