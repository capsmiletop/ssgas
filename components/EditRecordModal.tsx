'use client';

import { useState, useEffect } from 'react';
import { GasEntry } from '@/types';
import { authStorage } from '@/lib/auth';

interface EditRecordModalProps {
  recordId: number | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditRecordModal({ recordId, onClose, onSave }: EditRecordModalProps) {
  const [formData, setFormData] = useState<GasEntry>({
    gas_Fecha: new Date().toISOString().slice(0, 16),
    gas_Suplidor: '',
    gas_Factura: '',
    gas_Inicio: 0,
    gas_Fin: 0,
    gas_Dias: 0,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<{
    gas_Fecha?: string;
    gas_Inicio?: string;
    gas_Fin?: string;
    gas_Dias?: string;
  }>({});

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const fetchRecord = async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/entries?id=${recordId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const record = result.data;
        setFormData({
          gas_id: record.gas_id,
          gas_Fecha: new Date(record.gas_Fecha).toISOString().slice(0, 16),
          gas_Suplidor: record.gas_Suplidor || '',
          gas_Factura: record.gas_Factura || '',
          gas_Inicio: parseFloat(record.gas_Inicio?.toString() || '0'),
          gas_Fin: parseFloat(record.gas_Fin?.toString() || '0'),
          gas_Dias: parseFloat(record.gas_Dias?.toString() || '0'),
        });
      }
    } catch (error) {
      console.error('Error fetching record:', error);
      setMessage({ type: 'error', text: 'Failed to load record' });
    } finally {
      setFetching(false);
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

    // Handle number inputs
    if (name === 'gas_Inicio' || name === 'gas_Fin' || name === 'gas_Dias') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value) || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: typeof errors = {};

    if (!formData.gas_Fecha) {
      validationErrors.gas_Fecha = 'Date is required';
    }
    if (formData.gas_Inicio === '' || formData.gas_Inicio === null || formData.gas_Inicio === undefined) {
      validationErrors.gas_Inicio = 'Initial Reading is required';
    }
    if (formData.gas_Fin === '' || formData.gas_Fin === null || formData.gas_Fin === undefined) {
      validationErrors.gas_Fin = 'Final Reading is required';
    }

    const initialReading = typeof formData.gas_Inicio === 'number' ? formData.gas_Inicio : parseFloat(formData.gas_Inicio as any);
    const finalReading = typeof formData.gas_Fin === 'number' ? formData.gas_Fin : parseFloat(formData.gas_Fin as any);
    if (!isNaN(initialReading) && !isNaN(finalReading) && finalReading < initialReading) {
      validationErrors.gas_Fin = 'Final Reading must not be less than Initial Reading';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const session = authStorage.getSession();
      const submitData: GasEntry = {
        ...formData,
        gas_Usuario: session?.user.usr_Nombre || 'System',
      };

      const response = await fetch('/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Record updated successfully!' });
        setTimeout(() => {
          onSave();
          onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update record' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (!recordId) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '24px', color: '#333' }}>Edit Record</h2>
        
        {message && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
            {message.text}
          </div>
        )}

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
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
                step="0.01"
                min="0"
                max="100"
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
                step="0.01"
                min="0"
                max="100"
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
                step="0.01"
                min="0"
              />
              {errors.gas_Dias && (
                <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
                  {errors.gas_Dias}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

