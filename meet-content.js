// Google Meet content script for tracking participants

let isScanning = false;
let participantEmails = new Set();
let isReady = false;

// Mark as ready when script loads
isReady = true;
console.log('Meet content script loaded and ready');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanMeet') {
    scanMeetParticipants().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error in scanMeetParticipants:', error);
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

// Extract email from participant name/display
function extractEmailFromParticipant(element) {
  // Try to find email in various places
  const text = element.textContent || '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  if (match) {
    return match[0].toLowerCase().trim();
  }
  
  // Try data attributes
  const emailAttr = element.getAttribute('data-email') || 
                   element.getAttribute('data-participant-email') ||
                   element.getAttribute('aria-label');
  if (emailAttr) {
    const emailMatch = emailAttr.match(emailRegex);
    if (emailMatch) {
      return emailMatch[0].toLowerCase().trim();
    }
  }
  
  return null;
}

// Scan Google Meet participants
async function scanMeetParticipants() {
  if (isScanning) {
    console.log('Meet scan already in progress');
    return;
  }

  isScanning = true;
  participantEmails.clear();

  try {
    // Get stored email list
    const result = await chrome.storage.local.get(['emailList']);
    const storedEmailList = new Set((result.emailList || []).map(e => e.toLowerCase()));

    // Wait for Meet to load
    await waitForMeet();

    // Try multiple selectors for participant elements
    const participantSelectors = [
      '[data-participant-id]',
      '[jsname]', // Google Meet uses jsname for many elements
      '[data-self-name]',
      '[aria-label*="@"]',
      'div[role="listitem"]',
      '.participant',
      '[data-participant-email]'
    ];

    let participants = [];
    for (const selector of participantSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        participants = Array.from(elements);
        console.log(`Found ${participants.length} participants using selector: ${selector}`);
        break;
      }
    }

    // If no specific participants found, try to extract from page text
    if (participants.length === 0) {
      console.log('No specific participant elements found, scanning page text');
      const pageText = document.body.textContent || '';
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = (pageText.match(emailRegex) || []).map(e => e.toLowerCase().trim());
      emails.forEach(email => participantEmails.add(email));
    } else {
      // Extract emails from participant elements
      for (const participant of participants) {
        const email = extractEmailFromParticipant(participant);
        if (email) {
          participantEmails.add(email);
        }
      }
    }

    // Also scan all text content for emails
    const allText = document.body.textContent || '';
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const allEmails = (allText.match(emailRegex) || []).map(e => e.toLowerCase().trim());
    allEmails.forEach(email => participantEmails.add(email));

    // Compare with stored list
    const present = Array.from(participantEmails).filter(email => storedEmailList.has(email));
    const missing = Array.from(storedEmailList).filter(email => !participantEmails.has(email));
    const unknown = Array.from(participantEmails).filter(email => !storedEmailList.has(email));

    // Save results
    const results = {
      present: present,
      missing: missing,
      unknown: unknown,
      totalParticipants: participantEmails.size,
      timestamp: new Date().toISOString()
    };

    await chrome.runtime.sendMessage({
      action: 'saveMeetResults',
      results: results
    });

    console.log('Meet scan complete:', results);
    
    // Show notification
    showNotification(`Found ${participantEmails.size} participants. ${present.length} in list, ${missing.length} missing, ${unknown.length} unknown.`);

  } catch (error) {
    console.error('Error scanning Meet:', error);
    showNotification('Error scanning Meet participants. Please try again.');
  } finally {
    isScanning = false;
  }
}

// Wait for Google Meet to be ready
function waitForMeet() {
  return new Promise((resolve) => {
    // Check if we're in a meeting
    if (document.querySelector('[jscontroller], [data-meeting-title]')) {
      resolve();
      return;
    }
    
    const observer = new MutationObserver(() => {
      if (document.querySelector('[jscontroller], [data-meeting-title]')) {
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

