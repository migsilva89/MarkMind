# MarkMind - AI-Powered Bookmark Organization

<div align="center">
  <img src="./src/assets/icons/icon128.png" alt="MarkMind Logo" width="128" height="128">
  <p><strong>Transform your chaotic bookmarks into organized bliss with AI</strong></p>
  <p>
    <a href="https://chromewebstore.google.com/detail/MarkMind/bdobgdkpeffdbonfpokgkbncgnbnjnoo">
      <img src="https://img.shields.io/badge/Chrome-Add%20to%20Chrome-green" alt="Chrome Web Store">
    </a>
    <a href="https://github.com/migsilva89/MarkMind/issues">
      <img src="https://img.shields.io/github/issues/migsilva89/MarkMind" alt="Issues">
    </a>
    <a href="https://github.com/migsilva89/MarkMind/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
    </a>
  </p>
</div>

## Why MarkMind?

MarkMind uses AI to understand what you're saving and automatically organizes your bookmarks into the right folders. One click and your bookmarks find their perfect home.

<div align="center">
  <img src="https://www.markmind.xyz/addcurrent.gif" alt="MarkMind Demo" width="600">
</div>

### Key Features

- **Smart Organization** - AI analyzes page content and suggests the best folder
- **Bulk Processing** - Organize hundreds of bookmarks at once
- **Multiple AI Providers** - Google Gemini, OpenAI, Anthropic, or OpenRouter
- **Privacy First** - Your bookmarks stay in your browser, only titles/URLs are sent to the AI
- **Review Before Apply** - Always review and approve changes before they happen
- **Works With Your Structure** - Respects your existing bookmark folders

## Getting Started

### Install from Chrome Web Store

1. [Add MarkMind from the Chrome Web Store](https://chromewebstore.google.com/detail/markmind/bdobgdkpeffdbonfpokgkbncgnbnjnoo)
2. Click the MarkMind icon and choose your AI provider
3. Enter your API key (get a free one from [Google AI Studio](https://aistudio.google.com/app/apikey))
4. Start organizing!

### Using MarkMind

**Add Current Page:**

1. Navigate to any page
2. Click the MarkMind icon
3. Hit "Organize" - AI suggests the best folder
4. Accept, decline, or customize the suggestion

**Bulk Organize:**

1. Click the MarkMind icon → Organize tab
2. Scan your bookmarks
3. Select bookmarks to organize
4. Review AI suggestions and apply

## Supported AI Providers

| Provider | Get API Key |
| -------- | ----------- |
| Google Gemini | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic | [Anthropic Console](https://console.anthropic.com/) |
| OpenRouter | [OpenRouter](https://openrouter.ai/keys) |

## Privacy & Security

- Bookmarks never leave your browser (only titles/URLs sent to AI for analysis)
- API keys stored securely in Chrome's local storage
- No personal data collected or tracked
- No analytics, no telemetry
- Open source - verify the code yourself

## For Developers

### Tech Stack

- **React 19** + **TypeScript**
- **Vite** with @crxjs/vite-plugin
- **Chrome Manifest V3**
- **CSS** with design tokens

### Local Development

```bash
git clone https://github.com/migsilva89/MarkMind.git
cd MarkMind
npm install
npm run dev       # Dev server with HMR
npm run build     # Production build → dist/
```

Load the extension:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `dist/`

### Project Structure

```text
src/
├── components/      # React components (one per file)
├── hooks/           # Custom hooks (folder per hook)
├── services/        # Chrome API & AI provider wrappers
├── config/          # Configuration data
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
├── styles/          # Design tokens (CSS variables)
└── App.tsx          # Root component
```

### Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Screenshots

<div align="center">
  <img src="https://www.markmind.xyz/addcurrent.gif" alt="Add current page" width="400">
  <p><em>Add current page</em></p>

  <img src="https://www.markmind.xyz/multiple.gif" alt="Bulk organize" width="400">
  <p><em>Bulk organize bookmarks</em></p>

  <img src="https://www.markmind.xyz/key.gif" alt="API key setup" width="400">
  <p><em>API key setup</em></p>
</div>

## Support

- [Open an issue](https://github.com/migsilva89/MarkMind/issues) on GitHub
- Email: <themarkmind@gmail.com>
- Website: [markmind.xyz](https://markmind.xyz)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>If you find MarkMind useful, consider <a href="https://github.com/migsilva89/MarkMind">giving it a star</a></p>
</div>
