<!--
Sync Impact Report
==================
Version: 1.0.0 → 2.0.0
Change Type: MAJOR (Complete redesign for English AI Agent project context)

Modified Principles:
- I. Library-First Architecture → Component-First Architecture (adapted for hybrid app)
- II. CLI Interface Standard → API-First Design (adapted for mobile/desktop app)
- III. Test-First Development → User-First Development (adapted for educational app)
- IV. Integration Testing Requirements → Cross-Platform Compatibility (new focus)
- V. Observability & Debugging → Offline-First & Resilience (new focus)
- VI. Versioning & Breaking Changes → Data Schema Stability (adapted for user data)
- VII. Simplicity & YAGNI → Performance & Bundle Size (adapted for mobile constraints)

Added Sections:
- Educational App Quality Standards
- Privacy & Data Governance (critical for student data)
- Localization & Accessibility requirements
- Updated Development Workflow for hybrid app context
- Updated Quality Gates for cross-platform deployment

Removed Sections:
- CLI Interface Standard (not applicable to GUI app)
- Generic library-first guidance (replaced with component-first)

Templates Status:
- ✅ plan-template.md: Updated with EAA-specific constitution checks and educational quality gates
- ⚠ spec-template.md: Requires update for educational user scenarios (student learning journeys)
- ⚠ tasks-template.md: Requires update for mobile development workflow (Android permissions, offline mode)
- ✅ agent-file-template.md: Updated with EAA principles summary and quality standards
- ✅ checklist-template.md: Updated with mobile-specific checks and educational quality items

Follow-up TODOs:
- Update spec-template.md to include student persona templates (grades 3-9)
- Update tasks-template.md to include Android permission tasks and offline testing
- Create educational app-specific user story examples in spec-template.md
- Add accessibility testing checklist items for screen readers and keyboard navigation

Last Generated: 2026-01-21
-->

# English AI Agent (EAA) Constitution

**Project**: Cross-Platform English Vocabulary Intelligent Diagnostic Agent
**Target Platforms**: Windows (Electron), Android (Capacitor)
**Tech Stack**: React, TypeScript, Tailwind CSS, Vite, Web Speech API

## Core Principles

### I. Component-First Architecture

Every feature must be built as a reusable, well-encapsulated component:

- **Self-Contained**: Components must be independently testable with clear props/interfaces
- **Single Responsibility**: Each component solves one specific UI/UX problem - avoid "god components"
- **Platform-Agnostic**: Core business logic must work across Electron and Capacitor without modification
- **Composable**: Components expose clean interfaces that enable composition without tight coupling
- **Portable**: UI components can be extracted and reused in other educational apps

**Rationale**: Component-first architecture ensures maintainability across platforms, improves testability, and enables rapid feature development for both desktop and mobile experiences.

### II. API-First Design

All LLM and external service interactions must follow API-first principles:

- **Unified Gateway**: All AI model requests (DeepSeek, OpenAI, Ollama, Moonshot, Anthropic) go through a unified adapter layer
- **Graceful Degradation**: Network failures must not crash the app - always provide offline alternatives
- **Request/Response Validation**: Strict JSON schema validation for all API calls (especially AI judge responses)
- **Timeout & Retry**: All network requests must have configurable timeouts (default 10s) and retry logic
- **Mock Support**: All API calls must support mock mode for testing without consuming API credits

**Rationale**: API-first design with proper error handling is critical for educational apps that depend on external AI services while maintaining reliability.

### III. User-First Development

Prioritize student learning experience and teacher usability:

- **User Testing**: Test new features with target users (students grades 3-9) before finalizing UI/UX
- **Accessibility**: All interactive elements must be keyboard-navigable and screen-reader compatible
- **Visual Feedback**: Every user action must have immediate visual/audio feedback (success/error states)
- **Error Recovery**: Users must never lose progress due to errors - auto-save frequently
- **Progressive Disclosure**: Start with simple interface, reveal advanced features gradually

**Rationale**: Educational software must prioritize learning outcomes over technical elegance. User-first approach ensures features actually help students learn vocabulary effectively.

