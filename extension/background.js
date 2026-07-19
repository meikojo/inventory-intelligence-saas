// background.js: The Maestro (Background Orchestrator)

let syncState = {
  isSyncing: false,
  storeId: null,
  datesToSync: [],
  currentIndex: 0,
  targetTabId: null,
  targetDomain: 'sellercentral.amazon.com'
};

// Generate an array of date strings between start and end (inclusive)
function getDatesArray(startStr, endStr) {
  const dates = [];
  let current = new Date(startStr);
  const end = new Date(endStr);
  
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'START_URL_SYNC') {
    // Extract domain from sender tab
    const urlObj = new URL(sender.tab.url);
    
    syncState = {
      isSyncing: true,
      storeId: request.storeId,
      datesToSync: getDatesArray(request.startDate, request.endDate),
      currentIndex: 0,
      targetTabId: sender.tab.id,
      targetDomain: urlObj.hostname
    };
    
    console.log("Maestro: Starting Sync Loop", syncState);
    navigateNextDate();
    sendResponse({ status: 'started', totalDays: syncState.datesToSync.length });
    return true;
  }
  
  if (request.action === 'GET_SYNC_STATE') {
    sendResponse(syncState);
    return true;
  }
  
  if (request.action === 'DATE_SYNC_SUCCESS') {
    console.log("Maestro: Received success for date", syncState.datesToSync[syncState.currentIndex]);
    syncState.currentIndex++;
    navigateNextDate();
    sendResponse({ status: 'next_queued' });
    return true;
  }
  
  if (request.action === 'STOP_SYNC' || request.action === 'DATE_SYNC_ERROR') {
    console.log("Maestro: Stopping sync due to error or user request.");
    syncState.isSyncing = false;
    sendResponse({ status: 'stopped' });
    return true;
  }
  
});

function navigateNextDate() {
  if (!syncState.isSyncing) return;
  
  if (syncState.currentIndex >= syncState.datesToSync.length) {
    console.log("Maestro: Sync Complete!");
    syncState.isSyncing = false;
    chrome.tabs.sendMessage(syncState.targetTabId, { action: 'SYNC_COMPLETE' });
    return;
  }
  
  const targetDate = syncState.datesToSync[syncState.currentIndex];
  
  // Exact Amazon URL format provided by user
  // Added a dummy query param (forceReload) before the hash to force a hard page reload on SPAs
  const baseUrl = `https://${syncState.targetDomain}/business-reports/?forceReload=${Date.now()}`;
  
  // The hash portion containing the report ID, columns, and date parameters
  const reportHash = `#/report?id=102%3ADetailSalesTrafficBySKU&chartCols=&columns=0%2F1%2F2%2F3%2F6%2F9%2F12%2F15%2F16%2F17%2F18%2F19%2F20&fromDate=${targetDate}&toDate=${targetDate}`;
  
  const newUrl = baseUrl + reportHash;
  
  console.log(`Maestro: Navigating to ${newUrl}`);
  
  chrome.tabs.update(syncState.targetTabId, { url: newUrl });
}
