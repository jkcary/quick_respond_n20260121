# English AI Agent (EAA) - Implementation Plan

> **Status**: Architecture Complete ✅ | Implementation Ready 🚀
>
> **Last Updated**: 2026-01-22

---

## 📋 Quick Reference

**What's Done:**
- ✅ Project architecture and directory structure
- ✅ TypeScript type definitions
- ✅ Configuration files (LLM, Electron, Capacitor)
- ✅ Project memory (.claude/CLAUDE.md)
- ✅ Sample vocabulary data
- ✅ Build system verified

**What's Next:**
- ❌ Core business logic (40 files)
- ❌ UI components (35 files)
- ❌ State management expansion
- ❌ Integration and testing

---

## 🎯 Implementation Strategy

### Bottom-Up Approach
1. **Core Modules** → 2. **State Management** → 3. **UI Components** → 4. **Integration**

This ensures solid foundation before building UI.

---

## PHASE 1: Core Business Logic (src/core/)

### 1.1 Storage Layer [`src/core/storage/`]

#### Files to Create:
- [ ] `base.ts` - Generic storage interface
- [ ] `localStorage.ts` - Browser LocalStorage implementation
- [ ] `errorLog.ts` - Error log CRUD operations
- [ ] `config.ts` - User configuration persistence
- [ ] `index.ts` - Module exports

#### Key Features:
- Type-safe get/set operations with generics
- JSON serialization/deserialization
- Error handling for quota exceeded
- Platform detection (Web/Electron/Capacitor)

