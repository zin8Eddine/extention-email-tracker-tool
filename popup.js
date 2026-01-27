// Popup script for managing email list and displaying results

let emailList = new Set();

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadEmailList();
  setupTabs();
  setupEventListeners();
  updateEmailListDisplay();
  await refreshResults();
});

// Tab switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      // Update buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update contents
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
        }
      });
    });
  });
}

// Load email list from storage
async function loadEmailList() {
  try {
    const result = await chrome.storage.local.get(['emailList']);
    if (result.emailList && Array.isArray(result.emailList)) {
      emailList = new Set(result.emailList);
    }
  } catch (error) {
    console.error('Error loading email list:', error);
  }
}

// Save email list to storage
async function saveEmailList() {
  try {
    await chrome.storage.local.set({ emailList: Array.from(emailList) });
  } catch (error) {
    console.error('Error saving email list:', error);
  }
}

// Parse emails from input
function parseEmails(input) {
  const emails = input
    .split(/[\n,;]+/)
    .map(email => email.trim().toLowerCase())
    .filter(email => {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return email && emailRegex.test(email);
    });
  return emails;
}

// Setup event listeners
function setupEventListeners() {
  // Add emails button
  document.getElementById('add-emails-btn').addEventListener('click', () => {
    const input = document.getElementById('email-input').value;
    const emails = parseEmails(input);
    
    if (emails.length === 0) {
      alert('Please enter valid email addresses');
      return;
    }
    
    emails.forEach(email => emailList.add(email));
    saveEmailList();
    updateEmailListDisplay();
    document.getElementById('email-input').value = '';
  });

  // Clear list button
  document.getElementById('clear-list-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire email list?')) {
      emailList.clear();
      saveEmailList();
      updateEmailListDisplay();
    }
  });

  // Export list button
  document.getElementById('export-list-btn').addEventListener('click', () => {
    const emails = Array.from(emailList).join('\n');
    navigator.clipboard.writeText(emails).then(() => {
      alert('Email list copied to clipboard!');
    });
  });

  // Helper function to ensure content script is ready
  async function ensureContentScriptReady(tabId, scriptFile) {
    // First, try to ping the content script
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      if (response && response.ready) {
        return true;
      }
    } catch (error) {
      // Content script not loaded, try to inject it
      console.log('Content script not ready, attempting to inject...');
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [scriptFile]
        });
        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      } catch (injectError) {
        console.error('Error injecting script:', injectError);
        throw new Error('Unable to load content script. Please refresh the page and try again.');
      }
    }
    return false;
  }

  // Scan Gmail button
  document.getElementById('scan-gmail-btn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        alert('No active tab found');
        return;
      }
      
      if (tab.url.includes('mail.google.com')) {
        document.getElementById('gmail-status').textContent = 'Preparing to scan...';
        
        // Ensure content script is ready
        await ensureContentScriptReady(tab.id, 'gmail-content.js');
        
        // Send scan message
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'scanGmail' });
          document.getElementById('gmail-status').textContent = 'Scanning in progress...';
          setTimeout(refreshResults, 2000);
        } catch (error) {
          console.error('Error sending scan message:', error);
          document.getElementById('gmail-status').textContent = 'Error: Could not scan. Please try again.';
          alert('Unable to scan Gmail. Please refresh the Gmail page and try again.');
        }
      } else {
        alert('Please open Gmail first');
      }
    } catch (error) {
      console.error('Error scanning Gmail:', error);
      document.getElementById('gmail-status').textContent = 'Error: ' + error.message;
      alert(error.message || 'An error occurred. Please try again.');
    }
  });

  // Refresh Gmail results
  document.getElementById('refresh-gmail-btn').addEventListener('click', refreshResults);

  // Refresh Meet results
  document.getElementById('refresh-meet-btn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        alert('No active tab found');
        return;
      }
      
      if (tab.url.includes('meet.google.com')) {
        document.getElementById('meet-status').textContent = 'Preparing to scan...';
        
        // Ensure content script is ready
        await ensureContentScriptReady(tab.id, 'meet-content.js');
        
        // Send scan message
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'scanMeet' });
          document.getElementById('meet-status').textContent = 'Scanning participants...';
          setTimeout(refreshResults, 2000);
        } catch (error) {
          console.error('Error sending scan message:', error);
          document.getElementById('meet-status').textContent = 'Error: Could not scan. Please try again.';
          alert('Unable to scan Google Meet. Please refresh the Meet page and try again.');
        }
      } else {
        alert('Please open Google Meet first');
      }
    } catch (error) {
      console.error('Error scanning Meet:', error);
      document.getElementById('meet-status').textContent = 'Error: ' + error.message;
      alert(error.message || 'An error occurred. Please try again.');
    }
  });
}

