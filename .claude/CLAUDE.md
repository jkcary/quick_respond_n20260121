# English AI Agent (EAA) - Project Memory

## Quick Facts

**Technology Stack:**
- **Frontend**: React 18 + TypeScript 5.2
- **Styling**: Tailwind CSS 3.3
- **Build Tool**: Vite 5.0
- **State Management**: Zustand 4.4
- **HTTP Client**: Axios 1.6
- **Desktop Platform**: Electron 28 (Windows)
- **Mobile Platform**: Capacitor 5.5 (Android)
- **Speech APIs**: Web Speech API (ASR/TTS)

**Key Commands:**
```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # TypeScript compilation + Vite production build
npm run electron:dev     # Run Electron with hot reload
npm run cap:sync         # Sync web assets to Capacitor platforms
npm run preview          # Preview production build locally
```

**Primary Dependencies:**
- `react-router-dom` - Client-side routing
- `zustand` - Lightweight state management
- `axios` - HTTP client for LLM API calls
- `@capacitor/core` & `@capacitor/android` - Native mobile capabilities

## Architecture Overview

### Design Philosophy

This project follows the **Specify Framework Constitution** principles:

1. **Library-First Architecture**: Core business logic (`src/core/`) is framework-agnostic and independently testable
2. **Clear Separation of Concerns**: Components (UI) ↔ Core (Logic) ↔ Store (State)
3. **Type Safety**: TypeScript strict mode enabled throughout
4. **Simplicity & YAGNI**: Build only what's needed now, refactor when patterns emerge

### System Architecture

```
┌─────────────────────────────────────────────┐
│         User Interface (React)              │
│  Components: Test / Config / Review         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│       State Management (Zustand)            │
│  - App Config   - Test Session              │
│  - Error Logs   - User Progress             │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│        Core Business Logic                  │
│  - LLM Gateway   - Speech Manager           │
│  - Vocabulary    - Storage Abstraction      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         External Services                   │
│  - DeepSeek / OpenAI / Anthropic            │
│  - Web Speech API (Browser)                 │
│  - LocalStorage / SQLite (Future)           │
└─────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── components/           # React UI Components
│   ├── common/          # Reusable components (Button, Card, Modal, LoadingSpinner)
│   ├── test/            # Testing mode (WordCard, VoiceInput, ResultFeedback, ScorePanel)
│   ├── config/          # Settings UI (LLMConfig, GradeSelector, APITester)
│   └── review/          # Error review (ErrorList, VSTCard, ExportPanel)
│
├── core/                # Framework-agnostic business logic (LIBRARY-FIRST)
│   ├── llm/             # LLM API gateway
│   │   ├── gateway.ts   # Multi-provider abstraction layer
│   │   ├── providers/   # DeepSeek, OpenAI, Anthropic, Moonshot, Ollama clients
│   │   └── prompts.ts   # System prompts for translation judging
│   │
│   ├── speech/          # Web Speech API wrapper
│   │   ├── recognizer.ts  # Speech-to-text (ASR)
│   │   └── synthesizer.ts # Text-to-speech (TTS)
│   │
│   ├── vocabulary/      # Word bank management
│   │   ├── loader.ts    # Load and aggregate grade-level JSON files
│   │   ├── selector.ts  # Smart word selection (prioritize errors, random fallback)
│   │   └── filter.ts    # Filter mastered words
│   │
│   └── storage/         # Storage abstraction
│       ├── errorLog.ts  # Error log CRUD operations
│       └── config.ts    # User config persistence
│
├── data/                # Static vocabulary JSON files
│   ├── schemas/         # JSON Schema definitions
│   └── gradeX/          # Vocabulary by grade level (3-9)
│
├── types/               # TypeScript type definitions
│   ├── vocabulary.ts    # VocabularyItem, ErrorLog
│   ├── llm.ts           # LLMConfig, LLMProvider, JudgmentResult
│   ├── config.ts        # AppConfig, GradeLevel
│   └── index.ts         # Re-exports all types
│
├── store/               # Zustand state management
│   ├── appStore.ts      # Global app state (config, current grade)
│   ├── testStore.ts     # Test session state (current words, score)
│   └── errorStore.ts    # Error log state
│
├── utils/               # Helper functions
│   ├── validators.ts    # Input validation
│   └── formatters.ts    # Date/string formatting
│
├── App.tsx              # Main application component
├── main.tsx             # React entry point
└── index.css            # Global Tailwind styles
```

## Code Standards

### TypeScript Rules

