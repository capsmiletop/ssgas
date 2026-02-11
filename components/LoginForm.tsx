'use client';

import { useState } from 'react';
import { LoginRequest, LoginResponse } from '@/types';
import { authStorage } from '@/lib/auth';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onPasswordChangeRequest: (username: string) => void;
}

export default function LoginForm({ onLoginSuccess, onPasswordChangeRequest }: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginRequest: LoginRequest = {
        username: formData.username,
        password: formData.password,
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginRequest),
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.user) {
        // Store session
        authStorage.setSession({
          user: result.user,
          permissions: result.permissions || null,
        });

        // Check if password change is required
        if (result.requiresPasswordChange) {
          onPasswordChangeRequest(result.user.usr_Nombre);
        } else {
          onLoginSuccess();
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#333', textAlign: 'center' }}>Login</h2>
      
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="username">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="form-input"
            value={formData.username}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group" style={{ marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {showPasswordChange ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

