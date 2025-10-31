# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Setting

**IMPORTANT**: Always respond in Japanese (日本語) unless the user explicitly requests English. This is a Japanese project with Japanese-speaking developers.

## Project Overview

**Psycle** is a Duolingo-inspired mobile app for learning evidence-based psychology techniques. Built with React Native, Expo SDK 54, and TypeScript.

### Core Features
- **6 Learning Units**: Mental health, money, work, health, social, study
- **Evidence-Based Content**: 540+ MCQ questions from 645 peer-reviewed papers
- **15 Question Types**: Scenario, which-one, true/false, cloze, therapist-role, research critique, etc.
- **Concept Hints**: Inline educational tooltips for 35+ psychology terms
- **4 Mini-Games**: Breath tempo, echo steps, evidence balance, budget bonds
- **Gamification**: XP, gems, streaks, daily goals, quest system, league progression
- **Monetization**: Free/Pro/Max tiers with Stripe Checkout integration
- **MistakesHub**: Personalized spaced repetition review (Max-only)

## Development Commands

```bash
# Start development server with dev client
npm start

# Platform-specific launch
npm run ios        # Launch iOS simulator
npm run android    # Launch Android emulator
npm run web        # Launch web version

# Tunnel for remote testing
npm run tunnel

# Content generation
npm run fetch      # Fetch academic papers from PubMed/Crossref
npm run questions  # Generate MCQ questions from papers
```

**Important:** This project uses Expo Dev Client (`--dev-client` flag), not Expo Go.

## Architecture Overview

### State Management
Global app state lives in `lib/state.tsx` via React Context:
- **AppStateProvider**: Wraps entire app in `app/_layout.tsx`
- **useAppState()**: Hook providing access to:
  - **Learning Progress**: `selectedGenre`, `completedLessons`, `completeLesson()`
  - **Gamification**: `xp`, `addXp()`, `streak`, `dailyGoal`, `dailyXP`
  - **Currency**: `gems`, `addGems()`, `spendGems()`, `freezeCount`, `buyFreeze()`
  - **Lives System**: `lives` (max 5), `loseLife()`, `refillLives()`, auto-recovery (30min/life)
  - **Quests**: `quests[]`, `incrementQuest()`, `claimQuest()` with 3-state chest animation
  - **Plans**: `planId`, `setPlanId()`, `hasProAccess`, `isSubscriptionActive`, `activeUntil`
  - **MistakesHub**: `reviewEvents[]`, `addReviewEvent()`, `getMistakesHubItems()`, `canAccessMistakesHub`

**Key Architectural Decision**: State is in-memory only and persists to AsyncStorage via useEffect hooks. There's no central persistence layer - each state slice manages its own storage. This approach keeps the code simple but means adding new persisted state requires updating both the state value and adding a corresponding useEffect hook.

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
├── games/
│   └── [id].tsx         # Dynamic route for mini-games
├── lessons/
│   └── [id].tsx         # Dynamic route for MCQ lessons (format: {unit}_lesson_{level})
└── checkout/
    └── [planId].tsx     # Stripe Checkout for premium packs
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

### Lesson System
MCQ lessons are generated from academic sources and displayed via `app/lessons/[id].tsx`:
- **Lesson Format**: 15 questions per lesson (L01: 2 term cards + 4 AB + 5 MCQ3 + 2 TF + 1 cloze + 1 method; L02-L06: 5 AB + 5 MCQ3 + 3 TF + 1 cloze + 1 method)
- **Question Types**:
  - Internal format: `ab`, `mcq3`, `truefalse`, `cloze1`, `method`, `scenario`, `therapist`, `critique`, etc. (15+ types)
  - Adapter layer converts to legacy types: `multiple_choice`, `true_false`, `fill_blank`
- **Star Rating**: 1-3 stars based on accuracy (60%/80%/100%)
- **Concept Hints**: Psychology terms auto-detected in questions and explained inline (see `lib/conceptHints.ts`)
- **Progress Tracking**: Completed lessons stored in state and marked with checkmarks

