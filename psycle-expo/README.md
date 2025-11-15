# Psycle Expo - Lesson Preview App

Preview app for testing new psych-duo lessons in Expo simulator.

## Quick Start

```bash
cd psycle-expo
npm install
npm start
```

## Features

- ✅ Preview mental_l01 lesson (15 cognitive bias questions)
- ✅ Dynamic JSON loading with validation
- ✅ Interactive MCQ interface
- ✅ Progress tracking & score calculation
- ✅ Detailed explanation after each question
- ✅ Error handling & fallback system

## Usage

1. Start the Expo dev server: `npm start`
2. Open in simulator (press `i` for iOS, `a` for Android)
3. Tap "Preview mental L01" button
4. Complete the lesson interactively

## Lesson Data Structure

### JSON File Location

Lessons are loaded from: `../data/lessons/mental.json`

### Required JSON Schema

```json
{
  "id": "mental_l01",
  "meta": {
    "theme": "レッスンのテーマ",
    "track": "トラックID (e.g., mental, money, work)",
    "arc": "学習アークの説明",
    "lessonIndex": 1,
    "totalQuestions": 15
  },
  "cards": [
    {
      "id": "mental_l01_001",
      "type": "mcq",
      "q": "質問文",
      "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "answerIndex": 0,
      "explain": "解説文"
    }
  ]
}
```

### Field Validation Rules

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique lesson identifier |
| `meta.theme` | string | ✅ | Lesson theme/title |
| `meta.track` | string | ✅ | Track identifier |
| `meta.arc` | string | ✅ | Learning arc description |
| `meta.totalQuestions` | number | ✅ | Must match cards array length |
| `cards` | array | ✅ | Array of question cards |
| `cards[].id` | string | ✅ | Unique question ID |
| `cards[].type` | string | ✅ | Must be "mcq" |
| `cards[].q` | string | ✅ | Question text |
| `cards[].choices` | array | ✅ | Min 2 choices, all strings |
| `cards[].answerIndex` | number | ✅ | Valid index (0-based) |
| `cards[].explain` | string | ✅ | Explanation text |

## Updating Lesson Data

### ⚠️ Important Notes

1. **JSON Validation**: The app validates JSON on load. Invalid data triggers fallback mode.
2. **ID Consistency**: `meta.totalQuestions` must match actual number of cards.
3. **Answer Index**: `answerIndex` must be within `choices` array bounds (0 to length-1).
4. **File Encoding**: Use UTF-8 encoding for Japanese text.

### Testing JSON Changes

After updating `data/lessons/mental.json`:

```bash
# 1. Validate JSON syntax
python3 -m json.tool ../data/lessons/mental.json > /dev/null

# 2. Restart Expo dev server
npm start

# 3. Clear Metro bundler cache if needed
npm start -- --clear
```

### Adding New Lessons

To add a new lesson (e.g., `mental_l02`):

1. Create JSON file: `../data/lessons/mental_l02.json`
2. Update `hooks/useLessonLoader.ts`:
   ```typescript
   if (lessonId === 'mental_l02') {
     lessonData = require('../../data/lessons/mental_l02.json');
   }
   ```
3. Create preview screen: `app/preview/mental_l02_preview.tsx`
4. Add navigation in `app/_layout.tsx` and `app/index.tsx`

## Error Handling

The app includes robust error handling:

- **File Not Found**: Shows error message and fallback lesson
- **Invalid JSON**: Validates schema and shows specific errors
- **Schema Mismatch**: Lists validation errors in console
- **Fallback Mode**: Displays a diagnostic question when data fails to load

## Project Structure

```
psycle-expo/
├── app/
│   ├── _layout.tsx                    # Root navigator
│   ├── index.tsx                      # Home screen with lesson list
│   └── preview/
│       └── mental_l01_preview.tsx     # mental_l01 preview screen
├── components/
│   └── LessonScreen.tsx               # Reusable lesson UI component
├── hooks/
│   └── useLessonLoader.ts             # JSON loading with validation
├── utils/
│   └── lessonValidator.ts             # Schema validation utilities
└── package.json
```

## Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator

## Troubleshooting

### Metro bundler errors
```bash
npm start -- --clear
```

### JSON validation errors
Check console for specific validation messages. Common issues:
- Missing required fields
- `totalQuestions` doesn't match cards count
- Invalid `answerIndex` value

### TypeScript errors
```bash
npx tsc --noEmit
```
