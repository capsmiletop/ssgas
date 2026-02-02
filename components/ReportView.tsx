'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GasRecord, DateRange } from '@/types';
import { format } from 'date-fns';

export default function ReportView() {
  const [data, setData] = useState<GasRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof GasRecord; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/entries?dateRange=${dateRange}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof GasRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = a[sortConfig.key];
    let bValue: any = b[sortConfig.key];
    
    // Handle numeric fields
    if (sortConfig.key === 'gas_Consumido' || sortConfig.key === 'gas_Comprado' || sortConfig.key === 'gas_Indice') {
      aValue = parseFloat(aValue?.toString() || '0');
      bValue = parseFloat(bValue?.toString() || '0');
    }
    
    // Handle date fields
    if (sortConfig.key === 'gas_Fecha') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const chartData = sortedData.map(item => ({
    date: format(new Date(item.gas_Fecha), 'dd/MM/yyyy'),
    'Gallons Used': parseFloat(item.gas_Consumido?.toString() || '0'),
    'Gallons Added': parseFloat(item.gas_Comprado?.toString() || '0'),
    'Time Elapsed': item.gas_Tiempo || '',
    'Index': parseFloat(item.gas_Indice?.toString() || '0'),
  })).reverse();

  const getIndexIndicator = (cambio: number) => {
    if (cambio > 0) return <span className="index-indicator index-up">↗</span>;
    if (cambio < 0) return <span className="index-indicator index-down">↙</span>;
    return <span className="index-indicator index-same">≡</span>;
  };

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '90days', label: '90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Report</h2>
        
        <div className="date-range-selector">
          {dateRangeOptions.map(option => (
            <button
              key={option.value}
              className={`date-range-btn ${dateRange === option.value ? 'active' : ''}`}
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <>
            {chartData.length > 0 && (
              <div className="chart-container">
                <h3 style={{ marginBottom: '20px', color: '#333' }}>Performance Chart</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Gallons Used" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Gallons Added" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Index" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('gas_Fecha')}>
                      Date {sortConfig?.key === 'gas_Fecha' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('gas_Consumido' as keyof GasRecord)}>
                      Gallons Used {sortConfig?.key === 'gas_Consumido' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('gas_Comprado' as keyof GasRecord)}>
                      Gallons Added {sortConfig?.key === 'gas_Comprado' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('gas_Tiempo' as keyof GasRecord)}>
                      Time Elapsed {sortConfig?.key === 'gas_Tiempo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('gas_Indice' as keyof GasRecord)}>
                      Index {sortConfig?.key === 'gas_Indice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                        No data available for the selected date range
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((row) => (
                      <tr key={row.gas_id}>
                        <td>{format(new Date(row.gas_Fecha), 'dd/MM/yyyy')}</td>
                        <td>{parseFloat(row.gas_Consumido?.toString() || '0').toFixed(2)}</td>
                        <td>{parseFloat(row.gas_Comprado?.toString() || '0').toFixed(2)}</td>
                        <td>{row.gas_Tiempo || '-'}</td>
                        <td>
                          {parseFloat(row.gas_Indice?.toString() || '0').toFixed(2)}
                          {getIndexIndicator(row.gas_Cambio || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