### IV. Cross-Platform Compatibility

Code must work seamlessly on Windows (Electron) and Android (Capacitor):

- **Platform Detection**: Use feature detection, not platform sniffing (check for capabilities, not OS)
- **Responsive Design**: All UI must work from 5" phone screens to 27" desktop monitors
- **Native API Abstraction**: Platform-specific APIs (file system, permissions, audio) must be abstracted behind unified interfaces
- **Permission Handling**: Android permissions (microphone, storage) must be requested gracefully with fallback options
- **Testing Matrix**: Test on minimum spec devices (Android 8.0+, Windows 10+)

**Rationale**: Cross-platform consistency ensures all students have equal learning experience regardless of device, while respecting platform-specific constraints.

### V. Offline-First & Resilience

App must function without network connectivity whenever possible:

- **Local Data Storage**: Vocabulary database, user progress, and error logs stored locally (IndexedDB/SQLite)
- **Offline Mode Detection**: Automatically detect network status and disable network-dependent features
- **Queue & Sync**: Network requests that fail offline should queue and retry when connection resumes
- **Cached Assets**: All images, audio, and static content must be bundled or cached locally
- **Graceful Degradation**: When LLM unavailable, offer simpler offline evaluation methods (exact match)

**Rationale**: Students may use the app in areas with poor connectivity. Offline-first design ensures learning continuity regardless of network availability.

### VI. Data Schema Stability

User data and vocabulary schemas must be versioned and migrated carefully:

- **Schema Versioning**: All JSON data structures include `schema_version` field
- **Backward Compatibility**: New app versions must migrate old user data automatically without data loss
- **Migration Scripts**: Schema changes require migration code tested with real user data samples
- **No Breaking Changes**: Vocabulary JSON format changes must support old format for at least 1 major version
- **Export/Backup**: Users must be able to export their progress and error logs at any time

**Rationale**: Educational apps accumulate valuable learning data over time. Breaking data compatibility destroys user progress and trust.

### VII. Performance & Bundle Size

Optimize for mobile constraints and fast startup:

- **Bundle Size Target**: Android APK < 50MB, Windows installer < 100MB
- **Cold Start Time**: App must be interactive within 3 seconds on mid-range Android devices
- **Memory Management**: Vocabulary database queries must complete in < 100ms for 5000+ words
- **Image Optimization**: All bundled images must be compressed and lazy-loaded
- **Code Splitting**: Load advanced features (VST cards, print export) on-demand, not at startup
- **Battery Efficiency**: Minimize background processing and wake locks on mobile

**Rationale**: Mobile users have limited storage, battery, and patience. Performance optimization directly impacts adoption and daily usage rates.

## Educational App Quality Standards

### Learning Experience Requirements

- **Immediate Feedback**: Word pronunciation and answer evaluation must feel instantaneous (< 500ms perceived latency)
- **Positive Reinforcement**: Correct answers trigger visual/audio celebration (green effects, ping sound)
- **Constructive Correction**: Wrong answers show correct translation + example sentence + pronunciation
- **Progress Visibility**: Students must see their improvement over time (scores, mastery progress)
- **Spaced Repetition**: Error log prioritizes words that students struggle with

### Visual Design Standards

Follow Tailwind-based design system from PRD:

- **Color Scheme**: Dark theme with `bg-slate-900` background, `text-cyan-400` accents
- **Typography**: Clear, readable fonts optimized for both English and Chinese characters
- **Spacing**: Generous touch targets (min 44px) for mobile interaction
- **Animations**: Smooth transitions (200-300ms) that enhance, not distract from learning
- **Loading States**: Skeleton screens and spinners during data fetch/AI processing

### Audio/Video Quality

- **TTS Quality**: Web Speech API must use high-quality voices (prefer native OS voices)
- **Speech Recognition**: Support both microphone input and fallback text input
- **Audio Feedback**: Success/error sounds must be pleasant and not annoying after repetition
- **Volume Control**: Respect system volume and provide in-app audio settings