**Data Flow**: `data/lessons/{unit}.json` → `lib/lessons.ts` → `loadLessons(unit)` → `adaptQuestion()` converts new format to legacy → `QuestionRenderer` displays

**Question Format Rules**: See `QUESTION_FORMAT_RULES.md` for strict format specifications (required reading before creating questions).

### Concept Hints System
`lib/conceptHints.ts` provides in-context educational support:
- **Detection**: Keyword matching in question text and choices
- **Dictionary**: ~35 psychology terms across 6 categories
- **Display**: Inline hint box above choices when term detected
- **Coverage**: Mental health, social, work, health, learning, money concepts

Example: When "認知的再評価" appears in a question, displays:
> 💡 認知的再評価：ネガティブな出来事を別の視点から捉え直すことで感情を調整する技法

To add new terms: Edit `conceptHints` Record in `lib/conceptHints.ts`.

## Content Generation Pipeline

### Academic Source Fetching
```bash
node scripts/fetch_sources.mjs
```
Fetches peer-reviewed papers from PubMed and Crossref:
- **Sources**: 645 papers across 6 units
- **Filters**: 2012+, humans-only, excludes case reports/editorials
- **Priority**: PubMed results (have abstracts) over Crossref
- **Output**: `data/sources.json`
- **Configuration**: `MAX_PER_UNIT`, `UNIT_QUERIES`, `FROM_YEAR` in script

### Automatic Question Generation (Recommended)
```bash
node scripts/auto_generate_problems.mjs [command] [args]
```
**This is the primary question generation system** - generates 15 question types without external APIs:

#### Commands
```bash
# Generate single question
node scripts/auto_generate_problems.mjs question [type]
# Examples: scenario, whichone, therapist, critique, bias, truefalse

# Generate full lesson (15 questions)
node scripts/auto_generate_problems.mjs lesson [unit] [size]
# Example: node scripts/auto_generate_problems.mjs lesson mental 15

# Generate lesson file for specific level
node scripts/auto_generate_problems.mjs node [unit] [level]
# Example: node scripts/auto_generate_problems.mjs node mental 1
# Output: data/lessons_variety/mental_l01.json

# Generate all 36 lessons (6 units × 6 levels)
node scripts/auto_generate_problems.mjs all
```

#### 15 Question Types
- **Easy (40%)**: scenario, whichone, emotion, cloze
- **Medium (40%)**: therapist, concept, match, bias, battle
- **Hard (20%)**: critique, data, limit, ethics, truefalse, rank

#### Data Sources
- **PSYCH_TERMS**: 47 terms (therapies, disorders, concepts)
- **SCENARIOS**: 30+ real-life situations across 6 categories
- **Academic papers**: 645 sources with abstracts

**Architecture**: `ProblemGenerator` class with 15 generation methods, difficulty balancing (40/40/20), keyword extraction, context inference. See `scripts/README_AUTO_GENERATE.md` for full documentation.

### Legacy Question Generation (Deprecated)
```bash
node scripts/generate_questions.mjs
```
Older system that generates basic MCQs from abstracts. Use `auto_generate_problems.mjs` instead for better variety.

### Manual Source Import
```bash
node scripts/sources-import.ts --input refs.txt [--map unit_map.csv]
```
Import citations from text files (DOI, PMID, URLs, or plain text)

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

## Data Files & Formats

```
data/
├── sources.json              # 645 academic papers (PubMed/Crossref)
├── glossary.json             # Psychology terms dictionary
├── questions/                # Legacy JSONL questions
│   └── *.jsonl
├── lessons/                  # Production lessons (15 questions each)
│   ├── mental.json          # 6 levels × 15 questions = 90 questions
│   ├── money.json
│   ├── work.json
│   ├── health.json
│   ├── social.json
│   └── study.json
├── lessons_variety/          # Generated via auto_generate_problems.mjs
├── lessons_backup/           # Auto-backup before regeneration
└── path/                     # Learning path metadata
```

