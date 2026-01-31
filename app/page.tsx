'use client';

import { useState } from 'react';
import DataEntryForm from '@/components/DataEntryForm';
import ReportView from '@/components/ReportView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'entry' | 'report'>('entry');

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Gas Tracking System</h1>
      
      <nav className="nav">
        <button
          className={`nav-link ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('entry')}
        >
          Data Entry
        </button>
        <button
          className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Report
        </button>
      </nav>

      {activeTab === 'entry' ? <DataEntryForm /> : <ReportView />}
    </div>
  );
}

