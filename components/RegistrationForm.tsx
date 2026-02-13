'use client';

import { useState } from 'react';
import { RegisterRequest, RegisterResponse } from '@/types';

interface RegistrationFormProps {
  onRegistrationSuccess: () => void;
  onBackToLogin: () => void;
}

export default function RegistrationForm({ onRegistrationSuccess, onBackToLogin }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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

    // Username validation
    if (!formData.username || formData.username.trim().length === 0) {
      validationErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      validationErrors.username = 'Username must be at least 3 characters long';
    } else if (formData.username.length > 50) {
      validationErrors.username = 'Username must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      validationErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password) {
      validationErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      validationErrors.password = 'Password must be at least 6 characters long';
    } else if (formData.password.length > 50) {
      validationErrors.password = 'Password must be less than 50 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
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
      const registerRequest: RegisterRequest = {
        username: formData.username.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerRequest),
      });

      const result: RegisterResponse = await response.json();

      if (result.success) {
        // Show success message and redirect to login
        alert(result.message || 'Account created successfully! Please login.');
        onRegistrationSuccess();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#333', textAlign: 'center' }}>Create Account</h2>
      
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
            minLength={3}
            maxLength={50}
            pattern="[a-zA-Z0-9_]+"
            title="Username can only contain letters, numbers, and underscores"
          />
          {errors.username && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.username}
            </div>
          )}
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
            minLength={6}
            maxLength={50}
          />
          {errors.password && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.password}
            </div>
          )}
          <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            Password must be at least 6 characters long
          </small>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            maxLength={50}
          />
          {errors.confirmPassword && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', marginBottom: '10px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBackToLogin}
            style={{ width: '100%' }}
          >
            Back to Login
          </button>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px', color: '#666' }}>
          <strong>Note:</strong> After registration, an administrator will need to grant you permissions before you can access the system.
        </div>
      </form>
    </div>
  );
}

