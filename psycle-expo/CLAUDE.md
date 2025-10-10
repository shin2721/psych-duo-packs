# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Psycle** is a Duolingo-inspired mobile app for learning evidence-based psychology techniques. Built with React Native, Expo SDK 54, and TypeScript. Features include:
- 6 learning units (mental health, money, work, health, social, study)
- Interactive mini-games for practical skill training
- Quest system (daily/weekly/monthly challenges)
- League system with XP progression
- Trail-based learning progression

## Development Commands

```bash
# Start development server with dev client
npm start

# Platform-specific launch
npm run ios
npm run android
npm run web

# Tunnel for remote testing
npm run tunnel
```

**Important:** This project uses Expo Dev Client (`--dev-client` flag), not Expo Go.

## Architecture Overview

### State Management
Global app state lives in `lib/state.tsx` via React Context:
- **AppStateProvider**: Wraps entire app in `app/_layout.tsx`
- **useAppState()**: Hook providing access to:
  - `selectedGenre`: Current learning unit (mental/money/work/health/social/study)
  - `xp`: User's experience points
  - `quests`: Array of quest objects with progress tracking
  - `addXp(amount)`: Increment XP
  - `incrementQuest(id, step)`: Update quest progress
  - `claimQuest(id)`: Complete quest and award XP

All state is in-memory (no persistence currently).

### Navigation Structure
Uses Expo Router (file-based routing):
```
app/
├── _layout.tsx          # Root layout with AppStateProvider
├── (tabs)/              # Tab navigation group
│   ├── _layout.tsx      # Tab bar configuration
│   ├── index.tsx        # Home tab (genre selection)
│   ├── course.tsx       # Learning trail view
│   ├── quests.tsx       # Quest tracking
│   └── league.tsx       # Leaderboard
└── games/
    └── [id].tsx         # Dynamic route for mini-games
```

### Game System
4 mini-games defined in `lib/games.extra.ts`:
- **breathTempo**: Breathing metronome (tap timing accuracy)
- **echoSteps**: Sequence memory game
- **evidenceBalance**: Weight balancing (pro/con evidence)
- **budgetBonds**: Budget matching puzzle

**Game Integration Flow:**
1. Trail nodes can have `type: "game"` and `gameId` in `lib/data.ts`
2. Tapping a game node navigates to `/games/[id]`
3. `app/games/[id].tsx` renders appropriate component from `components/games/`
4. Game component calls `onDone(result: GameResult)` on completion
5. Handler updates XP and quest progress based on performance

Each game returns a `GameResult`:
```typescript
interface GameResult {
  xp: number;           // Base XP earned
  mistakes: number;     // Error count
  timeMs: number;       // Completion time
  meta?: Record<string, any>;  // Game-specific data (e.g., accuracy)
}
```

### Trail System
The `Trail` component (`components/trail.tsx`) renders learning progression:
- Nodes alternate left/right along a vertical spine
- Status: `done` | `current` | `locked` | `future`
- Type: `lesson` | `game` (default lesson)
- Current nodes pulse and are tappable
- Game nodes navigate to `/games/[gameId]`

Trail data per genre stored in `lib/data.ts` → `trailsByGenre`.

### Quest System
Quests track user achievements:
- **Types**: `daily` | `weekly` | `monthly`
- **States**: progress tracking, completion check, reward claiming
- **Chest Animation**: 3 states (`closed` → `opening` → `opened`)
- Quest completion awards XP and triggers chest opening animation

Quest IDs are hardcoded and referenced in game completion handlers. See `app/games/[id].tsx` for quest increment logic.

## Academic Sources Pipeline

### Source Fetching
```bash
node scripts/fetch_sources.mjs
```
Fetches peer-reviewed papers from PubMed and Crossref:
- Searches 6 units with unit-specific queries
- Filters: 2012+, humans-only, excludes case reports/editorials
- PubMed results prioritized (have abstracts)
- Outputs to `data/sources.json`
- Current: ~580 sources, ~166 with abstracts

Configuration in `scripts/fetch_sources.mjs`:
- `MAX_PER_UNIT`: 80 per unit
- `UNIT_QUERIES`: Include/ban regex + API query strings
- `FROM_YEAR`: 2012

### Question Generation
```bash
node scripts/generate_questions.mjs
```
Generates MCQ questions from source abstracts:
- Requires 12+ sources with abstracts per unit
- Extracts facts from conclusion sentences
- Creates 3 plausible distractors (number perturbation, direction inversion, alternative facts)
- Outputs to `data/questions/<unit>.jsonl`
- Format: JSONL (one JSON object per line)

**Current status:** Mental unit has insufficient abstracts (only 5 sources). Other 5 units have working question sets.

### Manual Source Import
```bash
node scripts/sources-import.ts --input refs.txt [--map unit_map.csv] [--topic-tags "key=tag1,tag2"]
```
Imports citations from mixed-format text file:
- Parses DOI, PMID, URLs, or plain citations
- Fetches metadata from Crossref/PubMed
- Deduplicates by DOI and normalized title
- Generates unique IDs (lastname+year+keyword)
- Optionally maps to units via CSV
- Outputs to `data/sources.json` (merged with existing)

## Styling & UI

### Theme System
Centralized in `lib/theme.ts`:
```typescript
theme.colors.primary     // Main accent color
theme.colors.bg          // Background
theme.colors.text        // Primary text
theme.spacing.md         // 16px
```
Import: `import { theme } from "../lib/theme"`

### Component Library
Reusable UI in `components/ui.tsx`:
- `Button`: Standard buttons with variants
- `Card`: Container component
- Other shared components

### Animation Guidelines
Games use `react-native` Animated API:
- Pulse effects for current trail nodes
- Chest opening transitions
- Game-specific animations (breath circle, shake feedback)
- Always use `useNativeDriver: true` where possible

## Data Files

```
data/
├── sources.json          # Academic sources (PubMed/Crossref)
├── unit_citations.json   # Maps units to source IDs
└── questions/            # Generated MCQ questions
    ├── money.jsonl
    ├── work.jsonl
    ├── health.jsonl
    ├── social.jsonl
    └── study.jsonl
```

## Adding New Games

1. Create component in `components/games/YourGame.tsx`
2. Add config to `lib/games.extra.ts`:
   ```typescript
   export const yourGame: GameConfig = {
     id: "yourGame",
     title: "Game Title",
     description: "Short description",
     icon: "ionicon-name",
     targetTime: 60000,
   };
   ```
3. Add case to `app/games/[id].tsx` switch statement
4. Add quest to `lib/state.tsx` initial quests array
5. Add game nodes to trails in `lib/data.ts` with `type: "game", gameId: "yourGame"`
6. Implement quest tracking logic in `app/games/[id].tsx` handler

## Code Patterns

### Adding New State
Extend `AppState` interface and `AppStateProvider` in `lib/state.tsx`. State is in-memory only.

### Adding New Genres
1. Add to `genres` array in `lib/data.ts`
2. Add trail definition to `trailsByGenre`
3. Update TypeScript types if needed

### Quest Progress Tracking
Call `incrementQuest(questId, step)` from game/lesson completion handlers. Quest IDs must match those in initial state.