- **Strict Mode Enabled**: `strict: true` in tsconfig.json
- **Explicit Types**: Always declare function return types
- **No `any`**: Use `unknown` for truly dynamic types, then narrow with type guards
- **Interfaces over Types**: Prefer `interface` for object shapes
- **Null Safety**: Use optional chaining (`?.`) and nullish coalescing (`??`)

**Example:**
```typescript
// ✅ Good
interface LLMResponse {
  correct: boolean;
  correction: string;
}

async function judgeTranslation(word: string, input: string): Promise<LLMResponse> {
  // ...
}

// ❌ Bad
function judgeTranslation(word, input) {  // No types
  return fetch(...).then(r => r.json());  // Return type not explicit
}
```

### React Component Patterns

- **Function Components Only**: Use hooks, no class components
- **Props Interfaces**: Define explicit props interface for every component
- **Event Handlers**: Prefix with `handle` (e.g., `handleSubmit`, `handleClick`)
- **Conditional Rendering**: Use `&&` for simple cases, ternary for if/else
- **State Location**: Keep state close to where it's used; lift to Zustand only when shared

**Example:**
```typescript
// ✅ Good
interface WordCardProps {
  word: string;
  phonetic: string;
  onSpeak: () => void;
}

export const WordCard: React.FC<WordCardProps> = ({ word, phonetic, onSpeak }) => {
  const handleClick = () => {
    onSpeak();
  };

  return (
    <div className="card" onClick={handleClick}>
      <h2>{word}</h2>
      <p>{phonetic}</p>
    </div>
  );
};
```

### Naming Conventions

- **Files**: `camelCase.ts` for utilities, `PascalCase.tsx` for components
- **Components**: `PascalCase` (e.g., `WordCard`, `VoiceInput`)
- **Functions**: `camelCase`, verbs first (e.g., `loadVocabulary`, `validateInput`)
- **Constants**: `UPPER_SNAKE_CASE` for config (e.g., `MAX_WORDS_PER_TEST = 5`)
- **Types/Interfaces**: `PascalCase`, suffix with type kind if needed (e.g., `LLMConfig`, `ErrorLogEntry`)

### Import Organization

Order imports as follows:
1. React / third-party libraries
2. Local types
3. Components
4. Utils / helpers
5. Relative imports (`./ or ../`)

**Example:**
```typescript
import React, { useState } from 'react';
import axios from 'axios';

import type { LLMConfig, VocabularyItem } from '@/types';
import { WordCard } from '@/components/test/WordCard';
import { validateAPIKey } from '@/utils/validators';

import styles from './TestPage.module.css';
```

## Key Directories Explained

### `src/components/`
React UI components organized by feature area. Each component should:
- Be self-contained with its own props interface
- Handle only UI concerns (render logic, user events)
- Delegate business logic to `core/` modules
- Use Tailwind classes for styling (no CSS modules unless necessary)

### `src/core/`
**This is the heart of the application.** All core modules must be:
- **Framework-agnostic**: No React imports, no DOM dependencies
- **Pure TypeScript**: Export classes/functions that can run in Node.js or browser
- **Independently testable**: Unit tests don't require rendering components
- **Well-documented**: JSDoc comments for public APIs

### `src/data/`
Static vocabulary JSON files. Structure:
- `gradeX/` folders contain word lists for each grade level (3-9)
- `schemas/` contains JSON Schema files for validation
- **Never commit large files**: Keep sample data small; use external storage for production data

### `src/store/`
Zustand stores manage global state. Guidelines:
- **One store per domain**: `appStore` (config), `testStore` (session), `errorStore` (logs)
- **Actions co-located**: Define actions within the store (e.g., `addError`, `updateConfig`)
- **Selectors when needed**: Extract computed values as selectors for performance
- **No business logic**: Stores orchestrate, `core/` implements

## LLM Integration Patterns

### Multi-Provider Gateway

The LLM gateway (`src/core/llm/gateway.ts`) abstracts provider-specific implementations:

```typescript
interface LLMGateway {
  judge(word: string, userInput: string): Promise<JudgmentResult>;
  testConnection(): Promise<boolean>;
}
```

**Provider Registration:**
- Each provider (DeepSeek, OpenAI, etc.) implements the `LLMProvider` interface
- Gateway selects active provider based on user config
- Fallback to error message if provider fails

### System Prompt Standards

All LLM prompts must:
- **Lock output format to JSON**: System prompt enforces `{"correct": boolean, "correction": string}`
- **Forbid explanations**: Explicitly instruct "Return ONLY JSON, no additional text"
- **Handle edge cases**: Account for empty input, partial answers, Chinese/English mix

**Example Prompt Template:**
```typescript
const JUDGMENT_PROMPT = `
You are a translation judge.
Task: Determine if the user's Chinese translation matches the English word.

Word: {word}
User Input: {input}