**Question Object Structure**:
```typescript
{
  id: string;              // Unique identifier
  type: "ab" | "mcq3" | "truefalse" | "cloze1" | "method" | ...;
  label: "用語" | "研究" | "研究デザイン" | "復習";
  intro: string;           // Max 15 chars
  stem: string;            // Max 40 chars
  choices: string[];       // 2-3 options depending on type
  answer_index: number;    // 0-indexed correct answer
  snack: string;          // Max 20 chars explanation
  info: string;           // Source citation or extra info
  difficulty?: "easy" | "medium" | "hard";
}
```

**Important**: Always read `QUESTION_FORMAT_RULES.md` before creating/modifying questions. It specifies exact choice counts, required fields, and lesson composition rules.

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

## Code Patterns & Best Practices

### Adding New State
1. Add field to `AppState` interface in `lib/state.tsx`
2. Create useState hook in `AppStateProvider`
3. **If persisted**: Add useEffect hook to sync with AsyncStorage
4. Expose via context provider value
5. Access via `useAppState()` hook

Example:
```typescript
// 1. Add to interface
interface AppState {
  newFeature: number;
  setNewFeature: (val: number) => void;
}

// 2. Inside AppStateProvider
const [newFeature, setNewFeature] = useState(0);

// 3. Persist (optional)
useEffect(() => {
  AsyncStorage.setItem("newFeature", JSON.stringify(newFeature));
}, [newFeature]);

// 4. Expose in provider value
<AppStateContext.Provider value={{ ..., newFeature, setNewFeature }}>
```

### Adding New Learning Units
1. Add unit definition to `genres` array in `lib/data.ts`
2. Create trail nodes in `trailsByGenre[unitId]`
3. Generate lessons: `node scripts/auto_generate_problems.mjs node [unit] 1-6`
4. Add to switch statement in `lib/lessons.ts` → `loadLessons()`
5. Import JSON file at top of `lib/lessons.ts`

### Quest Progress Tracking
Call `incrementQuest(questId, step)` from game/lesson completion handlers. Quest IDs must match initial state in `lib/state.tsx`. Quest system uses 3-state chest animation: `closed` → `opening` (1200ms) → `opened`.

### Working with Concept Hints
When adding educational context to questions:
1. **Check coverage**: Search `lib/conceptHints.ts` for the term
2. **Add if missing**: Use format `{ term: "💡 説明文" }`
3. **Keep it brief**: 1-2 sentences, focus on "what" not "why"
4. **Test detection**: QuestionRenderer auto-detects terms in `stem` and `choices`

**Anti-pattern**: Don't create separate educational screens or slide decks. Inline hints are intentionally simple and contextual.

### Question Creation Workflow
**Always read `QUESTION_FORMAT_RULES.md` first!** Common mistakes:
- Wrong choice count (AB must have 2, MCQ3 must have 3, TF must have ["正しい", "誤り"])
- Missing `［　］` in cloze questions
- Using専門用語 in non-term-card questions (use everyday language)
- Exceeding character limits (intro: 15, stem: 40, choices: 30, snack: 20)

### Energy System Integration
Energy is NOT currently implemented in the codebase despite being in `config/entitlements.json`. The plan structure defines it, but there's no actual energy consumption logic. To implement:
1. Add energy state to `lib/state.tsx`
2. Create `consumeEnergy()` method that checks plan limits
3. Call before lesson start in `app/lessons/[id].tsx`
4. Add refill timer for Free tier (daily reset)

### Adding Feature Gates
1. Add feature config to `config/entitlements.json` under each plan
2. Create checker function in `src/featureGate.ts`
3. Use in-memory counters for usage limits (Map with date keys)
4. Reset logic: compare stored date with `getTodayKey()`
5. Expose via `useAppState()` for UI components

## Monetization & Plans

### Plan Structure
Three tiers defined in `config/entitlements.json`:

