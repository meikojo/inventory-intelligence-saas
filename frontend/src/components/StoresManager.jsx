import React, { useState, useEffect } from 'react';
import { Store, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const StoresManager = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newMarketplace, setNewMarketplace] = useState('amazon.eg');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يرجى تسجيل الدخول");

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('stores')
        .insert([
          { 
            store_name: newStoreName, 
            marketplace: newMarketplace, 
            currency: newMarketplace === 'amazon.eg' ? 'EGP' : newMarketplace === 'amazon.sa' ? 'SAR' : 'AED',
            user_id: user.id
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') throw new Error("يوجد متجر بنفس الاسم مسبقاً");
        throw error;
      }

      setStores([...data, ...stores]);
      setNewStoreName('');
      setIsAdding(false);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المتجر؟')) return;
    
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStores(stores.filter(s => s.id !== id));
    } catch (err) {
      alert("حدث خطأ أثناء الحذف: " + err.message);
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
    <div className="stores-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={28} style={{ color: 'var(--accent-primary)' }}/> 
            إدارة المتاجر
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>قم بإدارة حسابات أمازون الخاصة بك من هنا.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(!isAdding)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Plus size={18} /> إضافة متجر
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', borderRadius: '8px', borderLeft: '4px solid var(--accent-danger)' }}>
          {error}
        </div>
      )}

      {isAdding && (
        <div className="glass-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>متجر جديد</h3>
          <form onSubmit={handleAddStore} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="input-field" 
              style={{ flex: 2, minWidth: '200px' }}
              placeholder="اسم المتجر (مثال: متجر الإلكترونيات)" 
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              required
              autoFocus
            />
            <select 
              className="input-field"
              style={{ flex: 1, minWidth: '150px' }}
              value={newMarketplace}
              onChange={(e) => setNewMarketplace(e.target.value)}
            >
              <option value="amazon.eg">أمازون مصر (EGP)</option>
              <option value="amazon.sa">أمازون السعودية (SAR)</option>
              <option value="amazon.ae">أمازون الإمارات (AED)</option>
            </select>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : 'حفظ المتجر'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>إلغاء</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {stores.map(store => (
          <div key={store.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{store.store_name}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ padding: '6px', border: 'none', color: 'var(--accent-danger)' }} onClick={(e) => { e.stopPropagation(); handleDelete(store.id); }} title="حذف المتجر">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>السوق:</span>
                <span className="en-text">{store.marketplace}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>العملة الافتراضية:</span>
                <span className="en-text">{store.currency}</span>
              </div>
            </div>
            
            <button className="btn-secondary" style={{ marginTop: 'auto', width: '100%', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>
              إدارة بيانات المتجر
            </button>
          </div>
        ))}

        {stores.length === 0 && !isAdding && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
            <Store size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p style={{ fontSize: '1.1rem' }}>لا توجد متاجر مضافة بعد.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>ابدأ بإضافة متجرك الأول لتبدأ في تحليل بيانات المخزون.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoresManager;