Return ONLY valid JSON in this format:
{"correct": true/false, "correction": "正确翻译"}

Rules:
- If input is empty, return {"correct": false, "correction": "未作答"}
- If meaning matches (synonyms ok), return true
- No explanations, no extra text
`;
```

## Error Handling Conventions

### Error Boundaries
- Wrap top-level routes with React Error Boundary
- Display user-friendly error messages, log details to console

### Network Errors
- **Retry Logic**: Implement exponential backoff for LLM API failures
- **Offline Detection**: Show "Network unavailable" banner when offline
- **Timeout**: Set 10s timeout for LLM requests

### Permission Errors (Android)
- **Microphone Permission**: Request on first test launch
- **Graceful Degradation**: If denied, hide voice input, show text-only mode
- **Re-request Flow**: Provide settings link to enable permissions later

### Data Validation
- Validate all external data (LLM responses, JSON files) against schemas
- Use `zod` or similar if validation complexity grows
- Log validation failures for debugging

## Cross-Platform Considerations

### Electron (Windows Desktop)
- **File System Access**: Use Node.js `fs` module to load local vocabulary files
- **Native Menus**: Implement File/Edit/Help menus
- **Auto-Updates**: Consider `electron-updater` for future releases
- **Window State**: Persist window size/position to LocalStorage

### Capacitor (Android)
- **Permissions**: Declare `RECORD_AUDIO` in `AndroidManifest.xml`
- **File Access**: Use Capacitor Filesystem API for reading local JSON
- **Status Bar**: Configure status bar color to match Tailwind theme
- **Back Button**: Handle Android back button navigation

### Shared Code
- **95% code reuse**: UI and core logic are identical
- **Platform Detection**: Use `Capacitor.getPlatform()` to branch when needed
- **Build Targets**: Vite builds for both; Electron/Capacitor wrap the same bundle

## Testing Strategy

### Unit Tests (Recommended for Core Modules)
- Test `core/llm/gateway.ts` with mocked HTTP responses
- Test `core/vocabulary/selector.ts` word selection logic
- Use Vitest (Vite-native) or Jest

### Integration Tests (Required for LLM API)
- **Contract Tests**: Verify LLM providers return expected JSON format
- **End-to-End**: Simulate full 5-word test loop
- Run against staging/test API keys, never production

### Manual Testing Checklist
- [ ] Test offline mode (airplane mode on Android)
- [ ] Test microphone permission denial flow
- [ ] Test with invalid API key (should show error)
- [ ] Test with 0 words in vocabulary (should handle gracefully)
- [ ] Test error log persistence across app restarts

## Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/feature-name` - Feature branches
- `fix/bug-description` - Bug fix branches

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat(llm): add Anthropic provider support

- Implement AnthropicProvider class
- Add API key validation
- Update gateway to support new provider

Closes #42
```

### Pull Request Process
1. **Self-Review**: Check diff for debug code, console.logs, unused imports
2. **Constitution Check**: Verify library-first architecture, type safety
3. **Documentation**: Update README if API changed
4. **Request Review**: Tag at least one team member

## Visual Design System (Tailwind)

### Color Palette
- **Background**: `bg-slate-900` (deep space black)
- **Cards**: `bg-slate-800 border border-slate-700 rounded-2xl`
- **Primary Text**: `text-cyan-400` (tech blue)
- **Secondary Text**: `text-slate-300`
- **Accent/Highlight**: `ring-cyan-500/50` (glow effect)
- **Success**: `text-green-400`
- **Error**: `text-red-400`

### Component Styling Examples
```tsx
// Button
<button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition">
  Start Test
</button>

// Card
<div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
  Content
</div>

// Input
<input className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500" />
```

## Performance Guidelines

- **APK Size Target**: < 50 MB total
- **Vocabulary Loading**: Lazy load grade-level JSONs on demand
- **Image Optimization**: Use WebP format, lazy load images in VST cards
- **List Virtualization**: Use `react-window` if error log exceeds 100 items
- **Debounce Input**: Debounce voice input for 500ms to avoid repeated API calls

## Security Considerations

- **API Keys**: Store in environment variables, never commit to Git
- **Input Sanitization**: Sanitize user input before sending to LLM
- **HTTPS Only**: Enforce HTTPS for all API requests
- **CSP Headers**: Configure Content Security Policy in Electron

## Resources & Links

- **Specify Framework**: [Constitution](./.specify/memory/constitution.md)
- **PRD Document**: [Product Requirements](./产品需求文档 PRD 跨平台英语单词智能诊断 Agent)
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

**Last Updated**: 2026-01-21
**Version**: 1.0.0
**Maintained By**: Development Team