// Update email list display
function updateEmailListDisplay() {
  const container = document.getElementById('email-list-items');
  const count = document.getElementById('email-count');
  
  count.textContent = emailList.size;
  container.innerHTML = '';
  
  if (emailList.size === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No emails in list</p>';
    return;
  }
  
  Array.from(emailList).sort().forEach(email => {
    const item = document.createElement('div');
    item.className = 'email-item';
    item.innerHTML = `
      <span class="email-text">${email}</span>
      <button class="remove-btn" data-email="${email}">Remove</button>
    `;
    
    item.querySelector('.remove-btn').addEventListener('click', () => {
      emailList.delete(email);
      saveEmailList();
      updateEmailListDisplay();
    });
    
    container.appendChild(item);
  });
}

// Refresh results from storage
async function refreshResults() {
  // Refresh Gmail results
  const gmailResults = await chrome.storage.local.get(['gmailResults']);
  if (gmailResults.gmailResults) {
    displayGmailResults(gmailResults.gmailResults);
  }

  // Refresh Meet results
  const meetResults = await chrome.storage.local.get(['meetResults']);
  if (meetResults.meetResults) {
    displayMeetResults(meetResults.meetResults);
  }

  // Update status
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url) {
    if (tab.url.includes('mail.google.com')) {
      document.getElementById('gmail-status').textContent = 'Gmail detected. Ready to scan.';
    } else if (tab.url.includes('meet.google.com')) {
      document.getElementById('meet-status').textContent = 'Google Meet detected. Ready to track.';
    }
  }
}

// Display Gmail results
function displayGmailResults(results) {
  const unknownContainer = document.getElementById('gmail-unknown');
  const missingContainer = document.getElementById('gmail-missing');
  const statusEl = document.getElementById('gmail-status');
  
  // Show label/view that was scanned
  if (statusEl) {
    const labelName = results.labelName || 'Current view';
    statusEl.textContent = `تم الفحص في: ${labelName}`;
  }

  // Unknown emails
  unknownContainer.innerHTML = '';
  if (results.unknown && results.unknown.length > 0) {
    results.unknown.forEach(email => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.textContent = email;
      unknownContainer.appendChild(item);
    });
  }
  
  // Missing emails
  missingContainer.innerHTML = '';
  if (results.missing && results.missing.length > 0) {
    results.missing.forEach(email => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.textContent = email;
      missingContainer.appendChild(item);
    });
  }
}

// Display Meet results
function displayMeetResults(results) {
  const presentContainer = document.getElementById('meet-present');
  const unknownContainer = document.getElementById('meet-unknown');
  
  // Present participants (عناوين المؤسسات الحاضرة)
  presentContainer.innerHTML = '';
  if (results.present && results.present.length > 0) {
    results.present.forEach(email => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.textContent = email;
      presentContainer.appendChild(item);
    });
  }
  
  // Unknown participants (عناوين المؤسسات الغير مؤلوفة)
  unknownContainer.innerHTML = '';
  if (results.unknown && results.unknown.length > 0) {
    results.unknown.forEach(email => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.textContent = email;
      unknownContainer.appendChild(item);
    });
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.emailList) {
      emailList = new Set(changes.emailList.newValue || []);
      updateEmailListDisplay();
    }
    if (changes.gmailResults || changes.meetResults) {
      refreshResults();
    }
  }
});

