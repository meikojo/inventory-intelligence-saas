// background.js: The Maestro (Background Orchestrator)

let syncState = {
  isSyncing: false,
  storeId: null,
  datesToSync: [],
  currentIndex: 0,
  targetTabId: null
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
    syncState = {
      isSyncing: true,
      storeId: request.storeId,
      datesToSync: getDatesArray(request.startDate, request.endDate),
      currentIndex: 0,
      targetTabId: sender.tab.id
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
  
  // Create Amazon URL with URL Parameters
  // Note: the exact URL parameters can be adjusted later by the user if Amazon changes them
  const baseUrl = "https://sellercentral.amazon.com/business-reports"; // Assuming generic business reports URL
  const newUrl = `${baseUrl}?fromDate=${targetDate}&toDate=${targetDate}`;
  
  console.log(`Maestro: Navigating to ${newUrl}`);
  
  chrome.tabs.update(syncState.targetTabId, { url: newUrl });
}
