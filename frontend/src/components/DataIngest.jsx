import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Calendar, Package, FileSpreadsheet, AlertCircle, Loader2, Database, Play } from 'lucide-react';
import Papa from 'papaparse'; // Assume we will use it for processing later

const DataIngest = () => {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'inventory'
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Scraper states
  const [scrapeStartDate, setScrapeStartDate] = useState('');
  const [scrapeEndDate, setScrapeEndDate] = useState('');

  useEffect(() => {
    fetchStores();
    // Default date to today
    setReportDate(new Date().toISOString().split('T')[0]);
    
    // Set default dates for scraper (last 7 days)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    setScrapeEndDate(today.toISOString().split('T')[0]);
    setScrapeStartDate(lastWeek.toISOString().split('T')[0]);
  }, []);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*');
    if (data) {
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerScraper = () => {
    if (!selectedStore) {
      alert("الرجاء اختيار المتجر أولاً!");
      return;
    }
    
    const store = stores.find(s => s.id === selectedStore);
    if (!store) return;

    let domain = "sellercentral.amazon.com";
    if (store.marketplace === "AE") domain = "sellercentral.amazon.ae";
    if (store.marketplace === "SA") domain = "sellercentral.amazon.sa";
    if (store.marketplace === "EG") domain = "sellercentral.amazon.eg";
    if (store.marketplace === "UK") domain = "sellercentral.amazon.co.uk";
    
    const magicUrl = `https://${domain}/business-reports/?saas_auto_sync=true&storeId=${selectedStore}&startDate=${scrapeStartDate}&endDate=${scrapeEndDate}`;
    window.open(magicUrl, '_blank');
  };

  const handleUpload = async () => {
    if (!selectedStore) {
      setMessage({ type: 'error', text: 'يرجى اختيار المتجر أولاً' });
      return;
    }
    if (!file) {
      setMessage({ type: 'error', text: 'يرجى اختيار ملف CSV' });
      return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('store_id', selectedStore);
      if (activeTab === 'sales') {
        formData.append('fallback_date', reportDate);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const endpoint = activeTab === 'sales' ? '/api/ingest/sales' : '/api/ingest/inventory';
      const apiUrl = import.meta.env.VITE_API_URL || 'https://inventory-intelligence-saas-api.vercel.app';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'حدث خطأ أثناء معالجة الملف');
      }

      setMessage({ type: 'success', text: result.message || 'تم معالجة الملف بنجاح!' });
      setFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={32} color="var(--accent-primary)" />
          رفع التقارير والبيانات
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>اختر نوع التقرير (مبيعات أو مخزون) لرفعه للمتجر المحدد</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => { setActiveTab('sales'); setMessage(null); }}
          style={{
            flex: 1, padding: '16px', borderRadius: '12px', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-arabic)',
            background: activeTab === 'sales' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'sales' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'sales' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <Calendar size={20} /> مبيعات يومية
        </button>
        <button 
          onClick={() => { setActiveTab('inventory'); setMessage(null); }}
          style={{
            flex: 1, padding: '16px', borderRadius: '12px', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-arabic)',
            background: activeTab === 'inventory' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'inventory' ? 'var(--accent-success)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'inventory' ? '2px solid var(--accent-success)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <Package size={20} /> حالة المخزون
        </button>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>المتجر الهدف</label>
          <select className="input-field" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            <option value="">-- اختر المتجر --</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.store_name} ({s.marketplace})</option>
            ))}
          </select>
        </div>

        {activeTab === 'sales' && (
          <div className="glass-card" style={{ marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={20} />
              السحب الآلي للمبيعات (Scraper)
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              سيتم فتح متصفح أمازون وستقوم الإضافة (Extension) بسحب الأيام المحددة أوتوماتيكياً. يرجى التأكد من تسجيل الدخول في أمازون مسبقاً.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>من تاريخ (From)</label>
                <input type="date" className="input-field" style={{ width: '100%' }} value={scrapeStartDate} onChange={e => setScrapeStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>إلى تاريخ (To)</label>
                <input type="date" className="input-field" style={{ width: '100%' }} value={scrapeEndDate} onChange={e => setScrapeEndDate(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary" onClick={triggerScraper} disabled={!selectedStore || !scrapeStartDate || !scrapeEndDate} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}>
              <Play size={20} /> بدء السحب الآلي
            </button>
          </div>
        )}

        {activeTab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>تاريخ التقرير (يدوي)</label>
            <input type="date" className="input-field" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ملف التقرير (CSV)</label>
          <div style={{
            border: '2px dashed var(--border)',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            position: 'relative',
            background: 'rgba(255,255,255,0.01)',
            cursor: 'pointer'
          }}>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer'
              }}
            />
            {file ? (
              <div style={{ color: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={32} />
                <span style={{ fontWeight: 'bold' }}>{file.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={32} />
                <span>اضغط هنا لاختيار ملف CSV أو قم بسحبه وإفلاته</span>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderRight: `4px solid ${message.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)'}`,
            borderRadius: '8px',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} color={message.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)'} />
            {message.text}
          </div>
        )}

        <button 
          className="btn-primary" 
          onClick={handleUpload}
          disabled={loading || !file}
          style={{ height: '54px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading ? <Loader2 className="spin" size={24} /> : (
            <>
              <Upload size={20} />
              {activeTab === 'sales' ? 'رفع المبيعات' : 'تحديث المخزون'}
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default DataIngest;
