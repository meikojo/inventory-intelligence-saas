import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Store, Upload, Settings, LogOut, ChevronRight, ShieldAlert, FileSpreadsheet, User, TrendingUp, BarChart2, Link } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import ColumnMapper from './components/ColumnMapper';
import './index.css';

import StoresManager from './components/StoresManager';
import DataIngest from './components/DataIngest';
import TopSellers from './components/TopSellers';
import AdvancedAnalysis from './components/AdvancedAnalysis';
import SettingsPanel from './components/SettingsPanel';
import Profile from './components/Profile';

// Mock settings panel until built
// const SettingsPanel = () => <div className="glass-card"><h2>الإعدادات</h2><p>قريباً: ضبط خصائص المتاجر وحدود المخاطر.</p></div>;

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
      case 'ingest': return <DataIngest />;
      case 'top_sellers': return <TopSellers />;
      case 'advanced_analysis': return <AdvancedAnalysis />;
      case 'mapper': return <ColumnMapper />;
      case 'stores': return <StoresManager />;
      case 'settings': return <SettingsPanel />;
      case 'profile': return <Profile />;
      case 'admin': return userRole === 'admin' ? <AdminDashboard /> : <StoresManager />;
      default: return <StoresManager />;
    }
  };

  const navItems = [
    { id: 'ingest', icon: <Upload size={20} />, label: 'رفع البيانات' },
    { id: 'top_sellers', icon: <TrendingUp size={20} />, label: 'الأكثر مبيعاً' },
    { id: 'advanced_analysis', icon: <BarChart2 size={20} />, label: 'التحليل المتقدم' },
    { id: 'mapper', icon: <Link size={20} />, label: 'قوالب الربط' },
    { id: 'stores', icon: <Store size={20} />, label: 'المتاجر' },
    { id: 'settings', icon: <Settings size={20} />, label: 'الإعدادات' },
  ];

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
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={navBtnStyle(activeTab === item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}

          <button 
            onClick={() => setActiveTab('profile')}
            style={navBtnStyle(activeTab === 'profile')}
          >
            <User size={20} /> الملف الشخصي
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
