import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Package, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';

const Analysis = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [metrics, setMetrics] = useState({ totalSales: 0, totalUnits: 0, lowStockCount: 0 });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchAnalyticsData();
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sales Data
      const { data: sales } = await supabase
        .from('sales_data')
        .select('*')
        .eq('store_id', selectedStore)
        .order('date', { ascending: true });

      // Process sales data for charts (group by date)
      const chartDataMap = {};
      let totalAmount = 0;
      let totalItems = 0;

      if (sales) {
        sales.forEach(row => {
          const d = row.date;
          if (!chartDataMap[d]) chartDataMap[d] = { date: d, المبيعات: 0, الوحدات: 0 };
          chartDataMap[d].المبيعات += Number(row.amount || 0);
          chartDataMap[d].الوحدات += Number(row.units || 0);
          
          totalAmount += Number(row.amount || 0);
          totalItems += Number(row.units || 0);
        });
      }

      setSalesData(Object.values(chartDataMap));

      // 2. Fetch Inventory Data (Low stock threshold: < 10)
      const { data: inv } = await supabase
        .from('inventory_data')
        .select('*')
        .eq('store_id', selectedStore)
        .order('quantity', { ascending: true })
        .limit(10); // get 10 lowest stock items

      let lowCount = 0;
      if (inv) {
        setInventoryData(inv);
        lowCount = inv.filter(i => i.quantity < 10).length;
      }

      setMetrics({
        totalSales: totalAmount,
        totalUnits: totalItems,
        lowStockCount: lowCount
      });

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
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>التحليل الذكي 📊</h2>
          <p style={{ color: 'var(--text-secondary)' }}>مراقبة الأداء والمبيعات وتحليلات المخزون</p>
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
          {/* Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-success)' }}>
                <DollarSign size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>إجمالي المبيعات (أرباح)</p>
                <h3 style={{ fontSize: '2rem', margin: 0 }}>{metrics.totalSales.toFixed(2)}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>الوحدات المباعة</p>
                <h3 style={{ fontSize: '2rem', margin: 0 }}>{metrics.totalUnits}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-danger)' }}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>تنبيهات المخزون (تحت 10)</p>
                <h3 style={{ fontSize: '2rem', margin: 0, color: metrics.lowStockCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {metrics.lowStockCount} منتج
                </h3>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', color: 'var(--text-primary)' }}>تطور المبيعات (Sales Trend)</h3>
              {salesData.length > 0 ? (
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer>
                    <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="المبيعات" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="الوحدات" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  لا توجد بيانات مبيعات لهذا المتجر بعد.
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Table */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="var(--accent-danger)" />
              المنتجات منخفضة المخزون
            </h3>
            {inventoryData.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>SKU</th>
                    <th style={{ padding: '12px' }}>الكمية الحالية</th>
                    <th style={{ padding: '12px' }}>آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.sku}</td>
                      <td style={{ padding: '12px', color: item.quantity < 10 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(item.last_updated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>لا توجد بيانات مخزون حالياً.</p>
            )}
          </div>

        </>
      )}
    </div>
  );
};

export default Analysis;
