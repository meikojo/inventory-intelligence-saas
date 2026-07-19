const SUPABASE_URL = 'https://rirzrcqzullzmqzjdkhj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcnpyY3F6dWxsem1xempka2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mjk2MzYsImV4cCI6MjA5ODUwNTYzNn0.XSY10hw6Lv7QTuVbG9lmj07k45LIRHKgGIvFA6s5aws';

// Fetch dynamic rules when extension starts or installs
chrome.runtime.onInstalled.addListener(() => {
  fetchScrapingRules();
});

chrome.alarms.create('syncRules', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncRules') {
    fetchScrapingRules();
  }
});

async function fetchScrapingRules() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/system_config?key=eq.amazon_scraping_rules&select=value`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (data && data.length > 0) {
      const rules = data[0].value;
      chrome.storage.local.set({ scrapingRules: rules });
      console.log('Dynamic scraping rules updated from SaaS:', rules);
    }
  } catch (err) {
    console.error('Failed to fetch scraping rules:', err);
  }
}