| Feature | Free | Pro | Max |
|---------|------|-----|-----|
| **Energy** | 5/day | Unlimited | Unlimited |
| **Content Access** | Lite only | Lite only | Lite + Pro |
| **MistakesHub** | None | None | Unlimited |
| **AI Explain** | Off | Off | Off |

**Critical Rules**:
- MistakesHub is **Max-exclusive only** - never enable for Free or Pro
- Pro tier does NOT unlock Pro content (only Max does)
- Energy cap (`daily_cap: 5` for Free, `null` for Pro/Max) enforced in `config/entitlements.json`

### Pricing System
Multi-region pricing in `config/pricing.json` and `lib/pricing.ts`:

#### Regional Pricing (Monthly)
| Region | Pro | Max | Note |
|--------|-----|-----|------|
| 🇯🇵 JP | ¥1,490 | ¥1,980 | ¥1,500未満・¥2,000未満 |
| 🇺🇸 US | $14.99 | $19.99 | 習慣化×プレミアム感 |
| 🇬🇧 UK | £9.99 | £13.99 | £10未満・£14未満を死守 |
| 🇪🇺 EU | €11.99 | €15.99 | VAT高め、据え置き |
| 🇰🇷 KR | ₩12,900 | ₩16,900 | 学習アプリ馴染み |
| 🇮🇳 IN | ₹449 | ₹599 | 価格弾力大 |
| 🇧🇷 BR | R$34.90 | R$44.90 | 分割文化あり |
| 🇲🇽 MX | MX$99 | MX$129 | 2桁価格でCVR↑ |

#### Pricing Functions (`lib/pricing.ts`)
```typescript
// Auto-detect user's region
const region = detectUserRegion();

// Get formatted price for display
getPlanPrice("pro", "monthly", region);  // "¥1,490"
getPlanPrice("max", "yearly", region);   // "¥12,800"

// Calculate yearly savings
getYearlyDiscount("pro", region);        // 17 (percent)
getYearlyMonthlyEquivalent("max", region); // "¥1,067"
```

### MistakesHub Feature (Max-Only)
Personalized spaced repetition review system:
- **Location**: `src/features/mistakesHub.ts` (selection algorithm), `components/MistakesHubButton.tsx` (UI)
- **Gate**: `src/featureGate.ts` → `canUseMistakesHub(userId, planId)`
- **Data Flow**:
  1. User answers questions → `addReviewEvent()` stores result in `reviewEvents[]`
  2. User clicks MistakesHub → `selectMistakesHubItems()` analyzes 30-day history
  3. Algorithm selects 10 questions: recent mistakes, tag-balanced (3/3/2/2), optimal difficulty
- **Access Control**:
  - Free/Pro: `canUseMistakesHub()` returns false → shows Max upsell
  - Max: Returns true → unlimited sessions
  - Usage tracked in-memory, resets daily at midnight

### Feature Gate System
`src/featureGate.ts` is the single source of truth for plan-based access:

```typescript
// MistakesHub access (Max only)
canUseMistakesHub(userId, "max")     // true
canUseMistakesHub(userId, "pro")     // false
canUseMistakesHub(userId, "free")    // false

// Content access
hasProItemAccess("max")              // true (unlocks Pro content)
hasProItemAccess("pro")              // false (Pro plan doesn't unlock Pro content!)
hasLiteItemAccess("free")            // true

// Usage tracking
getMistakesHubRemaining(userId, planId)  // Returns remaining sessions or null (unlimited)
consumeMistakesHub(userId)               // Decrements daily counter
```

**Architecture Note**: Feature gates use in-memory counters with daily reset (keyed by `YYYY-MM-DD`). No database persistence. User ID is currently hardcoded as `"user_local"` - production would use actual auth.

