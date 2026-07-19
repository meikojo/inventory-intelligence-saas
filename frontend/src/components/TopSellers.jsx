import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Box, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TopSellers = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [metrics, setMetrics] = useState({ revenue: 0, units: 0, activeProducts: 0 });
  const [topSellers, setTopSellers] = useState([]);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadDashboardData();
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: sales } = await supabase
        .from('sales_data')
        .select('*')
        .eq('store_id', selectedStore);
        
      if (!sales) return;

      let totalRevenue = 0;
      let totalUnits = 0;
      const skuMap = {}; // sku -> { units, revenue, daysSet }

      sales.forEach(row => {
        const u = Number(row.units || 0);
        const r = Number(row.amount || 0);
        
        totalUnits += u;
        totalRevenue += r;

        if (!skuMap[row.sku]) {
          skuMap[row.sku] = { sku: row.sku, units: 0, revenue: 0, daysSet: new Set() };
        }
        skuMap[row.sku].units += u;
        skuMap[row.sku].revenue += r;
        skuMap[row.sku].daysSet.add(row.date);
      });

      const activeProducts = Object.keys(skuMap).length;

      const sellersArray = Object.values(skuMap).map(item => ({
        ...item,
        days: item.daysSet.size,
        percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
      }));

      // Sort by Revenue desc
      sellersArray.sort((a, b) => b.revenue - a.revenue);

      setMetrics({ revenue: totalRevenue, units: totalUnits, activeProducts });
      setTopSellers(sellersArray);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={32} color="var(--accent-primary)" />
            لوحة المؤشرات الأداء (Dashboard)
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>أكثر المنتجات مبيعاً وتحقيقاً للأرباح</p>
        </div>
        <select 
          className="input-field" 
          style={{ width: '250px' }}
          value={selectedStore} 
          onChange={(e) => setSelectedStore(e.target.value)}
        >
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.store_name} ({s.marketplace})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 className="spin" size={48} color="var(--accent-primary)" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-success)' }}>
                <DollarSign size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--accent-success)', fontSize: '1rem', fontWeight: 'bold' }}>إجمالي المبيعات (Revenue)</p>
                <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{metrics.revenue.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>EGP</span></h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                <Box size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: 'bold' }}>القطع المباعة (Units)</p>
                <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{metrics.units.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>قطعة</span></h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', padding: '16px', borderRadius: '12px', color: '#8b5cf6' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <p style={{ color: '#8b5cf6', fontSize: '1rem', fontWeight: 'bold' }}>عدد المنتجات النشطة</p>
                <h3 style={{ fontSize: '2.5rem', margin: 0 }}>{metrics.activeProducts} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>منتج</span></h3>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '16px 12px' }}>الترتيب</th>
                    <th style={{ padding: '16px 12px' }}>المنتج / ASIN</th>
                    <th style={{ padding: '16px 12px' }}>القطع المباعة</th>
                    <th style={{ padding: '16px 12px' }}>أيام البيع</th>
                    <th style={{ padding: '16px 12px' }}>إجمالي المبيعات (EGP)</th>
                    <th style={{ padding: '16px 12px' }}>نسبة المبيعات</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellers.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: 'bold', color: 'var(--accent-warning)' }}>#{idx + 1}</td>
                      <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>
                        <a href={`https://www.amazon.com/dp/${item.sku}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                          {item.sku}
                        </a>
                      </td>
                      <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{item.units}</td>
                      <td style={{ padding: '16px 12px', color: '#8b5cf6' }}>{item.days} أيام</td>
                      <td style={{ padding: '16px 12px', color: 'var(--accent-success)', fontWeight: 'bold' }}>{item.revenue.toLocaleString()}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.percentage}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopSellers;
