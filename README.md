# Email & Presence Checker Chrome Extension

A Chrome extension that tracks email presence in Gmail labels and participant presence in Google Meet based on a predefined email list.

## Features

- **Email List Management**: Store and manage a custom list of email addresses
- **Gmail Label Scanning**: Scan Gmail labels/folders and compare with your stored email list
- **Missing Email Detection**: Identify emails from your list that are not present in selected Gmail labels
- **Unknown Email Detection**: Flag new or unknown email addresses appearing in monitored Gmail labels
- **Google Meet Presence Tracking**: Track meeting participants and compare with your stored email list
- **Real-time Monitoring**: Automatically detects changes in Gmail and Google Meet

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the folder containing this extension
5. The extension icon should appear in your Chrome toolbar

## Usage

### Setting Up Your Email List

1. Click the extension icon in your Chrome toolbar
2. Go to the "Email List" tab
3. Paste or type email addresses (one per line or comma-separated)
4. Click "Add Emails" to save them
5. You can remove individual emails or clear the entire list

### Scanning Gmail

1. Open Gmail in a Chrome tab
2. Navigate to the label/folder you want to scan
3. Click the extension icon
4. Go to the "Gmail Results" tab
5. Click "Scan Selected Labels" to analyze the current view
6. View results:
   - **Emails in Gmail but NOT in List**: Unknown email addresses found
   - **Emails in List but NOT in Gmail**: Expected emails that are missing

The extension automatically scans when new emails arrive.

### Tracking Google Meet Participants

1. Join a Google Meet session
2. Click the extension icon
3. Go to the "Meet Results" tab
4. Click "Refresh Participants" to scan current participants
5. View results:
   - **Participants in List**: People from your list who are present
   - **Expected but Missing**: People from your list who are not in the meeting
   - **Participants NOT in List**: Unknown participants

The extension automatically scans when participants join or leave.

## How It Works

- **Gmail Scanning**: The extension extracts email addresses from visible email threads in the current Gmail view
- **Meet Scanning**: The extension identifies participants by scanning the meeting interface for email addresses
- **Storage**: All data is stored locally in your browser (no external servers)
- **Privacy**: Your email list and scan results never leave your device

## Technical Details

- **Manifest Version**: 3
- **Permissions**: Storage, Tabs, ActiveTab
- **Host Permissions**: Gmail and Google Meet domains
- **Content Scripts**: Separate scripts for Gmail and Google Meet
- **Background Service Worker**: Coordinates data storage and communication

## Troubleshooting

- **No results in Gmail**: Make sure you're viewing a label/folder with emails, and try clicking "Scan Selected Labels" again
- **No participants in Meet**: Ensure you're in an active meeting and try clicking "Refresh Participants"
- **Emails not detected**: The extension uses pattern matching to find emails. Some email formats might not be detected if they're heavily obfuscated

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

This extension is provided as-is for personal use.

