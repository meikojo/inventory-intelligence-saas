import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Calendar, Shield, CreditCard, Loader2 } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const getPlanBadge = (plan) => {
    const colors = {
      'free': { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' },
      'pro': { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
      'enterprise': { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }
    };
    const c = colors[plan] || colors['free'];
    
    return (
      <span style={{
        background: c.bg,
        color: c.color,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Loader2 className="spin" size={48} color="var(--accent-primary)" />
      </div>
    );
  }

  if (!profile) return <div>لا يوجد بيانات</div>;

  const createdDate = new Date(profile.created_at).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>الملف الشخصي 👤</h2>
        <p style={{ color: 'var(--text-secondary)' }}>إدارة بيانات حسابك والباقة الحالية</p>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '80px', height: '80px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <User size={40} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {profile.email.split('@')[0]}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Shield size={18} />
              <span>الصلاحية (Role)</span>
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {profile.role === 'admin' ? 'مدير نظام (Admin)' : 'مستخدم (User)'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Calendar size={18} />
              <span>تاريخ الانضمام</span>
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {createdDate}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <CreditCard size={18} />
              <span>خطة الاشتراك</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getPlanBadge(profile.subscription_plan)}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
