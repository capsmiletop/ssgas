'use client';

import { useState } from 'react';
import { GasEntry } from '@/types';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
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

    try {
      // Convert string values to numbers for API
      const submitData: GasEntry = {
        gas_Fecha: formData.gas_Fecha,
        gas_Suplidor: formData.gas_Suplidor,
        gas_Factura: formData.gas_Factura,
        gas_Inicio: parseFloat(formData.gas_Inicio as string) || 0,
        gas_Fin: parseFloat(formData.gas_Fin as string) || 0,
        gas_Dias: parseFloat(formData.gas_Dias as string) || 0,
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

