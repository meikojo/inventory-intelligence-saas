chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_SYNC') {
    startSyncProcess();
  }
});

async function startSyncProcess() {
  console.log("Inventory SaaS Sync: Starting sync process...");
  
  // 1. Get session (auth token)
  const authData = await new Promise((resolve) => {
    chrome.storage.local.get(['session'], resolve);
  });

  if (!authData.session) {
    alert("يرجى تسجيل الدخول في الإضافة أولاً.");
    return;
  }

  // 2. Get Dynamic Rules
  const rulesData = await new Promise((resolve) => {
    chrome.storage.local.get(['scrapingRules'], resolve);
  });

  const rules = rulesData.scrapingRules;
  if (!rules) {
    alert("لم يتم تحميل تعليمات السحب من السيرفر بعد. حاول مجدداً.");
    return;
  }

  console.log("Executing dynamic rules version:", rules.version);
  
  // 3. Execute Rules (The Engine)
  try {
    // A real implementation would parse the JSON instructions (e.g. click selectors, wait times).
    // For now, we simulate finding the table/button based on the JSON configuration.
    const downloadBtn = document.querySelector(rules.selectors.download_btn || '#download-csv-btn');
    
    // Simulate scraping data
    alert(`جاري استخراج البيانات بناءً على التعليمات القادمة من السيرفر (نسخة ${rules.version})...`);
    
    // Fake CSV payload
    const fakeCSV = "Date,Sales,Units\n2023-10-01,150.00,12";
    
    // 4. Send to SaaS Backend
    await sendDataToSaaS(fakeCSV, authData.session.access_token);
    
    alert("✅ تم سحب البيانات ورفعها إلى السيرفر بنجاح!");
  } catch (err) {
    console.error("Sync Error:", err);
    alert("حدث خطأ أثناء المزامنة: " + err.message);
  }
}

async function sendDataToSaaS(csvData, token) {
  const BACKEND_URL = "https://inventory-backend-eosin.vercel.app";
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/ingest_report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        csv_data: csvData,
        marketplace: window.location.hostname
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    console.log("Successfully uploaded to SaaS");
  } catch (err) {
    console.error("Upload failed", err);
    throw err;
  }
}
