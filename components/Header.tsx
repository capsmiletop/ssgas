'use client';

import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  userName: string;
  onLogout: () => void;
  onMenuToggle: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ userName, onLogout, onMenuToggle, searchValue, onSearchChange }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="menu-toggle-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <div className="header-brand">
          <div className="header-logo-container">
            <img src="/images/logo.ico" alt="Gas Tracking System" className="header-logo" />
          </div>
          <h1 className="header-title">
            <span className="header-text">Gas Tracking System</span>
          </h1>
        </div>
      </div>
      <div className="header-right">
        {onSearchChange && (
          <div className="search-container">
            {/* <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <span className="search-icon">🔍</span> */}
          </div>
        )}
        <div className="account-dropdown" ref={dropdownRef}>
          <button
            className="account-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Account menu"
          >
            <span className="account-avatar">{userName.charAt(0).toUpperCase()}</span>
            <span className="account-name">{userName}</span>
            <span className="account-arrow">{showDropdown ? '▲' : '▼'}</span>
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <span>👤</span>
                <span>Profile</span>
              </div>
              <div className="dropdown-item">
                <span>⚙️</span>
                <span>Settings</span>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout-item" onClick={onLogout}>
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

