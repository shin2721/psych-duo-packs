# Psycle Expo - Lesson Preview App

Preview app for testing new psych-duo lessons in Expo simulator.

## Quick Start

```bash
cd psycle-expo
npm install
npm start
```

## Features

- Preview mental_l01 lesson (15 cognitive bias questions)
- Interactive MCQ interface
- Progress tracking
- Explanation after each question
- Score calculation

## Usage

1. Start the Expo dev server: `npm start`
2. Open in simulator (press `i` for iOS, `a` for Android)
3. Tap "Preview mental L01" button
4. Complete the lesson interactively

## Lesson Data

The mental_l01 lesson is loaded from:
- Embedded data in `app/preview/mental_l01_preview.tsx`
- Original JSON: `../data/lessons/mental.json`

## Structure

```
psycle-expo/
├── app/
│   ├── _layout.tsx              # Root navigator
│   ├── index.tsx                # Home screen
│   └── preview/
│       └── mental_l01_preview.tsx  # Preview screen
├── components/
│   └── LessonScreen.tsx         # Lesson UI component
└── package.json
```

## Requirements

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator
