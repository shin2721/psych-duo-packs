import type { Question } from "../../types/question";

export interface QuestionInteractionProps {
  currentOrder: number[];
  inputText: string;
  onDragEnd: () => void;
  onDragStart: () => void;
  onMatch: (pairs: number[][]) => void;
  onReorder: (newOrder: number[]) => void;
  onSelect: (index: number) => void;
  onSelectConsequence: (isPositive: boolean) => void;
  onSelectResponse: (index: number) => void;
  onSetInputText: (value: string) => void;
  onSubmitOrder: () => void;
  onSubmitTextInput: () => void;
  onSwipe: (direction: "left" | "right") => void;
  onToggle: (index: number) => void;
  question: Question;
  questionChoices: string[];
  questionText: string;
  revealedIndexes: number[];
  selectedIndex: number | null;
  selectedIndexes: number[];
  selectedPairs: number[][];
  selectedResponse: number | null;
  showResult: boolean;
  swipeDirection: "left" | "right" | null;
}
