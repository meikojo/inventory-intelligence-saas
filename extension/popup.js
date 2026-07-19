const SUPABASE_URL = 'https://drqecfankcyfdocrlzle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRycWVjZmFua2N5ZmRvY3JsemxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0ODIyMDEsImV4cCI6MjEwMDA1ODIwMX0.VP9oxLgS-DcKZbB6dCKNAvTDtZbDjIJLZNQUR_RQJZM';

document.addEventListener('DOMContentLoaded', async () => {
  const loginView = document.getElementById('loginView');
  const loggedInView = document.getElementById('loggedInView');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const syncNowBtn = document.getElementById('syncNowBtn');
  const statusMsg = document.getElementById('statusMsg');
  const userEmailDisplay = document.getElementById('userEmail');
  const loginError = document.getElementById('loginError');

  // Check if already logged in
  chrome.storage.local.get(['session'], (result) => {
    if (result.session && result.session.access_token) {
      showLoggedIn(result.session.user.email);
    }
  });

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
      loginError.innerText = 'يرجى إدخال البريد وكلمة المرور';
      return;
    }

    loginBtn.innerText = 'جاري التحقق...';
    loginError.innerText = '';

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.msg || 'بيانات الدخول غير صحيحة');
      }

      // Save session
      chrome.storage.local.set({ session: data }, () => {
        showLoggedIn(data.user.email);
      });

    } catch (err) {
      loginError.innerText = err.message;
    } finally {
      loginBtn.innerText = 'تسجيل الدخول';
    }
  });

  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['session'], () => {
      loginView.style.display = 'block';
      loggedInView.style.display = 'none';
      emailInput.value = '';
      passwordInput.value = '';
      statusMsg.innerText = 'يرجى تسجيل الدخول للبدء';
    });
  });

  syncNowBtn.addEventListener('click', () => {
    statusMsg.innerText = 'جاري إرسال أمر المزامنة للمتصفح...';
    // Send message to background script or content script to start scraping
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.url.includes('sellercentral.amazon')) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'START_SYNC' });
      } else {
        statusMsg.innerText = 'يرجى فتح صفحة Amazon Seller Central أولاً';
      }
    });
  });

  function showLoggedIn(email) {
    loginView.style.display = 'none';
    loggedInView.style.display = 'flex';
    userEmailDisplay.innerText = email;
    statusMsg.innerText = 'متصل وجاهز للمزامنة';
  }
});
