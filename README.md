# English AI Agent (EAA)

> Cross-platform English vocabulary diagnostic tool powered by AI

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/yourusername/english-ai-agent)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Overview

English AI Agent (EAA) is an intelligent vocabulary learning application that uses AI-powered speech recognition and translation judgment to help students master English vocabulary. The app features a unique 5-word diagnostic loop, VST (Visual, Sound, Text) learning cards, and comprehensive error tracking.

### Key Features

- **AI-Powered Assessment**: Multi-LLM support (DeepSeek, OpenAI, Anthropic, Moonshot, Ollama)
- **Voice Recognition**: Speech-to-text input with graceful degradation to text input
- **Smart Word Selection**: Prioritizes error-prone words for targeted practice
- **VST Learning Cards**: Visual, Sound, and Text-based review system
- **Cross-Platform**: Runs on Windows (Electron) and Android (Capacitor)
- **Offline Support**: Browse vocabulary without internet connection
- **Error Tracking**: Comprehensive error log with spaced repetition

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Git**
- For Android: **Android Studio** and **Java 17+**
- For Windows: **Windows 10+**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/english-ai-agent.git
   cd english-ai-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your LLM API keys
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173)

## Development

### Project Structure

```
english-ai-agent/
├── src/
│   ├── components/          # React UI components
│   │   ├── common/         # Reusable components
│   │   ├── test/           # Test mode components
│   │   ├── config/         # Settings UI
│   │   └── review/         # Error review components
│   ├── core/               # Business logic (library-first)
│   │   ├── llm/            # LLM API gateway
│   │   ├── speech/         # Web Speech API wrapper
│   │   ├── vocabulary/     # Word management
│   │   └── storage/        # Storage abstraction
│   ├── data/               # Vocabulary JSON files
│   ├── types/              # TypeScript definitions
│   ├── store/              # Zustand state management
│   ├── config/             # App configuration
│   └── utils/              # Helper functions
├── electron/               # Electron main process
├── .claude/                # Project memory (Claude Code)
├── .specify/               # Specify framework templates
└── public/                 # Static assets
```

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run electron:dev     # Run Electron with hot reload
npm run build            # Build for production

# Electron (Windows Desktop)
npm run electron         # Run Electron in production mode

# Capacitor (Android)
npm run cap:sync         # Sync web assets to Android
npx cap open android     # Open Android Studio
```

### Building for Production

#### Web Build

```bash
npm run build
npm run preview          # Preview production build
```

#### Electron (Windows)

```bash
npm run build
npm run electron
```

For distribution, use [electron-builder](https://www.electron.build/):

```bash
npm install --save-dev electron-builder
npx electron-builder --windows
```

#### Android (APK)

1. Build web assets:
   ```bash
   npm run build
   npm run cap:sync
   ```

2. Open in Android Studio:
   ```bash
   npx cap open android
   ```

3. Build APK:
   - In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Or via command line:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```

## Configuration

### LLM Providers

Configure LLM providers in the app settings or via environment variables:

#### DeepSeek (Recommended)

```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_MODEL=deepseek-chat
```

#### OpenAI

```env
VITE_OPENAI_API_KEY=your_api_key_here
VITE_OPENAI_MODEL=gpt-4
```

#### Anthropic

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
VITE_ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

#### Ollama (Local)

```env
VITE_OLLAMA_BASE_URL=http://localhost:11434/api
VITE_OLLAMA_MODEL=llama2
```

### Grade Levels

Vocabulary is organized by grade levels (3-9). The app automatically aggregates words from all grades up to and including the selected level.

Add new vocabulary by creating JSON files in `src/data/gradeX/`:

```json
[
  {
    "id": "g5v1_001",
    "word": "telescope",
    "phonetic": "/ˈtel.ɪ.skoʊp/",
    "chinese": ["望远镜"],
    "sentence": "I looked at the stars through a telescope.",
    "image_url": ""
  }
]
```

## Usage

### 1. Configure Settings

- Select your grade level (3-9)
- Choose an LLM provider (DeepSeek, OpenAI, etc.)
- Enter your API key
- Test connection to verify

### 2. Start Diagnostic Test

- Click "Start Test"
- The app will present 5 words
- For each word:
  - Listen to pronunciation (auto-play)
  - Speak or type the Chinese translation
  - Receive instant feedback (green = correct, red = incorrect)

