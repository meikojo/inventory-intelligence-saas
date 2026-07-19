import React, { useState, useEffect } from 'react';
import { Activity, Download, Search, CheckSquare, Loader2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runAdvancedAnalysis } from '../lib/MathEngine';

const AdvancedAnalysis = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [recommendations, setRecommendations] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadAnalysisData();
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }
  };

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Settings
      const { data: storeData } = await supabase.from('stores').select('analytics_settings').eq('id', selectedStore).single();
      const currentSettings = storeData?.analytics_settings || {};
      setSettings(currentSettings);

      // 2. Fetch Sales Data (need all data for proper Bayesian/Decay math)
      const { data: sales } = await supabase
        .from('sales_data')
        .select('*')
        .eq('store_id', selectedStore);

      // 3. Fetch Inventory Data
      const { data: inv } = await supabase
        .from('inventory_data')
        .select('*')
        .eq('store_id', selectedStore);

      if (sales && inv) {
        // Run the V2 Engine
        const results = runAdvancedAnalysis(sales, inv, currentSettings);
        setRecommendations(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEdit = (sku, newQty) => {
    setRecommendations(prev => prev.map(item => 
      item.sku === sku ? { ...item, finalQty: Number(newQty) } : item
    ));
  };

  const toggleInclude = (sku) => {
    setRecommendations(prev => prev.map(item => 
      item.sku === sku ? { ...item, include: !item.include } : item
    ));
  };

  const filteredData = recommendations.filter(item => 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={32} color="var(--accent-primary)" />
            عرض نتائج التحليل
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>توصيات المحرك الرياضي الذكي للشحن</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="input-field" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}</option>)}
          </select>
          <button className="btn-primary" style={{ background: '#374151', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Download size={18} /> تصدير CSV
          </button>
          <button className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Save size={18} /> حفظ الطلبية النهائية
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 className="spin" size={48} color="var(--accent-primary)" />
        </div>
      ) : (
        <div className="glass-card">
          
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <Search size={16} color="var(--accent-primary)" />
                ASIN بحث بالاسم أو
              </label>
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%' }} 
                placeholder="اكتب للبحث السريع..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <Package size={16} color="var(--accent-warning)" />
                حالة الشحن (المخزون)
              </label>
              <select className="input-field" style={{ width: '100%' }}>
                <option>عرض كل المنتجات</option>
                <option>التي تحتاج طلب فقط</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '16px 12px' }}>الحالة والتحذيرات</th>
                  <th style={{ padding: '16px 12px', color: 'var(--accent-success)' }}>الكمية النهائية</th>
                  <th style={{ padding: '16px 12px' }}>تعديل يدوي</th>
                  <th style={{ padding: '16px 12px', color: 'var(--accent-primary)' }}>الكمية المقترحة</th>
                  <th style={{ padding: '16px 12px' }}>الثقة<br/><span style={{ fontSize: '0.7rem' }}>(Confidence)</span></th>
                  <th style={{ padding: '16px 12px' }}>متوسط البيع<br/><span style={{ fontSize: '0.7rem' }}>(المحرك الذكي)</span></th>
                  <th style={{ padding: '16px 12px' }}>المخزون</th>
                  <th style={{ padding: '16px 12px' }}>ASIN / Name</th>
                  <th style={{ padding: '16px 12px' }}>تضمين</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: item.include ? 1 : 0.5 }}>
                      
                      <td style={{ padding: '16px 12px', fontSize: '0.9rem', color: item.needsRestock ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                        {item.status}
                      </td>
                      
                      <td style={{ padding: '16px 12px', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-success)' }}>
                        {item.finalQty > 0 ? `+${item.finalQty}` : '-'}
                      </td>
                      
                      <td style={{ padding: '16px 12px' }}>
                        <input 
                          type="number" 
                          className="input-field" 
                          style={{ width: '70px', padding: '6px' }}
                          value={item.finalQty}
                          onChange={(e) => handleManualEdit(item.sku, e.target.value)}
                        />
                      </td>

                      <td style={{ padding: '16px 12px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {item.suggestedQty}
                      </td>

                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: item.confidence > 70 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                            {item.confidence}%
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{item.ads}</td>
                      
                      <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{item.stock}</td>
                      
                      <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>
                        <a href={`https://www.amazon.com/dp/${item.sku}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                          {item.sku}
                        </a>
                      </td>

                      <td style={{ padding: '16px 12px' }}>
                        <input 
                          type="checkbox" 
                          checked={item.include} 
                          onChange={() => toggleInclude(item.sku)}
                          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                        />
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      لا توجد بيانات مطابقة للفلتر أو للحساب المحدد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalysis;
