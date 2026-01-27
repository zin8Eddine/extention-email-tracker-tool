# Quick Setup Guide

## Step 1: Generate Icons (Optional but Recommended)

1. Open `create-icons.html` in your web browser
2. The icons will automatically download
3. Move the downloaded files (`icon16.png`, `icon48.png`, `icon128.png`) to the `icons/` folder

**Note:** The extension will work without icons, but Chrome will show a default icon.

## Step 2: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `presenseCheckingMail` folder
5. The extension should now appear in your extensions list

## Step 3: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Email & Presence Checker"
3. Click the pin icon to keep it visible in your toolbar

## Step 4: First Use

1. Click the extension icon
2. Go to the **Email List** tab
3. Add your email addresses (one per line or comma-separated)
4. Click **Add Emails**

## Step 5: Start Using

### For Gmail:
1. Open Gmail in a new tab
2. Navigate to any label/folder
3. Click the extension icon
4. Go to **Gmail Results** tab
5. Click **Scan Selected Labels**

### For Google Meet:
1. Join a Google Meet session
2. Click the extension icon
3. Go to **Meet Results** tab
4. Click **Refresh Participants**

## Troubleshooting

- **Extension not loading**: Make sure all files are in the same folder
- **Icons not showing**: The extension works without icons - this is just cosmetic
- **No results in Gmail**: Make sure you're viewing emails in a label/folder, not just the inbox
- **No participants detected**: Google Meet's interface changes frequently - try refreshing the page

## File Structure

```
presenseCheckingMail/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── gmail-content.js       # Gmail scanning script
├── meet-content.js        # Google Meet scanning script
├── icons/                 # Icon files (generate using create-icons.html)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── create-icons.html      # Icon generator tool
├── README.md              # Full documentation
└── SETUP.md               # This file
```

## Next Steps

- Read the full [README.md](README.md) for detailed usage instructions
- Customize the extension by editing the source files
- Report issues or suggest improvements

