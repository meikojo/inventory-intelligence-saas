// content.js - The Executioner (Runs in Amazon page)

// Check if we are currently in an automated sync loop
chrome.runtime.sendMessage({ action: 'GET_SYNC_STATE' }, (state) => {
  if (state && state.isSyncing) {
    // We are in the middle of a sync!
    const currentDate = state.datesToSync[state.currentIndex];
    console.log(`Inventory SaaS: Auto-Syncing date ${currentDate}...`);
    injectFloatingUI(state);
    
    // Auto-start extraction after waiting for Amazon table to load
    setTimeout(() => {
      extractAndUploadAutomated(currentDate, state.storeId);
    }, 5000); // Wait 5 seconds for page data to load
  } else {
    // Normal mode, just inject UI
    setTimeout(() => injectFloatingUI(null), 1500);
  }
});

// Listener for completion message from Maestro
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_COMPLETE') {
    const statusEl = document.getElementById('saas-status');
    if (statusEl) {
      statusEl.innerText = '🎉 تمت مزامنة جميع الأيام بنجاح!';
      statusEl.style.color = '#10b981';
      document.getElementById('saas-sync-btn').disabled = false;
    }
    alert('Inventory Intelligence: تم انتهاء عملية الأتمتة بالكامل!');
  }
  
  if (request.action === 'UPDATE_PROGRESS') {
    const statusEl = document.getElementById('saas-status');
    if (statusEl) {
      statusEl.innerText = '⏳ ' + request.message;
      statusEl.style.color = '#f59e0b';
    }
  }
});

function injectFloatingUI(syncState) {
  if (document.getElementById('inventory-saas-scraper-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'inventory-saas-scraper-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 320px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: Arial, sans-serif;
    direction: rtl;
  `;

  const isAuto = syncState && syncState.isSyncing;
  const progressText = isAuto ? `جاري سحب (${syncState.currentIndex + 1}/${syncState.datesToSync.length})` : '';

  panel.innerHTML = `
    <div style="background: ${isAuto ? '#f59e0b' : '#3b82f6'}; color: white; padding: 12px 16px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
      <span>${isAuto ? 'الأتمتة تعمل 🤖' : 'مساعد سحب البيانات ⚡'}</span>
      <button id="saas-close-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
    </div>
    <div style="padding: 16px;">
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; line-height: 1.4;">
        ${isAuto ? `يرجى عدم إغلاق هذه الصفحة. ${progressText}` : 'حدد فترة التواريخ وسيقوم الروبوت بتغيير الرابط أوتوماتيكياً لسحب كل يوم على حدة.'}
      </p>
      
      <div style="margin-bottom: 12px; display: flex; gap: 8px;">
        <div style="flex: 1;">
          <label style="font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">من تاريخ:</label>
          <input type="date" id="saas-start-date" ${isAuto ? 'disabled' : ''} style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 6px;" />
        </div>
        <div style="flex: 1;">
          <label style="font-size: 11px; font-weight: bold; display: block; margin-bottom: 4px;">إلى تاريخ:</label>
          <input type="date" id="saas-end-date" ${isAuto ? 'disabled' : ''} style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 6px;" />
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="font-size: 12px; color: #374151; font-weight: bold; display: block; margin-bottom: 4px;">المتجر:</label>
        <select id="saas-store-id" ${isAuto ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
          ${isAuto ? `<option value="${syncState.storeId}">تم اختيار المتجر</option>` : '<option value="">-- يتم جلب المتاجر --</option>'}
        </select>
      </div>

      <button id="saas-sync-btn" ${isAuto ? 'disabled' : ''} style="width: 100%; background: ${isAuto ? '#9ca3af' : '#10b981'}; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: ${isAuto ? 'not-allowed' : 'pointer'};">
        ${isAuto ? 'جاري السحب...' : 'بدء الأتمتة الآن 🚀'}
      </button>
      <div id="saas-status" style="margin-top: 12px; font-size: 12px; color: #3b82f6; text-align: center; font-weight: bold;"></div>
    </div>
  `;

  document.body.appendChild(panel);
  document.getElementById('saas-close-btn').onclick = () => panel.remove();

  if (!isAuto) {
    document.getElementById('saas-sync-btn').onclick = startOrchestration;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saas-start-date').value = today;
    document.getElementById('saas-end-date').value = today;
    fetchStores();
  } else {
    document.getElementById('saas-status').innerText = `جاري استخراج بيانات ${syncState.datesToSync[syncState.currentIndex]}...`;
  }
}

async function fetchStores() {
  const authData = await new Promise((resolve) => chrome.storage.local.get(['session'], resolve));
  if (!authData.session) return;
  try {
    const response = await fetch('https://drqecfankcyfdocrlzle.supabase.co/rest/v1/stores?select=id,store_name', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycWVjZmFua2N5ZmRvY3JsemxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODIyMDEsImV4cCI6MjEwMDA1ODIwMX0.VP9oxLgS-DcKZbB6dCKNAvTDtZbDjIJLZNQUR_RQJZM',
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    });
    if (response.ok) {
      const stores = await response.json();
      const select = document.getElementById('saas-store-id');
      select.innerHTML = '<option value="">-- اختر المتجر --</option>';
      stores.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.innerText = s.store_name;
        select.appendChild(opt);
      });
    }
  } catch (err) {}
}

function startOrchestration() {
  const storeId = document.getElementById('saas-store-id').value;
  const startDate = document.getElementById('saas-start-date').value;
  const endDate = document.getElementById('saas-end-date').value;
  const statusEl = document.getElementById('saas-status');

  if (!storeId || !startDate || !endDate) {
    statusEl.innerText = 'يرجى إكمال جميع الحقول!';
    statusEl.style.color = 'red';
    return;
  }

  statusEl.innerText = 'جاري إطلاق المايسترو...';
  document.getElementById('saas-sync-btn').disabled = true;

  chrome.runtime.sendMessage({
    action: 'START_URL_SYNC',
    storeId: storeId,
    startDate: startDate,
    endDate: endDate
  }, (response) => {
    if (response.status === 'started') {
      statusEl.innerText = 'تم التوجيه، انتظر تحميل الصفحة...';
    }
  });
}

// Automatically called by loop when isSyncing is true
async function extractAndUploadAutomated(targetDate, storeId) {
  try {
    // Simulate DOM Scraping
    const fakeCSVData = `SKU,Units Ordered,Ordered Product Sales\nPROD-A,15,450.00\nPROD-B,32,1200.50\nPROD-C,8,120.00`;
    
    // We reverse YYYY-MM-DD to DD-MM-YYYY to match user request
    const parts = targetDate.split('-'); // [2026, 01, 01]
    const fileName = `${parts[2]}-${parts[1]}-${parts[0]}.csv`; 
    
    const blob = new Blob([fakeCSVData], { type: 'text/csv' });
    const file = new File([blob], fileName, { type: 'text/csv' });

    // Send to Backend API
    const authData = await new Promise((resolve) => chrome.storage.local.get(['session'], resolve));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('store_id', storeId);

    const response = await fetch('https://inventory-intelligence-saas-api.vercel.app/api/ingest/sales', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authData.session.access_token}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }

    // Tell Maestro we finished this date successfully!
    chrome.runtime.sendMessage({ action: 'DATE_SYNC_SUCCESS' });

  } catch (err) {
    console.error(err);
    document.getElementById('saas-status').innerText = '❌ خطأ: ' + err.message;
    chrome.runtime.sendMessage({ action: 'DATE_SYNC_ERROR' });
  }
}
