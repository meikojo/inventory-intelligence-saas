import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPanel = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={32} color="var(--accent-primary)" />
          الإعدادات ⚙️
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>تخصيص النظام وحدود المخاطر (قريباً)</p>
      </div>

      <div className="glass-card">
        <p style={{ color: 'var(--text-primary)' }}>
          هذه الصفحة قيد التطوير. قريباً ستتمكن من ضبط إعدادات التنبيهات وحدود المخزون.
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;
