# MarkMind

<div align="center">
  <img src="../assets/icons/icon128.png" alt="MarkMind Logo" width="128" height="128">
  <h1>MarkMind</h1>
  <p><strong>AI-Powered Bookmark Organization</strong></p>
  <p>
<!--     <a href="https://github.com/migsilva89/MarkMind/blob/main/src/docs/LICENSE">
      <img src="https://img.shields.io/github/license//migsilva89/MarkMind" alt="License">
    </a> -->
   <!--  <a href="https://github.com/migsilva89/MarkMind/releases">
      <img src="https://img.shields.io/github/v/release/migsilva89/MarkMind" alt="Version">
    </a> -->
    <a href="https://github.com/migsilva89/MarkMind/issues">
      <img src="https://img.shields.io/github/issues/migsilva89/MarkMind" alt="Issues">
    </a>
  </p>
</div>

---

MarkMind is a Chrome extension that helps you organize your bookmarks intelligently using AI. It analyzes your bookmarks and suggests an organized folder structure based on content and patterns.

## 🌟 Key Features

- **Smart Organization**: Uses AI to analyze and categorize your bookmarks
- **Bulk Processing**: Organize multiple bookmarks at once
- **Existing Structure Respect**: Works with your current folder organization
- **Privacy First**: All bookmark processing happens locally
- **Full Control**: Review and approve all suggested changes
- **Clear Feedback**: Detailed logs of all actions taken

## 🔍 How It Works

1. **Selection**: Choose the bookmarks you want to organize
2. **Analysis**: AI analyzes the content and patterns
3. **Suggestion**: Receives intelligent folder structure suggestions
4. **Review**: You review and approve the suggested organization
5. **Application**: Changes are applied to your Chrome bookmarks

## 🛠️ Technical Details

- Uses Google's Gemini AI for intelligent categorization
- Requires a Google AI API key (free tier available)
- Processes bookmarks locally for privacy
- Minimal permissions required:
  - `bookmarks`: To read and organize your bookmarks
  - `activeTab`: To add current page as bookmark
  - `storage`: To save your settings locally

## 📝 Usage Guide

1. **Initial Setup**:
   - Install the extension
   - Add your Google AI API key in settings
   - Click the extension icon to start

2. **Organizing Bookmarks**:
   - Select bookmarks to organize
   - Click "Organize Selected"
   - Review the suggested structure
   - Approve to apply changes

3. **Adding Current Page**:
   - Click "Add Current Page"
   - The page will be bookmarked and organized

## 🔒 Privacy & Security

- Your bookmarks never leave your browser
- Only bookmark titles and URLs are sent to AI
- API key is stored securely in local storage
- No personal data is collected or stored
- No tracking or analytics

## 🤝 Support

If you encounter any issues or have questions:
- Check the [Privacy Policy](PRIVACY.md)
- Open an issue on GitHub
- Contact: themarkmind@gmail.com

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details.

---

Made with ❤️ for better bookmark organization

## Project Structure

```
src/
├── js/
│   ├── popup.js           # Main UI logic
│   ├── background.js      # Background service worker
│   ├── config.js          # Configuration settings
│   └── services/
│       └── geminiService.js  # AI service integration
├── css/
│   └── style.css         # Styles for the extension
├── assets/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── manifest.json
└── popup.html
```

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `src` folder of the project

## Development

### Prerequisites

- Google Chrome
- Basic knowledge of JavaScript, HTML, and CSS
- Gemini API key (get it at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Setting Up the Environment

1. Clone the repository:
```bash
git clone https://github.com/migsilva89/MarkMind.git
cd MarkMind
```

2. Open the project in your favorite editor

3. To test changes:
   - Go to `chrome://extensions/`
   - Click the reload icon on the extension
   - Changes will be applied immediately

### Configuration

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open the extension and click the settings icon
3. Enter your API key and save
4. Test the connection using the "Test API" button

## Features in Detail

### Bookmark Organization
- Select bookmarks to organize
- AI analyzes content and suggests folder structure
- Preview suggested organization before applying
- Support for up to 3 levels of folder hierarchy
- Smart handling of existing folders

### User Interface
- Clean and modern design
- Intuitive folder navigation
- Real-time feedback with progress indicators
- Detailed logging of actions
- Error handling with clear messages

### Security
- Secure API key storage
- No data sent to external servers except Google AI
- All bookmark processing done locally

## Changelog

### v1.0.0-beta
- Initial beta release
- Core bookmark organization features
- AI-powered categorization
- Folder hierarchy support
- Modern UI implementation
- Secure API key management

## Roadmap

- [ ] Export/Import functionality
- [ ] Custom folder depth configuration
- [ ] Additional AI models support
- [ ] Batch processing improvements
- [ ] Advanced folder management
- [ ] Cross-device synchronization

## Contributing

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📸 Screenshots

### Main Interface
![Main Interface](../assets/screenshots/main-interface.png)
*The main interface showing bookmark selection and organization options*

### Organization Process
![Organization Process](../assets/screenshots/organization-process.png)
*Detailed logs showing the AI-powered organization process*

### Settings Panel
![Settings Panel](../assets/screenshots/settings-panel.png)
*API key management and privacy settings*

### Results View
![Results View](../assets/screenshots/results-view.png)
*Preview of suggested bookmark organization* 