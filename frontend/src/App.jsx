import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Store, Upload, Settings, LogOut, ChevronRight, ShieldAlert } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

import StoresManager from './components/StoresManager';

const DataIngest = () => <div className="glass-card"><h2>رفع البيانات</h2><p>قريباً: ربط الأعمدة الذكي ورفع الملفات.</p></div>;
const Analysis = () => <div className="glass-card"><h2>التحليل الذكي</h2><p>قريباً: عرض نتائج محرك الرياضيات.</p></div>;
const SettingsPanel = () => <div className="glass-card"><h2>الإعدادات</h2><p>قريباً: ضبط خصائص المتاجر وحدود المخاطر.</p></div>;

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [activeTab, setActiveTab] = useState('stores');

  const fetchUserRole = async (userId) => {
    const { data } = await supabase.from('users').select('role').eq('id', userId).single();
    if (data) setUserRole(data.role);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth onLogin={setSession} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'stores': return <StoresManager />;
      case 'admin': return userRole === 'admin' ? <AdminDashboard /> : <StoresManager />;
      case 'dashboard': return <Analysis />;
      case 'upload': return <DataIngest />;
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
            onClick={() => setActiveTab('upload')}
            style={navBtnStyle(activeTab === 'upload')}
          >
            <Upload size={20} /> رفع البيانات
          </button>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={navBtnStyle(activeTab === 'dashboard')}
          >
            <LayoutDashboard size={20} /> التحليل
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            style={navBtnStyle(activeTab === 'settings')}
          >
            <Settings size={20} /> الإعدادات
          </button>

          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              style={{...navBtnStyle(activeTab === 'admin'), marginTop: '16px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)'}}
            >
              <ShieldAlert size={20} /> الإدارة المركزية
            </button>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handleLogout}
            style={{...navBtnStyle(false), color: 'var(--accent-danger)'}}
          >
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
