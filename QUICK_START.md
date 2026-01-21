# Quick Start Guide

## Phase 1 Complete! ✅

The project skeleton is ready. Here's what you can do now:

## 1. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:5173

## 2. First Time Setup

When you open the app, you'll be redirected to **Settings** because no API key is configured.

### Configure Your Settings:
1. **Grade Level**: Choose 3-9 (default: 5)
2. **LLM Provider**: Select DeepSeek, OpenAI, or Custom
3. **API Key**: Enter your API key (required)
4. **Voice Settings**: Enable/disable TTS and auto-play

### Getting an API Key:

**DeepSeek** (Recommended for cost):
- Visit: https://platform.deepseek.com
- Sign up and get API key
- Very affordable pricing

**OpenAI**:
- Visit: https://platform.openai.com
- Get API key from dashboard
- Higher quality, higher cost

## 3. Explore the UI

After setting up:
- **Home (🎯)**: Diagnosis page (placeholder for Phase 2)
- **Review (📚)**: Error log (will show your mistakes)
- **Settings (⚙️)**: Change configuration anytime

## 4. What's Working Now

✅ Responsive layout (desktop + mobile)
✅ Bottom navigation
✅ Settings page (fully functional)
✅ State persistence (LocalStorage)
✅ Cyberpunk design theme
✅ Type-safe codebase

## 5. What's Next (Phase 2)

We need to implement:
1. **Word Database** (JSON with ~1000 words)
2. **Speech Service** (Web Speech API wrapper)
3. **LLM Service** (API integration)
4. **Diagnosis Flow** (5-word test loop)

## Project Structure Overview

```
src/
├── types/index.ts           ✅ All TypeScript interfaces
├── store/useAppStore.ts     ✅ Zustand state management
├── components/Layout.tsx    ✅ App layout with nav
├── pages/
│   ├── HomePage.tsx         ⏳ Needs diagnosis logic
│   ├── ReviewPage.tsx       ⏳ Needs VST mode
│   └── SettingsPage.tsx     ✅ Complete
├── services/                📁 Ready for Phase 2
├── data/                    📁 Ready for words.json
└── App.tsx                  ✅ Router + auth check
```

## Customization

### Colors (tailwind.config.js)
```js
'cyber-bg': '#0f172a',       // Background
'cyber-surface': '#1e293b',  // Cards/panels
'cyber-primary': '#22d3ee',  // Primary text/buttons
'cyber-secondary': '#94a3b8',// Secondary text
'cyber-alert': '#f43f5e',    // Errors/warnings
```

### Component Classes (index.css)
- `.btn-cyber` - Primary button
- `.btn-cyber-outline` - Outline button
- `.card-cyber` - Card container
- `.input-cyber` - Form input
- `.badge-cyber` - Status badge

## Testing the Store

Open browser console and try:

```javascript
// Get current config
window.localStorage.getItem('eaa_config')

// Get error log
window.localStorage.getItem('eaa_error_log')
```

## Common Issues

**Q: App redirects to settings immediately?**
A: This is expected! You need to set an API key first.

**Q: Can I test without an API key?**
A: Phase 1 doesn't need API calls. Phase 2 will require a real key.

**Q: TypeScript errors?**
A: Make sure all files are saved and run `npm install` again.

## Build for Production

```bash
npm run build
npm run preview
```

## Next Session Commands

When ready for Phase 2, we'll create:
1. `src/data/words.json` - Vocabulary database
2. `src/services/WordService.ts` - Word loading logic
3. `src/services/SpeechService.ts` - Voice I/O
4. `src/services/LLMService.ts` - AI integration
5. Update `HomePage.tsx` - Diagnosis flow

---

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 🚀

Questions? Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed documentation.
