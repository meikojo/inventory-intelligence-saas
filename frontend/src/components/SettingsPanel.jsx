import React, { useState } from 'react';
import { Settings, Bell, Shield, Database, Save, Loader2 } from 'lucide-react';

const SettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    lowStockAlerts: true,
    autoSync: true,
    dataRetention: '90'
  });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('تم حفظ الإعدادات بنجاح!');
    }, 1000);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={32} color="var(--accent-primary)" />
          الإعدادات ⚙️
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>تخصيص النظام وتفضيلات الحساب</p>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Notifications */}
        <div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="var(--accent-warning)" />
            التنبيهات
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={settings.notifications} onChange={e => setSettings({...settings, notifications: e.target.checked})} />
              تفعيل إشعارات النظام الأساسية
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={settings.lowStockAlerts} onChange={e => setSettings({...settings, lowStockAlerts: e.target.checked})} />
              تنبيهات انخفاض المخزون (تحت 10 وحدات)
            </label>
          </div>
        </div>

        {/* Sync */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--accent-primary)" />
            الأتمتة والبيانات
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={settings.autoSync} onChange={e => setSettings({...settings, autoSync: e.target.checked})} />
              السماح للمزامنة التلقائية عبر إضافة كروم
            </label>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>مدة الاحتفاظ ببيانات المبيعات:</label>
              <select className="input-field" style={{ width: '200px' }} value={settings.dataRetention} onChange={e => setSettings({...settings, dataRetention: e.target.value})}>
                <option value="30">30 يوم</option>
                <option value="90">90 يوم</option>
                <option value="180">6 أشهر</option>
                <option value="365">سنة كاملة</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={loading}
          style={{ alignSelf: 'flex-start', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
          حفظ التعديلات
        </button>

      </div>
    </div>
  );
};

export default SettingsPanel;
