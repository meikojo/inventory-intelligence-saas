import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Upload, ChevronRight, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2, Save } from 'lucide-react';

const REQUIRED_FIELDS = {
  sales: [
    { key: 'date', label: 'تاريخ الطلب (Date)' },
    { key: 'sku', label: 'رمز السلعة (SKU)' },
    { key: 'units', label: 'عدد الوحدات (Units)' },
    { key: 'amount', label: 'المبيعات (Amount)' }
  ],
  inventory: [
    { key: 'sku', label: 'رمز السلعة (SKU)' },
    { key: 'quantity', label: 'الكمية المتاحة (Quantity)' }
  ]
};

const ColumnMapper = () => {
  const [stores, setStores] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [step, setStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: storesData } = await supabase.from('stores').select('*');
    if (storesData) setStores(storesData);

    const { data: typesData } = await supabase.from('file_types').select('*');
    if (typesData) setFileTypes(typesData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg('');

    Papa.parse(file, {
      header: true,
      preview: 5, // Read only first 5 lines to get headers quickly
      complete: (results) => {
        if (results.meta.fields && results.meta.fields.length > 0) {
          setCsvHeaders(results.meta.fields);
          setStep(2);
        } else {
          setErrorMsg('لم نتمكن من العثور على أعمدة في هذا الملف. يرجى التأكد من أنه ملف CSV صالح.');
        }
      },
      error: (err) => {
        setErrorMsg('حدث خطأ أثناء قراءة الملف: ' + err.message);
      }
    });
  };

  const handleMappingChange = (systemField, csvColumn) => {
    setMapping(prev => ({ ...prev, [systemField]: csvColumn }));
  };

  const handleSaveTemplate = async () => {
    if (!selectedStore || !selectedFileType) {
      setErrorMsg('يرجى اختيار المتجر ونوع الملف.');
      return;
    }
    if (!templateName) {
      setErrorMsg('يرجى كتابة اسم للقالب.');
      return;
    }

    // Validate that all required fields are mapped
    const required = REQUIRED_FIELDS[fileTypes.find(f => f.id == selectedFileType)?.code || 'sales'];
    for (let field of required) {
      if (!mapping[field.key]) {
        setErrorMsg(`يرجى ربط الحقل الإجباري: ${field.label}`);
        return;
      }
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      const { error } = await supabase.from('column_mapping_templates').insert({
        store_id: selectedStore,
        file_type_id: selectedFileType,
        template_name: templateName,
        mapping: mapping
      });

      if (error) throw error;
      
      setStep(3); // Success step
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', gap: '16px' }}>
      <div style={{ color: step >= 1 ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= 1 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
        الرفع
      </div>
      <ChevronRight color="var(--text-secondary)" size={16} />
      <div style={{ color: step >= 2 ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= 2 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
        الربط
      </div>
      <ChevronRight color="var(--text-secondary)" size={16} />
      <div style={{ color: step >= 3 ? 'var(--accent-success)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= 3 ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
        النجاح
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <FileSpreadsheet size={32} color="var(--accent-primary)" />
          المعالج الذكي لربط الأعمدة
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>تخلص من عشوائية تقارير أمازون. علّم النظام شكل التقرير مرة واحدة فقط!</p>
      </div>

      {renderStepIndicator()}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-danger)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} />
          {errorMsg}
        </div>
      )}

      {step === 1 && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>1. إعدادات القالب</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>اختر المتجر</label>
              <select className="input-field" value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
                <option value="">-- اختر المتجر --</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.store_name} ({s.marketplace})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>نوع التقرير</label>
              <select className="input-field" value={selectedFileType} onChange={e => setSelectedFileType(e.target.value)}>
                <option value="">-- اختر نوع التقرير --</option>
                {fileTypes.map(f => <option key={f.id} value={f.id}>{f.code === 'sales' ? 'تقرير المبيعات (Sales)' : f.code === 'inventory' ? 'تقرير المخزون (Inventory)' : f.code}</option>)}
              </select>
            </div>
          </div>

          <div style={{ border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '16px', padding: '40px', textAlign: 'center', background: 'rgba(59,130,246,0.02)', position: 'relative', overflow: 'hidden' }}>
            <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>ارفع عينة من التقرير (CSV/TXT)</h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>سنقوم فقط بقراءة أول سطر للتعرف على أسماء الأعمدة الموجودة في ملفك.</p>
            
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            
            <button className="btn-primary" style={{ pointerEvents: 'none' }}>تصفح الملفات</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>2. ربط الحقول الإجبارية</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>أمام كل حقل أساسي في نظامنا، اختر العمود الذي يقابله من ملفك الذي رفعته للتو.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {REQUIRED_FIELDS[fileTypes.find(f => f.id == selectedFileType)?.code || 'sales'].map(field => (
              <div key={field.key} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{field.label} <span style={{ color: 'var(--accent-danger)' }}>*</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>الحقل المطلوب في قاعدة البيانات</div>
                </div>
                
                <div style={{ padding: '0 16px', color: 'var(--accent-primary)' }}>
                  <ChevronRight size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <select 
                    className="input-field" 
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    style={{ margin: 0, borderColor: mapping[field.key] ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <option value="">-- تجاهل / غير موجود --</option>
                    {csvHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>اسم القالب الجديد</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="مثال: تقرير مبيعات أمازون السعودية (عربي)" 
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button className="input-field" style={{ width: 'auto', background: 'transparent' }} onClick={() => setStep(1)}>عودة</button>
            <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
              حفظ القالب واعتماده
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
            <CheckCircle size={64} color="var(--accent-success)" />
          </div>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--accent-success)' }}>تم الحفظ بنجاح!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
            تم حفظ القالب **"{templateName}"**. السيرفر الآن سيتعرف تلقائياً على تقاريرك المرفوعة بناءً على هذا القالب وسيستخرج البيانات بدقة متناهية.
          </p>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => {setStep(1); setMapping({}); setCsvHeaders([]); setTemplateName('');}}>
            إنشاء قالب آخر
          </button>
        </div>
      )}

    </div>
  );
};

export default ColumnMapper;
