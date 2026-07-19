import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Info, Activity, Shield, Package, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SettingsPanel = () => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Advanced Math Engine Settings (V2)
  const [analyticsSettings, setAnalyticsSettings] = useState({
    adsPeriod: 30, // For simple average fallback
    // Forecasting
    outlierSensitivity: 'Medium',
    recencyLambda: 0.5,
    useWeightedRecency: true,
    useBayesianShrinkage: true,
    // Risk Controls
    totalBudget: 100000,
    maxBudgetPerSku: 20000,
    highPriceThreshold: 1000,
    // Supply & Coverage
    leadTime: 2,
    targetDays: 7,
    safetyStock: 0,
    // Minimum Quantities
    useTestQty: true,
    testPriceThreshold: 300,
    minQtyLow: 6,
    minQtyHigh: 3
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
      const { data, error } = await supabase.from('stores').select('analytics_settings').eq('id', storeId).single();
      if (error) throw error;
      
      if (data && data.analytics_settings) {
        // Merge with defaults to ensure new V2 fields exist
        setAnalyticsSettings(prev => ({ ...prev, ...data.analytics_settings }));
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
      alert('تم حفظ إعدادات التحليل المتقدمة بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value, type = 'number') => {
    let finalValue = value;
    if (type === 'number') finalValue = Number(value);
    if (type === 'boolean') finalValue = Boolean(value);
    setAnalyticsSettings(prev => ({ ...prev, [field]: finalValue }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={32} color="var(--accent-primary)" />
            إعدادات التحليل ⚙️
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>ضبط معاملات التنبؤ وإدارة المخاطر (V2 Engine)</p>
        </div>
        <div>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={saving || !selectedStoreId}
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {saving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
            حفظ الإعدادات
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 className="spin" size={48} color="var(--accent-primary)" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Store Selector */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>تطبيق الإعدادات على المتجر:</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Section 1: Forecasting */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <Activity size={20} />
                التنبؤ — Forecasting
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Outlier Sensitivity (IQR)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>تحديد مدى تجاهل القفزات غير الطبيعية</span>
                  <select className="input-field" style={{ width: '100%' }} value={analyticsSettings.outlierSensitivity} onChange={e => handleChange('outlierSensitivity', e.target.value, 'text')}>
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Recency Lambda (decay)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>وزن المبيعات الحديثة</span>
                  <input type="number" step="0.1" className="input-field" style={{ width: '100%' }} value={analyticsSettings.recencyLambda} onChange={e => handleChange('recencyLambda', e.target.value)} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', marginTop: '8px' }}>
                  <input type="checkbox" checked={analyticsSettings.useWeightedRecency} onChange={e => handleChange('useWeightedRecency', e.target.checked, 'boolean')} style={{ transform: 'scale(1.2)' }} />
                  Use Weighted Recency
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={analyticsSettings.useBayesianShrinkage} onChange={e => handleChange('useBayesianShrinkage', e.target.checked, 'boolean')} style={{ transform: 'scale(1.2)' }} />
                  Use Bayesian Shrinkage
                </label>
              </div>
            </div>

            {/* Section 2: Risk Controls */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <Shield size={20} />
                التحكم في المخاطر — Risk
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Total Budget (EGP)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>التحكم في حجم المخاطرة الكلي</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.totalBudget} onChange={e => handleChange('totalBudget', e.target.value)} />
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Max Per SKU (EGP)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>أقصى مبلغ مسموح استثماره بمنتج واحد</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.maxBudgetPerSku} onChange={e => handleChange('maxBudgetPerSku', e.target.value)} />
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>High Price Threshold (EGP)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>أي منتج أعلى من هذا السعر يعتبر عالي المخاطرة</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.highPriceThreshold} onChange={e => handleChange('highPriceThreshold', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 3: Supply & Coverage */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <TrendingUp size={20} />
                مهلة التوريد والتغطية
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Supplier Lead Time (days)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>وقت التوريد من المورد بالأيام</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.leadTime} onChange={e => handleChange('leadTime', e.target.value)} />
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Target Coverage Days</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>عدد الأيام التي يجب أن يغطيها المخزون</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.targetDays} onChange={e => handleChange('targetDays', e.target.value)} />
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Safety Stock Days</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>مخزون أمان إضافي لتفادي نفاذ المخزون</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.safetyStock} onChange={e => handleChange('safetyStock', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 4: Minimum Quantities */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <Package size={20} />
                الحدود الدنيا للتيست — Min Qty
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={analyticsSettings.useTestQty} onChange={e => handleChange('useTestQty', e.target.checked, 'boolean')} style={{ transform: 'scale(1.2)' }} />
                  تفعيل فرض حد أدنى للمنتجات الجديدة
                </label>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Test Price Threshold (EGP)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>الحد الفاصل لسعر منتجات التيست</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.testPriceThreshold} onChange={e => handleChange('testPriceThreshold', e.target.value)} />
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Min Qty (Low Price)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>أقل كمية للمنتجات الرخيصة</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.minQtyLow} onChange={e => handleChange('minQtyLow', e.target.value)} />
                </div>

                <div>
                  <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Min Qty (High Price)</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>أقل كمية للمنتجات مرتفعة السعر</span>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={analyticsSettings.minQtyHigh} onChange={e => handleChange('minQtyHigh', e.target.value)} />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
