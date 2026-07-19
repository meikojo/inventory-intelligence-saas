const SUPABASE_URL = 'https://drqecfankcyfdocrlzle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycWVjZmFua2N5ZmRvY3JsemxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODIyMDEsImV4cCI6MjEwMDA1ODIwMX0.VP9oxLgS-DcKZbB6dCKNAvTDtZbDjIJLZNQUR_RQJZM';

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
