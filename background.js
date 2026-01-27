// Background service worker for coordination

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveGmailResults') {
    chrome.storage.local.set({ gmailResults: request.results });
    sendResponse({ success: true });
  } else if (request.action === 'saveMeetResults') {
    chrome.storage.local.set({ meetResults: request.results });
    sendResponse({ success: true });
  } else if (request.action === 'getEmailList') {
    chrome.storage.local.get(['emailList'], (result) => {
      sendResponse({ emailList: result.emailList || [] });
    });
    return true; // Keep channel open for async response
  }
  return true;
});

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    emailList: [],
    gmailResults: null,
    meetResults: null
  });
});

