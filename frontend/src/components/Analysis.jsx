import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Package, DollarSign, Calendar, Loader2 } from 'lucide-react';

const Analysis = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  
  // KPI state
  const [kpi, setKpi] = useState({ totalSales: 0, totalUnits: 0, topSku: '-' });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchSalesData(selectedStore);
    } else {
      setSalesData([]);
      setKpi({ totalSales: 0, totalUnits: 0, topSku: '-' });
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }
    setLoading(false);
  };

  const fetchSalesData = async (storeId) => {
    setLoading(true);
    // Fetch data from our normalized sales_data table
    const { data, error } = await supabase
      .from('sales_data')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: true });
      
    if (error || !data) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Process data for charts
    // Group by Date for Area Chart
    const dateMap = {};
    const skuMap = {};
    let totalS = 0;
    let totalU = 0;

    data.forEach(row => {
      // Aggregate by Date
      if (!dateMap[row.date]) {
        dateMap[row.date] = { date: row.date, sales: 0, units: 0 };
      }
      dateMap[row.date].sales += Number(row.amount);
      dateMap[row.date].units += Number(row.units);

      // Aggregate by SKU
      if (!skuMap[row.sku]) {
        skuMap[row.sku] = { sku: row.sku, units: 0, sales: 0 };
      }
      skuMap[row.sku].units += Number(row.units);
      skuMap[row.sku].sales += Number(row.amount);

      totalS += Number(row.amount);
      totalU += Number(row.units);
    });

    const chartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Find Top SKU
    let top = '-';
    let maxU = 0;
    Object.values(skuMap).forEach(s => {
      if (s.units > maxU) {
        maxU = s.units;
        top = s.sku;
      }
    });

    setSalesData(chartData);
    setKpi({ totalSales: totalS, totalUnits: totalU, topSku: top });
    setLoading(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(val);
  };

  // Mock data to show beautiful charts if DB is empty
  const mockChartData = [
    { date: '2023-10-01', sales: 4000, units: 24 },
    { date: '2023-10-02', sales: 3000, units: 13 },
    { date: '2023-10-03', sales: 2000, units: 98 },
    { date: '2023-10-04', sales: 2780, units: 39 },
    { date: '2023-10-05', sales: 1890, units: 48 },
    { date: '2023-10-06', sales: 2390, units: 38 },
    { date: '2023-10-07', sales: 3490, units: 43 },
  ];

  const displayData = salesData.length > 0 ? salesData : mockChartData;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>لوحة التحليلات الذكية 📊</h2>
          <p style={{ color: 'var(--text-secondary)' }}>نظرة شاملة على أداء متاجرك ومبيعاتك عبر الزمن</p>
        </div>
        
        <div style={{ minWidth: '250px' }}>
          <select 
            className="input-field" 
            value={selectedStore} 
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{ margin: 0 }}
          >
            <option value="">-- اختر المتجر --</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.store_name} ({s.marketplace})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 className="spin" size={48} color="var(--accent-primary)" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', color: 'var(--accent-primary)' }}>
                <DollarSign size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>إجمالي المبيعات</p>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                  {salesData.length > 0 ? formatCurrency(kpi.totalSales) : formatCurrency(19550)}
                </h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', color: 'var(--accent-success)' }}>
                <Package size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>الوحدات المباعة</p>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                  {salesData.length > 0 ? kpi.totalUnits.toLocaleString() : '303'} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>قطعة</span>
                </h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', color: '#F59E0B' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>المنتج الأكثر مبيعاً</p>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {salesData.length > 0 ? kpi.topSku : 'B08F5G3'}
                </h3>
              </div>
            </div>
          </div>

          {/* Warning if no real data */}
          {salesData.length === 0 && selectedStore && (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#F59E0B' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>لا توجد بيانات مسجلة لهذا المتجر!</strong>
              البيانات المعروضة بالأسفل هي "بيانات تجريبية" لتوضيح شكل اللوحة فقط. قم برفع تقرير من أمازون في قسم (رفع البيانات) لترى الأرقام الحقيقية.
            </div>
          )}

          {/* Charts Area */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--accent-primary)" />
              المبيعات اليومية
            </h3>
            
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer>
                <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="sales" name="المبيعات (EGP)" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analysis;
