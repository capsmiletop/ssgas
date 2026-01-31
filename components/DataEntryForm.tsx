'use client';

import { useState } from 'react';
import { GasEntry } from '@/types';

export default function DataEntryForm() {
  const [formData, setFormData] = useState<GasEntry>({
    gas_Fecha: new Date().toISOString().slice(0, 16),
    gas_Suplidor: '',
    gas_Factura: '',
    gas_Inicio: 0,
    gas_Fin: 0,
    gas_Dias: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'gas_Fecha' ? value : name.includes('gas_Inicio') || name.includes('gas_Fin') || name.includes('gas_Dias') 
        ? parseFloat(value) || 0 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Entry saved successfully!' });
        setFormData({
          gas_Fecha: new Date().toISOString().slice(0, 16),
          gas_Suplidor: '',
          gas_Factura: '',
          gas_Inicio: 0,
          gas_Fin: 0,
          gas_Dias: 0,
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
            value={formData.gas_Fecha}
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
            step="0.0001"
            min="0"
            max="100"
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
            step="0.0001"
            min="0"
            max="100"
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
            step="0.01"
            min="0"
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

