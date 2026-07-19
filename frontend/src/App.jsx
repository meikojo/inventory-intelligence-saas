import React, { useState } from 'react';
import { LayoutDashboard, Store, Upload, Settings, LogOut, ChevronRight } from 'lucide-react';
import './index.css';

import StoresManager from './components/StoresManager';

const DataIngest = () => <div className="glass-card"><h2>رفع البيانات</h2><p>قريباً: ربط الأعمدة الذكي ورفع الملفات.</p></div>;
const Analysis = () => <div className="glass-card"><h2>التحليل الذكي</h2><p>قريباً: عرض نتائج محرك الرياضيات.</p></div>;
const SettingsPanel = () => <div className="glass-card"><h2>الإعدادات</h2><p>قريباً: ضبط خصائص المتاجر وحدود المخاطر.</p></div>;

function App() {
  const [activeTab, setActiveTab] = useState('stores');

  const renderContent = () => {
    switch(activeTab) {
      case 'stores': return <StoresManager />;
      case 'ingest': return <DataIngest />;
      case 'analysis': return <Analysis />;
      case 'settings': return <SettingsPanel />;
      default: return <StoresManager />;
    }
  };

  return (
    <div className="flex" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '40px', paddingRight: '12px' }}>
          <h1 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span> InventorySaaS
          </h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('stores')}
            style={navBtnStyle(activeTab === 'stores')}
          >
            <Store size={20} /> المتاجر
          </button>
          
          <button 
            onClick={() => setActiveTab('ingest')}
            style={navBtnStyle(activeTab === 'ingest')}
          >
            <Upload size={20} /> معالجة البيانات
          </button>
          
          <button 
            onClick={() => setActiveTab('analysis')}
            style={navBtnStyle(activeTab === 'analysis')}
          >
            <LayoutDashboard size={20} /> التحليل
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            style={navBtnStyle(activeTab === 'settings')}
          >
            <Settings size={20} /> الإعدادات
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button style={{...navBtnStyle(false), color: 'var(--accent-danger)'}}>
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

const navBtnStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '12px 16px',
  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'right',
  fontFamily: 'var(--font-arabic)',
  fontSize: '1rem',
  fontWeight: isActive ? '600' : '400',
  transition: 'all 0.2s',
  borderRight: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
});

export default App;
