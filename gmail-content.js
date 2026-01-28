// Gmail content script for scanning labels and extracting emails

let isScanning = false;
let extractedEmails = new Set();
let isReady = false;

// Helper: detect current Gmail label/view from URL hash
function getCurrentLabelName() {
  try {
    const hash = window.location.hash || '';
    const decoded = decodeURIComponent(hash);
    const lower = decoded.toLowerCase();

    // System folders
    if (lower.includes('#inbox')) return 'Inbox';
    if (lower.includes('#starred')) return 'Starred';
    if (lower.includes('#sent')) return 'Sent';
    if (lower.includes('#drafts')) return 'Drafts';
    if (lower.includes('#trash')) return 'Trash';
    if (lower.includes('#spam')) return 'Spam';
    if (lower.includes('#all')) return 'All Mail';
    if (lower.includes('#important')) return 'Important';

    // Category labels: #category/<name>
    if (lower.includes('#category/')) {
      const after = decoded.split('#category/')[1] || '';
      const name = after.split(/[/?]/)[0]; // stop at / or ?
      return name || 'Category';
    }

    // User labels: #label/<name>
    if (lower.includes('#label/')) {
      const after = decoded.split('#label/')[1] || '';
      const name = after.split(/[/?]/)[0]; // stop at / or ?
      return name || 'Label';
    }

    return 'Current view';
  } catch (e) {
    console.warn('Error detecting label name:', e);
    return 'Current view';
  }
}

// Mark as ready when script loads
isReady = true;
console.log('Gmail content script loaded and ready');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanGmail') {
    scanGmailLabels().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error in scanGmailLabels:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'ping') {
    // Respond to ping to check if script is loaded
    sendResponse({ ready: isReady });
    return true;
  }
  return true;
});

// Extract email addresses from text
function extractEmailsFromText(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  return matches.map(email => email.toLowerCase().trim()).filter(email => {
    // Filter out common system emails and invalid patterns
    const systemEmails = [
      'noreply',
      'no-reply',
      'donotreply',
      'mailer-daemon',
      'postmaster',
      'automated'
    ];
    const domain = email.split('@')[1] || '';
    return email && 
           !systemEmails.some(sys => email.includes(sys)) &&
           domain.length > 0 &&
           !email.includes('example.com') &&
           !email.includes('test.com');
  });
}

// Scan Gmail labels/folders
async function scanGmailLabels() {
  if (isScanning) {
    console.log('Gmail scan already in progress');
    return;
  }

  isScanning = true;
  extractedEmails.clear();

  try {
    // Get stored email list
    const result = await chrome.storage.local.get(['emailList']);
    console.log('result', result);

    const storedEmailList = new Set((result.emailList || []).map(e => e.toLowerCase()));
    console.log("storedEmailList", storedEmailList);

    // Wait for Gmail to load
    await waitForGmail();

    // Extract sender emails only from the visible message list in the current label
    // Structure we target (simplified):
    // table > tbody > tr > td.yX ... > div.afn > span.bA4 > span.yP[email][data-hovercard-id]
    const main = document.querySelector('[role="main"]');
    if (main) {
      const rows = main.querySelectorAll('table tbody tr');
      console.log('Found rows in current label view:', rows.length);

      rows.forEach(row => {
        const senderSpan = row.querySelector('div.afn span.bA4 span.yP[email][data-hovercard-id]');
        if (senderSpan) {
          const email = senderSpan.getAttribute('email') || senderSpan.getAttribute('data-hovercard-id');
          if (email) {
            const normalized = email.toLowerCase().trim();
            if (normalized && normalized.includes('@')) {
              extractedEmails.add(normalized);
            }
          }
        }
      });
    }

    console.log(`Found ${extractedEmails.size} unique sender emails in this label`);

    // Ensure all extracted emails are normalized (already done, but double-check)
    const normalizedExtracted = new Set();
    extractedEmails.forEach(email => {
      const normalized = (email || '').toLowerCase().trim();
      if (normalized && normalized.includes('@')) {
        normalizedExtracted.add(normalized);
      }
    });

    // Compare with stored list
    // present = emails that are BOTH in stored list AND in Gmail (sent)
    const present = Array.from(storedEmailList).filter(email =>
      normalizedExtracted.has(email)
    );

    // missing = emails in stored list that are NOT found in Gmail
    const missing = Array.from(storedEmailList).filter(email =>
      !normalizedExtracted.has(email)
    );

    // unknown = emails found in Gmail that are NOT in the stored list
    const unknown = Array.from(normalizedExtracted).filter(email =>
      !storedEmailList.has(email)
    );

    // Debug logging
    console.log('=== Gmail Scan Results ===');
    console.log('Stored email list size:', storedEmailList.size);
    console.log('Stored emails:', Array.from(storedEmailList));
    console.log('Extracted emails from Gmail size:', normalizedExtracted.size);
    console.log('Extracted emails:', Array.from(normalizedExtracted));
    console.log('PRESENT emails (in list AND in Gmail):', present);
    console.log('MISSING emails (in list but NOT in Gmail):', missing);
    console.log('UNKNOWN emails (in Gmail but NOT in list):', unknown);

    // Save results
    const results = {
      present: present,
      missing: missing,
      unknown: unknown,
      totalScanned: extractedEmails.size,
      timestamp: new Date().toISOString(),
      labelName: getCurrentLabelName()
    };

    await chrome.runtime.sendMessage({
      action: 'saveGmailResults',
      results: results
    });

    console.log('Gmail scan complete:', results);
    
    // Show notification
    showNotification(`Scanned ${extractedEmails.size} emails. Found ${unknown.length} unknown, ${missing.length} missing.`);

  } catch (error) {
    console.error('Error scanning Gmail:', error);
    showNotification('Error scanning Gmail. Please try again.');
  } finally {
    isScanning = false;
  }
}

// Wait for Gmail to be ready
function waitForGmail() {
  return new Promise((resolve) => {
    if (document.querySelector('[role="main"]')) {
      resolve();
      return;
    }
    
    const observer = new MutationObserver(() => {
      if (document.querySelector('[role="main"]')) {
        observer.disconnect();
        resolve();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 5000);
  });
}

// Show notification
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 3000);
}

// Manual scanning only: scans run when triggered from the popup