## Privacy & Data Governance

### Student Data Protection

- **Local Storage First**: All student progress stored locally, no cloud sync without explicit consent
- **No PII Collection**: Do not collect student names, emails, or school information unless required
- **API Key Security**: Teacher-configured API keys must be encrypted at rest (never in plain text)
- **Analytics Opt-In**: Usage analytics must be opt-in with clear explanation of data collected
- **Right to Deletion**: Provide clear "Reset All Data" option in settings

### COPPA Compliance Considerations

- **Age-Appropriate**: UI and content suitable for grades 3-9 students (ages 8-15)
- **Teacher/Parent Control**: Settings locked behind confirmation to prevent accidental changes by students
- **No Social Features**: Avoid peer comparison or social networking features without parental consent mechanisms

## Localization & Accessibility

### Language Support

- **Interface Language**: Support English and Chinese (Simplified) UI
- **Chinese Fonts**: Ensure Chinese characters render clearly across all platforms
- **Bidirectional Layout**: Prepare architecture for future RTL language support

### Accessibility Standards

- **Screen Reader**: All content readable by TalkBack (Android) and Narrator (Windows)
- **Keyboard Navigation**: Full app functionality accessible via keyboard shortcuts
- **High Contrast**: Support system-level high contrast mode
- **Reduced Motion**: Respect prefers-reduced-motion for students with motion sensitivity
- **Font Scaling**: Support system font size preferences (up to 200%)

## Development Workflow

### Code Review Requirements

All code changes must undergo review:

- **Constitution Compliance**: Verify adherence to all applicable principles
- **Platform Testing**: Test on both Electron and Android before merging
- **Accessibility Check**: Verify keyboard navigation and screen reader compatibility
- **Performance Validation**: Measure bundle size impact and runtime performance
- **Data Safety**: Review any data schema changes for backward compatibility

### Quality Gates

Before releasing any version:

1. **Cross-Platform Tests**: All features work on Windows (Electron) and Android (Capacitor)
2. **Offline Mode**: App functions gracefully without network (except AI-dependent features)
3. **Performance Benchmarks**: Cold start < 3s, word lookup < 100ms, bundle size within limits
4. **Accessibility Audit**: Keyboard navigation and screen reader support verified
5. **Data Migration**: User data upgrades successfully from previous versions
6. **Privacy Review**: No new data collection without user consent

### Continuous Testing Strategy

- **Unit Tests**: React components tested with React Testing Library
- **Integration Tests**: API adapters tested with mocked responses
- **E2E Tests**: Critical user flows (word drill, error review) tested with Playwright
- **Manual Testing**: Each release tested on real Android device (not just emulator)

## Governance

### Amendment Process

Constitution amendments require:

1. **Proposal**: Document proposed change with rationale and impact on EAA project
2. **Team Review**: Review with developers and educational stakeholders
3. **Version Bump**: MAJOR for breaking principles, MINOR for additions, PATCH for clarifications
4. **Migration Plan**: Update all affected code and templates to reflect changes
5. **Template Sync**: Update plan, spec, tasks, and checklist templates

### Compliance Review

Constitution compliance enforced through:

- **Pull Request Checklist**: All PRs verify principle adherence before merge
- **Automated Checks**: Bundle size, performance benchmarks, and accessibility scans in CI/CD
- **User Testing Sessions**: Periodic testing with actual students to validate user-first principle
- **Platform Audits**: Quarterly review of Electron and Capacitor compatibility
- **Security Scans**: Regular audit of data handling and API key storage practices

### Living Document

This constitution evolves with the EAA project:

- **Quarterly Review**: Reassess principles based on user feedback and platform updates
- **Feedback Integration**: Incorporate lessons learned from student testing and teacher feedback
- **Platform Updates**: Adjust for Electron, Capacitor, and React ecosystem changes
- **Pragmatism Over Dogma**: Principles guide decisions but justified exceptions acceptable with documentation

**Version**: 2.0.0 | **Ratified**: 2026-01-21 | **Last Amended**: 2026-01-21
