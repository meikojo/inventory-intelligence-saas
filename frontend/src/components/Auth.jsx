import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // We need to create this!
import { PackageSearch, Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import '../index.css';

const Auth = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onLogin(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('تم إرسال رابط التفعيل إلى بريدك الإلكتروني!');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at top right, rgba(224, 138, 46, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(63, 166, 107, 0.05), transparent 40%)'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Aesthetic highlight */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-success))'
        }}></div>

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'rgba(224, 138, 46, 0.1)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--accent-primary)'
          }}>
            <PackageSearch size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            InventorySaaS
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'سجل دخولك لإدارة متاجرك الذكية' : 'أنشئ حساباً جديداً للبدء'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderLeft: '4px solid var(--accent-danger)',
            borderRadius: '0 8px 8px 0',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingRight: '40px' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '48px'
          }} disabled={loading}>
            {loading ? <Loader size={20} className="spin" /> : (
              <>
                {isLogin ? 'دخول' : 'إنشاء حساب'}
                <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: 'none', border: 'none', 
              color: 'var(--accent-primary)', 
              cursor: 'pointer', fontFamily: 'var(--font-arabic)',
              textDecoration: 'underline', textUnderlineOffset: '4px'
            }}
          >
            {isLogin ? 'لا تملك حساباً؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
