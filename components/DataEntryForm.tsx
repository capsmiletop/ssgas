'use client';

import { useState, useEffect } from 'react';
import { GasEntry } from '@/types';
import { authStorage } from '@/lib/auth';

export default function DataEntryForm() {
  const [formData, setFormData] = useState({
    gas_Fecha: new Date().toISOString().slice(0, 16),
    gas_Suplidor: '',
    gas_Factura: '',
    gas_Inicio: '',
    gas_Fin: '',
    gas_Dias: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mostRecentDate, setMostRecentDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<{
    gas_Fecha?: string;
    gas_Inicio?: string;
    gas_Fin?: string;
    gas_Dias?: string;
  }>({});

  useEffect(() => {
    fetchMostRecentDate();
  }, []);

  const fetchMostRecentDate = async () => {
    try {
      const response = await fetch('/api/entries?dateRange=all');
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        // The data is already sorted by gas_Fecha DESC, so the first entry is the most recent
        const mostRecent = new Date(result.data[0].gas_Fecha);
        setMostRecentDate(mostRecent);
      }
    } catch (error) {
      console.error('Error fetching most recent date:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear errors when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof errors];
        return newErrors;
      });
    }
    
    // Enforce maximum of 100 for Initial Read and Final Read
    if (name === 'gas_Inicio' || name === 'gas_Fin') {
      // Allow empty string
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: '',
        }));
        return;
      }
      
      // Parse the value
      const numValue = parseFloat(value);
      
      // If it's a valid number
      if (!isNaN(numValue)) {
        // Cap at 100 if it exceeds
        if (numValue > 100) {
          setFormData(prev => ({
            ...prev,
            [name]: '100',
          }));
        } else if (numValue < 0) {
          // Prevent negative values
          setFormData(prev => ({
            ...prev,
            [name]: '0',
          }));
        } else {
          // Allow the value (including partial input like "1" when typing "10")
          setFormData(prev => ({
            ...prev,
            [name]: value,
          }));
        }
      } else {
        // If not a valid number, don't update (prevents invalid characters)
        return;
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrors({});

    // Validation
    const validationErrors: typeof errors = {};

    // Mandatory fields validation
    if (!formData.gas_Fecha) {
      validationErrors.gas_Fecha = 'Date is required';
    }
    if (!formData.gas_Inicio || formData.gas_Inicio === '') {
      validationErrors.gas_Inicio = 'Initial Reading is required';
    }
    if (!formData.gas_Fin || formData.gas_Fin === '') {
      validationErrors.gas_Fin = 'Final Reading is required';
    }

    // Final reading must not be less than initial reading
    const initialReading = parseFloat(formData.gas_Inicio as string);
    const finalReading = parseFloat(formData.gas_Fin as string);
    if (!isNaN(initialReading) && !isNaN(finalReading) && finalReading < initialReading) {
      validationErrors.gas_Fin = 'Final Reading must not be less than Initial Reading';
    }

    // Current date must not be earlier than the most recent registered date
    if (formData.gas_Fecha && mostRecentDate) {
      const currentDate = new Date(formData.gas_Fecha);
      if (currentDate < mostRecentDate) {
        validationErrors.gas_Fecha = 'The current date must not be earlier than the most recent registered date';
      }
    }

    // Free days cannot be greater than the number of days elapsed
    if (formData.gas_Fecha && mostRecentDate && formData.gas_Dias) {
      const currentDate = new Date(formData.gas_Fecha);
      const daysElapsed = Math.floor((currentDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
      const freeDays = parseFloat(formData.gas_Dias as string);
      
      if (!isNaN(freeDays) && freeDays > daysElapsed) {
        validationErrors.gas_Dias = `Free days cannot be greater than the number of days elapsed (${daysElapsed} days)`;
      }
    }

    // If there are validation errors, stop submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const session = authStorage.getSession();
      // Convert string values to numbers for API
      const submitData: GasEntry = {
        gas_Fecha: formData.gas_Fecha,
        gas_Suplidor: formData.gas_Suplidor,
        gas_Factura: formData.gas_Factura,
        gas_Inicio: parseFloat(formData.gas_Inicio as string) || 0,
        gas_Fin: parseFloat(formData.gas_Fin as string) || 0,
        gas_Dias: parseFloat(formData.gas_Dias as string) || 0,
        gas_Usuario: session?.user.usr_Nombre || 'System',
      };

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Entry saved successfully!' });
        setFormData({
          gas_Fecha: new Date().toISOString().slice(0, 16),
          gas_Suplidor: '',
          gas_Factura: '',
          gas_Inicio: '',
          gas_Fin: '',
          gas_Dias: '',
        });
        setErrors({});
        // Refresh the most recent date after successful submission
        fetchMostRecentDate();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save entry' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '24px', color: '#333' }}>Data Entry Form</h2>
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="gas_Fecha">
            Date/Time at Reading Device
          </label>
          <input
            type="datetime-local"
            id="gas_Fecha"
            name="gas_Fecha"
            className="form-input"
            value={typeof formData.gas_Fecha === 'string' ? formData.gas_Fecha : new Date(formData.gas_Fecha).toISOString().slice(0, 16)}
            onChange={handleChange}
            required
          />
          {errors.gas_Fecha && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.gas_Fecha}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gas_Suplidor">
            Vendor
          </label>
          <input
            type="text"
            id="gas_Suplidor"
            name="gas_Suplidor"
            className="form-input"
            value={formData.gas_Suplidor}
            onChange={handleChange}
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gas_Factura">
            Invoice/Receipt Number
          </label>
          <input
            type="text"
            id="gas_Factura"
            name="gas_Factura"
            className="form-input"
            value={formData.gas_Factura}
            onChange={handleChange}
            required
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gas_Inicio">
            Initial Read (%)
          </label>
          <input
            type="number"
            id="gas_Inicio"
            name="gas_Inicio"
            className="form-input"
            value={formData.gas_Inicio}
            onChange={handleChange}
            required
            step="1"
            min="0"
            max="100"
            placeholder=""
          />
          {errors.gas_Inicio && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.gas_Inicio}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gas_Fin">
            Final Read (%)
          </label>
          <input
            type="number"
            id="gas_Fin"
            name="gas_Fin"
            className="form-input"
            value={formData.gas_Fin}
            onChange={handleChange}
            required
            step="1"
            min="0"
            max="100"
            placeholder=""
          />
          {errors.gas_Fin && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.gas_Fin}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gas_Dias">
            Off Days
          </label>
          <input
            type="number"
            id="gas_Dias"
            name="gas_Dias"
            className="form-input"
            value={formData.gas_Dias}
            onChange={handleChange}
            required
            step="1"
            min="0"
            placeholder=""
          />
          {errors.gas_Dias && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.gas_Dias}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {loading ? 'Saving...' : 'Submit Entry'}
        </button>
      </form>
    </div>
  );
}

