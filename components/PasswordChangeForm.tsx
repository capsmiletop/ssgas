'use client';

import { useState, useEffect } from 'react';
import { PasswordChangeRequest } from '@/types';
import { authStorage } from '@/lib/auth';

interface PasswordChangeFormProps {
  username: string;
  isFirstLogin?: boolean;
  onPasswordChangeSuccess: () => void;
  onCancel?: () => void;
}

export default function PasswordChangeForm({ 
  username, 
  isFirstLogin = false,
  onPasswordChangeSuccess,
  onCancel 
}: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    // If first login, focus on new password field
    if (isFirstLogin) {
      const newPasswordInput = document.getElementById('newPassword');
      if (newPasswordInput) {
        newPasswordInput.focus();
      }
    }
  }, [isFirstLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    // Clear field-specific error
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof errors];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: typeof errors = {};

    if (!isFirstLogin && !formData.oldPassword) {
      validationErrors.oldPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      validationErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      validationErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const passwordChangeRequest: PasswordChangeRequest = {
        username,
        oldPassword: isFirstLogin ? undefined : formData.oldPassword,
        newPassword: formData.newPassword,
      };

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordChangeRequest),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh session to get updated user info
        const session = authStorage.getSession();
        if (session) {
          session.user.usr_Cambiar = 0;
          authStorage.setSession(session);
        }
        onPasswordChangeSuccess();
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#333', textAlign: 'center' }}>
        {isFirstLogin ? 'Create Password' : 'Change Password'}
      </h2>
      
      {isFirstLogin && (
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          This is your first login. Please create a password to continue.
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isFirstLogin && (
          <div className="form-group">
            <label className="form-label" htmlFor="oldPassword">
              Current Password
            </label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              className="form-input"
              value={formData.oldPassword}
              onChange={handleChange}
              required={!isFirstLogin}
            />
            {errors.oldPassword && (
              <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                {errors.oldPassword}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="newPassword">
            {isFirstLogin ? 'Password' : 'New Password'}
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            className="form-input"
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength={6}
          />
          {errors.newPassword && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.newPassword}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm {isFirstLogin ? 'Password' : 'New Password'}
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Changing...' : isFirstLogin ? 'Create Password' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