### 3. Review Errors

- Access error log from main menu
- View VST cards for each mistake:
  - **V (Visual)**: Image representation
  - **S (Sound)**: Audio pronunciation
  - **T (Text)**: Word, phonetic, meaning, example sentence
- Export error list to PDF for printing

## Architecture

### Library-First Design

Core business logic (`src/core/`) is framework-agnostic:

- **LLM Gateway**: Abstracts provider-specific APIs
- **Speech Manager**: Wraps Web Speech API
- **Vocabulary Engine**: Word loading and selection logic
- **Storage Layer**: LocalStorage/SQLite abstraction

### State Management

Uses **Zustand** for lightweight, predictable state management:

- `appStore`: Global configuration
- `testStore`: Current test session
- `errorStore`: Error log and mastery tracking

### Cross-Platform Strategy

- **95% code reuse** between platforms
- Platform detection via Capacitor API
- Conditional file system access (Electron vs Capacitor)

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, TypeScript 5.2 |
| **Styling** | Tailwind CSS 3.3 |
| **Build Tool** | Vite 5.0 |
| **State** | Zustand 4.4 |
| **HTTP** | Axios 1.6 |
| **Desktop** | Electron 28 |
| **Mobile** | Capacitor 5.5 |
| **Speech** | Web Speech API |

## Project Memory

This project uses the [Claude Code](https://claude.ai/claude-code) project memory system. See [.claude/CLAUDE.md](./.claude/CLAUDE.md) for:

- Architecture decisions
- Code standards
- Development workflow
- Testing strategy
- Cross-platform considerations

## Contributing

### Development Workflow

1. **Branch**: Create feature branch from `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Code**: Follow TypeScript strict mode and library-first architecture

3. **Test**: Ensure no TypeScript errors
   ```bash
   npm run build
   ```

4. **Commit**: Use conventional commit format
   ```
   feat(llm): add Anthropic provider support

   - Implement AnthropicProvider class
   - Add API key validation
   - Update gateway to support new provider
   ```

5. **Pull Request**: Submit PR to `develop` branch

### Code Standards

- **TypeScript Strict Mode**: All code must compile with strict mode
- **No `any` types**: Use `unknown` with type guards
- **Explicit return types**: All functions must declare return types
- **Library-first**: Core logic must be framework-agnostic
- **Component props**: All React components must have explicit props interface

See [.claude/CLAUDE.md#code-standards](./.claude/CLAUDE.md#code-standards) for full guidelines.

## Troubleshooting

### Common Issues

**Q: Voice input not working on Android**
- Ensure microphone permission is granted in app settings
- Check that HTTPS is enabled (required for Web Speech API)
- Fallback to text input if permission denied

**Q: API connection fails**
- Verify API key is correct in settings
- Check base URL (especially for proxies)
- Test connection using the built-in connection tester

**Q: Vocabulary files not loading**
- Check file paths in `src/data/gradeX/`
- Validate JSON syntax using schema
- Ensure files are included in build output

**Q: Electron window is blank**
- Check DevTools console for errors
- Verify Vite build completed successfully
- Ensure correct file paths in `electron/main.ts`

### Debug Mode

Enable debug logging:

```env
VITE_DEBUG_MODE=true
```

This will log:
- LLM API requests/responses
- Speech recognition events
- Storage operations
- Error tracking

## Performance

- **APK Size**: < 50 MB (target)
- **Vocabulary Loading**: < 100ms for 5000+ words
- **LLM Response**: Typically 1-3 seconds
- **Speech Recognition**: Near real-time

## Roadmap

- [ ] iOS support via Capacitor
- [ ] Offline LLM support (ONNX runtime)
- [ ] Gamification features (achievements, streaks)
- [ ] Social features (leaderboards, sharing)
- [ ] Advanced analytics dashboard
- [ ] Support for additional languages

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Claude Code](https://claude.ai/claude-code)
- Follows [Specify Framework](https://github.com/specify-framework) principles
- Icons from [Heroicons](https://heroicons.com)
- Pronunciation data from [Cambridge Dictionary](https://dictionary.cambridge.org)

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/english-ai-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/english-ai-agent/discussions)
- **Email**: support@example.com

---

**Version**: 0.1.0 | **Last Updated**: 2026-01-21 | **Maintained By**: Development Team
