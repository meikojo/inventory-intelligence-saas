import React, { useState, useEffect } from 'react';
import { Users, Activity, Settings, Database, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, stores: 0 });
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState('');
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch stats using RPC (bypasses RLS securely)
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      
      if (!statsError && statsData) {
        setStats({ users: statsData.users || 0, stores: statsData.stores || 0 });
      } else {
        console.error("Failed to fetch admin stats:", statsError);
      }

      // Fetch dynamic rules
      const { data: rulesData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'amazon_scraping_rules')
        .single();
      
      if (rulesData) {
        setRules(JSON.stringify(rulesData.value, null, 2));
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRules = async () => {
    try {
      setSavingRules(true);
      const parsedRules = JSON.parse(rules); // Validate JSON
      
      const { error } = await supabase
        .from('system_config')
        .update({ value: parsedRules, updated_at: new Date().toISOString() })
        .eq('key', 'amazon_scraping_rules');
        
      if (error) throw error;
      alert('تم تحديث قواعد السحب بنجاح! جميع إضافات المستخدمين ستعمل وفقاً للقواعد الجديدة.');
    } catch (err) {
      alert("خطأ في تحديث القواعد، تأكد من صحة صيغة JSON. \n" + err.message);
    } finally {
      setSavingRules(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Loader2 className="spin" size={32} color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-primary)' }}>
          <Settings size={28} /> لوحة الإدارة الذكية (Admin)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>مراقبة أداء النظام وتحديث الإضافات عن بعد.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>إجمالي المستخدمين</p>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{stats.users}</h3>
          </div>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-success)' }}>
            <StoreIcon size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>المتاجر المربوطة</p>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{stats.stores}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-danger)' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>حالة السيرفر</p>
            <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Online</h3>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--accent-primary)" />
          محرك الإضافة الديناميكي (Scraping Rules)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
          قم بتحديث هذا الـ JSON إذا قامت أمازون بتغيير تصميم موقعها. الإضافات الموجودة على أجهزة المستخدمين ستقرأ هذا الملف وتُحدث نفسها فوراً بدون الحاجة لموافقة متجر جوجل.
        </p>
        
        <textarea
          className="input-field"
          style={{ width: '100%', height: '300px', fontFamily: 'monospace', fontSize: '0.9rem', direction: 'ltr', padding: '16px', backgroundColor: 'var(--bg-primary)' }}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
        />
        
        <button 
          className="btn-primary" 
          style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}
          onClick={handleSaveRules}
          disabled={savingRules}
        >
          {savingRules ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
          نشر التحديث لجميع المستخدمين
        </button>
      </div>
    </div>
  );
};

// Temp store icon fallback
const StoreIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

export default AdminDashboard;
