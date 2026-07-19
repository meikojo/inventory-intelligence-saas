import React, { useState, useEffect } from 'react';
import { Store, Plus, Trash2, Edit } from 'lucide-react';

const StoresManager = () => {
  const [stores, setStores] = useState([
    { id: '1', name: 'متجر الملابس', marketplace: 'amazon.eg', currency: 'EGP' },
    { id: '2', name: 'ICE Store', marketplace: 'amazon.eg', currency: 'EGP' },
  ]); // Mock data for now until Supabase is connected
  
  const [isAdding, setIsAdding] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  const handleAddStore = (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    
    const newStore = {
      id: Date.now().toString(),
      name: newStoreName,
      marketplace: 'amazon.eg',
      currency: 'EGP'
    };
    
    setStores([...stores, newStore]);
    setNewStoreName('');
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    setStores(stores.filter(s => s.id !== id));
  };

  return (
    <div className="stores-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store className="text-accent-primary" size={28} style={{ color: 'var(--accent-primary)' }}/> 
            إدارة المتاجر
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>قم بإدارة حسابات أمازون الخاصة بك من هنا.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(!isAdding)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Plus size={18} /> متجر جديد
        </button>
      </div>

      {isAdding && (
        <div className="glass-card" style={{ marginBottom: '24px', borderColor: 'var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '16px' }}>إضافة متجر جديد</h3>
          <form onSubmit={handleAddStore} style={{ display: 'flex', gap: '16px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="اسم المتجر (مثال: متجر الإلكترونيات)" 
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary">حفظ</button>
            <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>إلغاء</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {stores.map(store => (
          <div key={store.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{store.name}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ padding: '6px', border: 'none' }} title="تعديل">
                  <Edit size={16} />
                </button>
                <button className="btn-secondary" style={{ padding: '6px', border: 'none', color: 'var(--accent-danger)' }} onClick={() => handleDelete(store.id)} title="حذف">
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
                <span>العملة:</span>
                <span className="en-text">{store.currency}</span>
              </div>
            </div>
            
            <button className="btn-secondary" style={{ marginTop: 'auto', width: '100%', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>
              اختيار هذا المتجر
            </button>
          </div>
        ))}

        {stores.length === 0 && !isAdding && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <Store size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p>لا توجد متاجر مضافة بعد. ابدأ بإضافة متجرك الأول.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoresManager;