#### Implementation Notes:
```typescript
// base.ts example
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

---

### 1.2 Vocabulary Engine [`src/core/vocabulary/`]

#### Files to Create:
- [ ] `loader.ts` - Load and aggregate JSON vocabulary files
- [ ] `selector.ts` - Smart word selection algorithm
- [ ] `filter.ts` - Filter mastered/excluded words
- [ ] `index.ts` - Module exports

#### Key Features:

**Loader:**
- Load from `src/data/gradeX/*.json`
- Aggregate all grades ≤ current grade
- Cache loaded data in memory
- Validate against JSON schema

**Selector:**
- Priority 1: Error log words (mastered: false)
- Priority 2: Random new words
- Ensure no duplicates in 5-word session
- Weighted random selection

**Filter:**
- Exclude mastered words
- Filter by grade level
- Search/filter by word text

#### Implementation Example:
```typescript
// selector.ts
export async function selectWords(
  count: number,
  gradeLevel: GradeLevel,
  errorLog: ErrorLog
): Promise<VocabularyItem[]> {
  // 1. Load vocabulary
  // 2. Get unmastered errors
  // 3. Fill remaining with random words
  // 4. Shuffle and return
}
```

---

### 1.3 LLM Gateway [`src/core/llm/`]

#### Files to Create:
- [ ] `gateway.ts` - Multi-provider factory and orchestrator
- [ ] `providers/deepseek.ts` - DeepSeek API client
- [ ] `providers/openai.ts` - OpenAI API client
- [ ] `providers/anthropic.ts` - Anthropic API client
- [ ] `providers/moonshot.ts` - Moonshot API client
- [ ] `providers/ollama.ts` - Ollama local API client
- [ ] `parser.ts` - JSON response parser and validator
- [ ] `index.ts` - Module exports

#### Key Features:

**Gateway:**
- Factory pattern to instantiate active provider
- Unified `judge(word, userInput)` interface
- Connection testing
- Retry logic with exponential backoff
- Timeout handling (10s)

**Provider Clients:**
- Implement `LLMClient` interface
- HTTP client using axios
- Provider-specific request formatting
- Error normalization

**Parser:**
- Extract JSON from response (handle markdown blocks)
- Validate against `JudgmentResult` schema
- Fallback for malformed responses: `{correct: false, correction: "系统错误"}`

#### Implementation Example:
```typescript
// gateway.ts
export class LLMGateway {
  private client: LLMClient;

  constructor(config: LLMConfig) {
    this.client = this.createClient(config);
  }

  async judge(word: string, userInput: string): Promise<JudgmentResult> {
    const prompt = createJudgmentUserMessage(word, userInput);
    const response = await this.client.sendRequest({
      systemPrompt: JUDGMENT_SYSTEM_PROMPT,
      userMessage: prompt,
      maxTokens: 100,
      temperature: 0.0,
    });
    return parseJudgment(response.content);
  }
}
```

---

### 1.4 Speech Services [`src/core/speech/`]

#### Files to Create:
- [ ] `recognizer.ts` - Speech-to-text (Web Speech API wrapper)
- [ ] `synthesizer.ts` - Text-to-speech (Web Speech API wrapper)
- [ ] `permissions.ts` - Microphone permission handling
- [ ] `index.ts` - Module exports

#### Key Features:

**Recognizer:**
- Wrap `window.SpeechRecognition`
- Language: `zh-CN` (Chinese input)
- Continuous: false (single utterance)
- Return: `{transcript: string, confidence: number}`
- Handle permission denied → disable feature flag

**Synthesizer:**
- Wrap `window.speechSynthesis`
- Language: `en-US` (English pronunciation)
- Configurable rate (0.8-1.2) and pitch (1.0)
- Queue management for sequential playback

**Permissions:**
- Request microphone access (navigator.mediaDevices.getUserMedia)
- Check permission status
- Platform-specific handling (Android requires HTTPS)

#### Implementation Example:
```typescript
// recognizer.ts
export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;

  async start(): Promise<SpeechResult> {
    if (!this.recognition) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.lang = 'zh-CN';
      this.recognition.continuous = false;
    }

    return new Promise((resolve, reject) => {
      this.recognition!.onresult = (event) => {
        const result = event.results[0][0];
        resolve({ transcript: result.transcript, confidence: result.confidence });
      };
      this.recognition!.onerror = (event) => reject(event.error);
      this.recognition!.start();
    });
  }
}
```

---

## PHASE 2: State Management (src/store/)

### 2.1 Test Session Store [`src/store/testStore.ts`]

#### Create New Zustand Store:

```typescript
interface TestState {
  // Session state
  currentSession: TestSession | null;
  currentWordIndex: number;
  isListening: boolean;
  isJudging: boolean;
  userInput: string;

  // Actions
  startTest: (gradeLevel: GradeLevel) => Promise<void>;
  nextWord: () => void;
  submitAnswer: (input: string) => Promise<void>;
  endTest: () => void;
  resetTest: () => void;
}
```

#### Key Interactions:
- `startTest()` → calls `vocabularyLoader.selectWords(5)`
- `submitAnswer()` → calls `llmGateway.judge()` → stores result
- On incorrect → calls `errorStore.addError()`
- Auto-advance after correct answer (1.5s delay)

---

### 2.2 Error Tracking Store [`src/store/errorStore.ts`]

#### Create New Zustand Store:

```typescript
interface ErrorState {
  errorLog: ErrorLog;
  filter: 'all' | 'unmastered' | 'mastered';

  // Actions
  addError: (word: VocabularyItem, userInput: string) => void;
  markAsMastered: (wordId: string) => void;
  removeError: (wordId: string) => void;
  clearAll: () => void;
  exportToJSON: () => string;

  // Selectors
  getFilteredErrors: () => ErrorLogEntry[];
  getErrorsByWord: (wordId: string) => ErrorLogEntry | null;
}
```

#### Persistence:
- Auto-save to LocalStorage after every mutation
- Load on store initialization
- Use `persist` middleware from zustand

---

## PHASE 3: UI Components (src/components/)

### 3.1 Common/Reusable Components [`src/components/common/`]

#### Files to Create:
- [ ] `Button.tsx` - Primary/secondary/ghost button variants
- [ ] `Card.tsx` - Slate-800 card with optional glow
- [ ] `Modal.tsx` - Full-screen modal with backdrop
- [ ] `LoadingSpinner.tsx` - Cyberpunk-style animated spinner
- [ ] `Input.tsx` - Text input with validation states
- [ ] `Select.tsx` - Dropdown selector
- [ ] `ProgressBar.tsx` - Horizontal progress bar
- [ ] `Toast.tsx` - Toast notification system

#### Styling Reference:
```tsx
// Button.tsx example
<button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white
                   rounded-lg transition-colors duration-200
                   focus:ring-2 focus:ring-cyan-500/50
                   disabled:opacity-50 disabled:cursor-not-allowed">
  {children}
</button>
```

---

### 3.2 Test Mode Components [`src/components/test/`]

#### Files to Create:

**[ ] `WordCard.tsx`** - Display current word
```typescript
interface WordCardProps {
  word: VocabularyItem;
  onSpeak: () => void;
}
```
- Large centered card with glow effect
- Show: English word + phonetic notation
- Auto-play TTS on mount (if enabled)
- Pulse animation while speaking
- Click to replay audio

**[ ] `VoiceInput.tsx`** - Hybrid voice/text input
```typescript
interface VoiceInputProps {
  onSubmit: (input: string) => void;
  disabled: boolean;
  isListening: boolean;
}
```
- Microphone button (primary) + text input (fallback)
- Show real-time transcript while listening
- "Listening..." pulsing animation
- Auto-submit when recognition completes
- Manual submit button for text input

**[ ] `ResultFeedback.tsx`** - Show judgment result
```typescript
interface ResultFeedbackProps {
  result: TestResult;
  onNext: () => void;
}
```
- ✅ Correct: Green glow + "Correct!" + play success sound
- ❌ Incorrect: Red glow + show correction + error sound + example sentence
- Auto-advance timer (1.5s for correct)
- Manual "Next" button for incorrect

**[ ] `ScorePanel.tsx`** - Session progress header
```typescript
interface ScorePanelProps {
  session: TestSession;
}
```
- Show: "3/5 Correct" or "Word 4/5"
- Progress bar (0-100%)
- Sticky header position
- Animated score updates

**[ ] `TestPage.tsx`** - Main test orchestrator
- Integrate all test components
- Manage flow: word → input → judgment → feedback → next
- Handle keyboard shortcuts (Enter to submit, Space to replay)
- Loading overlay while judging
- End test summary modal

---

### 3.3 Configuration Components [`src/components/config/`]

#### Files to Create:

**[ ] `GradeSelector.tsx`** - Grade level dropdown
```typescript
interface GradeSelectorProps {
  value: GradeLevel;
  onChange: (grade: GradeLevel) => void;
}
```
- Dropdown showing grades 3-9
- Display estimated word count per grade
- Visual indicator of current selection

**[ ] `LLMConfigForm.tsx`** - Provider configuration
```typescript
interface LLMConfigFormProps {
  config: LLMConfig;
  onChange: (config: LLMConfig) => void;
}
```
- Provider tabs (DeepSeek, OpenAI, Anthropic, etc.)
- Form fields: API Key (password), Model Name, Base URL (optional)
- Validation feedback
- "Save" button with loading state

**[ ] `APITester.tsx`** - Connection test utility
```typescript
interface APITesterProps {
  config: LLMConfig;
}
```
- "Test Connection" button
- Show result: ✅ Success (latency: 250ms) or ❌ Error (reason)
- Uses `llmGateway.testConnection()`

**[ ] Update `SettingsPage.tsx`**
- Integrate GradeSelector
- Integrate LLMConfigForm
- Integrate APITester
- Preferences section (Voice, Auto-play, Theme)
- "Save All" and "Reset to Defaults" buttons

---

### 3.4 Review Components [`src/components/review/`]

#### Files to Create:

**[ ] `ErrorList.tsx`** - Display error log table
```typescript
interface ErrorListProps {
  errors: ErrorLogEntry[];
  onSelectWord: (wordId: string) => void;
}
```
- Table columns: Word, Chinese, Error Count, Last Error Date
- Sort by: Date (desc), Error Count (desc)
- Filter buttons: All / Unmastered / Mastered
- Click row → open VST card
- Empty state when no errors

**[ ] `VSTCard.tsx`** - Full-screen learning card
```typescript
interface VSTCardProps {
  word: VSTCardData;
  onMaster: () => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}
```
- **V (Visual)**: Load image or show fallback SVG icon
- **S (Sound)**: Auto-play pronunciation + replay button
- **T (Text)**: Sequential reveal (Word → Phonetic → Chinese → Example)
- "Mark as Mastered" button (if unmastered)
- Navigation arrows (if multiple errors)
- Close button (X)

**[ ] `ExportPanel.tsx`** - Export functionality
```typescript
interface ExportPanelProps {
  errorLog: ErrorLog;
}
```
- "Export to JSON" button → download file
- "Copy to Clipboard" button
- Future: "Export to PDF" (print layout)

**[ ] `ReviewPage.tsx`** - Main review page
- Integrate ErrorList (main content)
- VST card in modal (triggered by row click)
- Export panel in sidebar
- Statistics summary (Total errors, Mastered, Unmastered)

---

### 3.5 Navigation & Layout [`src/components/`]

#### Files to Create:

**[ ] `Navigation.tsx`** - App navigation menu
- Tabs: Home, Test, Review, Settings
- Active tab highlighting (cyan-400)
- Responsive (sidebar on desktop, bottom bar on mobile)
- Badge on "Review" tab showing error count

**[ ] `ErrorBoundary.tsx`** - React error boundary
- Catch unhandled errors
- Display friendly error UI: "Something went wrong"
- "Reload Page" button
- Log error to console (or future: remote logging)

**[ ] `LoadingState.tsx`** - App-wide loading overlay
- Full-screen translucent backdrop
- Centered spinner + message
- Used during: initial load, vocabulary loading, API calls

**[ ] Update `Layout.tsx`**
- Integrate Navigation component
- Wrap content in ErrorBoundary
- Add Toast notification container (fixed top-right)

---

### 3.6 Utilities [`src/utils/`]

#### Files to Create:

**[ ] `validators.ts`** - Input validation functions
```typescript
export function validateAPIKey(key: string): { valid: boolean; error?: string };
export function validateGradeLevel(grade: number): boolean;
export function validateVocabularyItem(item: unknown): item is VocabularyItem;
```

**[ ] `formatters.ts`** - Formatting utilities
```typescript
export function formatDate(timestamp: number): string; // "2024-01-22"
export function formatRelativeTime(timestamp: number): string; // "2 days ago"
export function formatScore(correct: number, total: number): string; // "4/5 (80%)"
```

**[ ] `platform.ts`** - Platform detection
```typescript
export function getPlatform(): Platform;
export function isElectron(): boolean;
export function isCapacitor(): boolean;
export function hasMicrophoneSupport(): boolean;
```

---

## PHASE 4: Integration & Polish

### 4.1 Routing & Navigation

**[ ] Update `src/App.tsx`:**
```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="test" element={<TestPage />} />
      <Route path="review" element={<ReviewPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

**[ ] Create protected route logic:**
- Redirect to `/settings` if no LLM API key configured
- Show setup wizard on first launch

---

### 4.2 Cross-Platform Testing

**[ ] Electron:**
- Test vocabulary loading via IPC (`window.electronAPI.loadVocabulary()`)
- Test user data persistence
- Verify window state restoration
- Test native menus

**[ ] Capacitor (Android):**
- Test microphone permission flow
- Test splash screen
- Build APK and install on device
- Test offline mode

---

### 4.3 Data Population

**[ ] Create additional vocabulary files:**
- [ ] `src/data/grade4/grade4_vol1.json` (20-30 words)
- [ ] `src/data/grade6/grade6_vol1.json` (20-30 words)
- [ ] `src/data/grade7/grade7_vol1.json` (20-30 words)
- [ ] `src/data/grade8/grade8_vol1.json` (20-30 words)
- [ ] `src/data/grade9/grade9_vol1.json` (20-30 words)

**[ ] Expand existing files:**
- Add 20-30 more words to grade3_vol1.json
- Add 20-30 more words to grade5_vol1.json

---

### 4.4 Error Handling & Edge Cases

**[ ] Implement error handling for:**
- Network errors (offline mode)
- LLM timeout (>10s)
- Invalid API key
- LocalStorage quota exceeded
- Microphone permission denied
- Empty vocabulary file
- Malformed LLM response

**[ ] Add user feedback:**
- Toast notifications for errors
- Network status indicator
- Loading states for all async operations

---

## PHASE 5: Testing & Deployment

### 5.1 Manual Testing Checklist

**Core Functionality:**
- [ ] Load vocabulary for grades 3-9
- [ ] Start test with 5 words
- [ ] Voice input captures Chinese correctly
- [ ] Text input fallback works
- [ ] LLM judges correctly (test with correct/incorrect answers)
- [ ] Errors logged to LocalStorage
- [ ] Error log persists across app restart
- [ ] VST cards display all 3 modes (V, S, T)
- [ ] Mark as mastered updates state
- [ ] Export error log to JSON

**Cross-Platform:**
- [ ] Web: Run in Chrome, Firefox, Edge
- [ ] Electron: Build and run Windows app
- [ ] Android: Build APK and install on device
- [ ] Microphone permission flow works on Android

**Edge Cases:**
- [ ] Offline mode shows appropriate error
- [ ] Invalid API key shows error before test
- [ ] Empty vocabulary file handled gracefully
- [ ] LLM timeout doesn't freeze UI
- [ ] LocalStorage quota warning displayed

---

### 5.2 Build Commands

**Development:**
```bash
npm run dev                # Web dev server
npm run electron:dev       # Electron with hot reload
```

**Production:**
```bash
# Web
npm run build
npm run preview

# Electron
npm run build
npm run electron
# Distribution
npm install --save-dev electron-builder
npx electron-builder --windows

# Android
npm run build
npm run cap:sync
npx cap open android
# Build APK in Android Studio: Build → Build APK(s)
```

---

### 5.3 Pre-Launch Verification

**Before considering complete:**
- [ ] `npm run build` completes with 0 errors, 0 warnings
- [ ] All TypeScript strict mode checks pass
- [ ] No `console.log` statements in production code
- [ ] All TODOs resolved or documented
- [ ] README.md is up to date
- [ ] .env.example includes all variables
- [ ] Git history is clean (no secrets committed)

---

## 📊 Progress Tracking

### File Creation Progress

**Core Modules (20 files):**
- [ ] Storage layer (5 files)
- [ ] Vocabulary engine (4 files)
- [ ] LLM gateway (7 files)
- [ ] Speech services (4 files)

**State Management (2 files):**
- [ ] Test store
- [ ] Error store

**UI Components (35 files):**
- [ ] Common components (8 files)
- [ ] Test components (5 files)
- [ ] Config components (3 files)
- [ ] Review components (4 files)
- [ ] Navigation & layout (3 files)
- [ ] Utilities (3 files)
- [ ] Page updates (9 files)

**Data (7 files):**
- [ ] Grade 4-9 vocabulary (5 files)
- [ ] Expand grade 3 & 5 (2 files)

**Total: 64 files to create/modify**

---

## 🎯 Success Criteria

**Functional:**
- ✅ Complete 5-word test flow works end-to-end
- ✅ Error tracking persists across sessions
- ✅ VST review mode displays correctly
- ✅ All PRD requirements implemented

**Technical:**
- ✅ TypeScript compiles with strict mode
- ✅ No `any` types in production code
- ✅ Follows .claude/CLAUDE.md standards
- ✅ Library-first architecture maintained

**Cross-Platform:**
- ✅ Web build runs in modern browsers
- ✅ Electron app packages successfully
- ✅ Android APK builds and installs

---

## 📚 Reference Documents

- **Architecture**: [.claude/CLAUDE.md](./.claude/CLAUDE.md)
- **PRD**: [产品需求文档 PRD](./产品需求文档%20PRD%20跨平台英语单词智能诊断%20Agent)
- **README**: [README.md](./README.md)
- **Types**: [src/types/](./src/types/)
- **Config**: [src/config/](./src/config/)

---

## 💡 Development Tips

1. **Start with Core**: Build storage → vocabulary → LLM in order
2. **Test Incrementally**: Test each module before moving to next
3. **Use Storybook** (optional): Develop UI components in isolation
4. **Mock Data**: Use sample vocabulary for faster iteration
5. **Type Safety**: Let TypeScript guide implementation
6. **Follow Patterns**: Reference CLAUDE.md for code style
7. **Commit Often**: Small, atomic commits with clear messages

---

**Ready to implement?** Start with Phase 1: Core Business Logic 🚀
