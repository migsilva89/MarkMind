# MarkMind

A Chrome extension that helps you organize your bookmarks intelligently using AI.

## Features

- Automatically organize bookmarks using AI
- Create and manage bookmark folders with up to 3 levels of hierarchy
- Smart categorization of bookmarks based on content
- Modern and intuitive interface
- Preview organization before applying changes
- Detailed logging for transparency
- Secure API key management

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
git clone https://github.com/migsilva89/markmind.git
cd markmind
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