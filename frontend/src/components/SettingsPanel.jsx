import React, { useState, useEffect } from 'react';
import { Settings, Calculator, Save, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SettingsPanel = () => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Math Engine Settings
  const [analyticsSettings, setAnalyticsSettings] = useState({
    adsPeriod: 30,
    leadTime: 30,
    safetyStock: 15,
    targetDays: 90
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadStoreSettings(selectedStoreId);
    }
  }, [selectedStoreId]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setStores(data);
        setSelectedStoreId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreSettings = async (storeId) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('analytics_settings')
        .eq('id', storeId)
        .single();
        
      if (error) throw error;
      
      if (data && data.analytics_settings) {
        setAnalyticsSettings(data.analytics_settings);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const handleSave = async () => {
    if (!selectedStoreId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('stores')
        .update({ analytics_settings: analyticsSettings })
        .eq('id', selectedStoreId);
        
      if (error) throw error;
      alert('تم حفظ إعدادات المحرك الرياضي بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setAnalyticsSettings(prev => ({ ...prev, [field]: Number(value) }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={32} color="var(--accent-primary)" />
          إعدادات التحليل الذكي ⚙️
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>تخصيص المحرك الرياضي (Math Engine) لحساب توصيات إعادة الطلب لكل متجر بشكل مستقل.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 className="spin" size={48} color="var(--accent-primary)" />
        </div>
      ) : (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Store Selector */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>اختر المتجر لضبط إعداداته:</label>
            <select 
              className="input-field" 
              style={{ width: '100%', maxWidth: '400px' }}
              value={selectedStoreId} 
              onChange={e => setSelectedStoreId(e.target.value)}
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.store_name} ({s.marketplace})</option>
              ))}
            </select>
          </div>

          {/* Math Engine Form */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={20} />
              معادلة إعادة الطلب (Restock Formula)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)' }}>فترة حساب متوسط المبيعات (أيام)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={analyticsSettings.adsPeriod} 
                  onChange={e => handleChange('adsPeriod', e.target.value)}
                  min="1"
                />
                <small style={{ color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Info size={14} /> بناءً على آخر كم يوم يتم حساب الـ ADS
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)' }}>مدة الشحن - Lead Time (أيام)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={analyticsSettings.leadTime} 
                  onChange={e => handleChange('leadTime', e.target.value)}
                  min="0"
                />
                <small style={{ color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Info size={14} /> وقت التصنيع والشحن حتى وصول المخازن
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)' }}>مخزون الأمان - Safety Stock (أيام)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={analyticsSettings.safetyStock} 
                  onChange={e => handleChange('safetyStock', e.target.value)}
                  min="0"
                />
                <small style={{ color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Info size={14} /> أيام إضافية كحماية ضد التأخير المفاجئ
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: 'var(--text-primary)' }}>الهدف الكلي للمخزون - Target Days (أيام)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={analyticsSettings.targetDays} 
                  onChange={e => handleChange('targetDays', e.target.value)}
                  min="1"
                />
                <small style={{ color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Info size={14} /> لكم يوماً تريد أن يكفيك المخزون بعد وصوله؟
                </small>
              </div>

            </div>

            {/* Formula Preview */}
            <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>ملخص المعادلة التي سيتم تطبيقها:</h4>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', margin: 0, paddingRight: '20px' }}>
                <li><strong>متوسط المبيعات (ADS):</strong> سيتم حسابه بقسمة مبيعات آخر <strong>{analyticsSettings.adsPeriod}</strong> يوماً.</li>
                <li><strong>نقطة إعادة الطلب:</strong> إذا كان المخزون الحالي يكفي لأقل من <strong>{analyticsSettings.leadTime + analyticsSettings.safetyStock}</strong> يوماً.</li>
                <li><strong>الكمية المطلوبة:</strong> سيطلب النظام كمية تكفي لتغطية <strong>{analyticsSettings.targetDays}</strong> يوماً من المبيعات.</li>
              </ul>
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={saving || !selectedStoreId}
            style={{ alignSelf: 'flex-start', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {saving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
            حفظ إعدادات التحليل
          </button>

        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