### Stripe Integration
- **Mode**: Test mode (sandbox keys)
- **Flow**: `app/checkout/[planId].tsx` → Stripe Checkout → webhook → update `planId` + `activeUntil`
- **Price IDs** (test):
  - Pro: `price_1SJ82EJDXOz4c0ISSpJmO8sx`
  - Max: `price_1SJ82FJDXOz4c0ISrrFASipQ`
- **Subscription Check**: `isSubscriptionActive` compares `activeUntil` date with current time

## Key Architectural Decisions & Gotchas

### Data Format: Internal vs Legacy
The app has **two question formats** due to evolution:
- **Internal format** (new): `ab`, `mcq3`, `truefalse`, `cloze1`, `method` with fields like `stem`, `snack`, `answer_index`
- **Legacy format** (old): `multiple_choice`, `true_false`, `fill_blank` with `question`, `explanation`, `correct_index`

**Adapter layer** in `lib/lessons.ts` → `adaptQuestion()` converts internal → legacy for `QuestionRenderer`. When editing lesson data, always use the internal format in JSON files. The adapter handles the conversion automatically.

### State Persistence Strategy
**No central persistence layer** - each state value manages its own AsyncStorage via individual useEffect hooks. This means:
- Adding persisted state requires TWO changes: useState + useEffect
- No single source of truth for what's persisted vs in-memory
- Easy to forget persistence when adding new state
- Benefits: Simple, no boilerplate, co-located logic

### User ID Hardcoding
Current implementation uses `DUMMY_USER_ID = "user_local"` throughout. No authentication system. Production deployment requires:
1. Integrate Supabase/Firebase auth
2. Replace all `DUMMY_USER_ID` references with actual user ID
3. Update feature gates to use authenticated user context
4. Add user profile storage for plan entitlements

### Energy System (Not Implemented)
Despite `energy` configuration in `entitlements.json`, **energy consumption is not implemented**. The config exists as future-proofing. To activate:
- Add energy state to `lib/state.tsx`
- Consume energy at lesson start
- Implement daily refill for Free tier
- Add gem-based energy refills

### MistakesHub Data Flow
Review events are stored **in-memory only** in `lib/state.tsx`. No persistence across app restarts. For production:
- Store `reviewEvents` in AsyncStorage or backend
- Implement proper spaced repetition algorithm
- Consider using ML-based difficulty estimation (p-value tracking exists but not used)

### Question Type Explosion
The project has evolved to support 15+ question types, but `QuestionRenderer` only handles 3 legacy types. New types like `scenario`, `therapist`, `critique` are generated but need custom renderers. Current workaround: map everything to `multiple_choice`. Future: extend renderer or create type-specific components.

### Lesson Composition Rules
Lessons have **strict composition** (see `QUESTION_FORMAT_RULES.md`):
- L01: 2 term + 4 AB + 5 MCQ3 + 2 TF + 1 cloze + 1 method = 15 questions
- L02-L06: 5 AB + 5 MCQ3 + 3 TF + 1 cloze + 1 method = 15 questions

Breaking these rules causes runtime errors in the trail system. Always validate lesson JSON structure before deployment.

### Pro Plan Content Access Quirk
**Pro plan does NOT unlock Pro content** - only Max does. This is counter-intuitive but intentional:
- Pro = Unlimited energy only
- Max = Unlimited energy + Pro content + MistakesHub

This design pushes users toward Max tier. Feature gate `hasProItemAccess(plan)` enforces this logic.

### Test Mode vs Production
Currently using Stripe **test price IDs** hardcoded in `entitlements.json`. Before production:
1. Create production Stripe products/prices
2. Update `stripe_price_id` fields in `entitlements.json`
3. Switch API keys in environment variables
4. Test webhook integration with production endpoint

### Metro Bundler & Dynamic Imports
Lesson files must be **statically imported** at the top of `lib/lessons.ts`:
```typescript
import mentalQuestions from "../data/lessons/mental.json";
```
Cannot use `require()` or dynamic imports with string interpolation - Metro bundler won't bundle them. This means adding a new unit requires code changes, not just data file additions.
