import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

/**
 * Fisher-Yates shuffle algorithm
 * Returns a shuffled copy of the array along with index mapping
 */
function shuffleChoices(choices: string[], correctIndex: number): {
  shuffled: string[];
  mapping: number[];
  newCorrectIndex: number;
} {
  const indices = choices.map((_, i) => i);
  const shuffled = [...choices];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Find new position of correct answer
  const newCorrectIndex = indices.indexOf(correctIndex);

  return {
    shuffled,
    mapping: indices,
    newCorrectIndex,
  };
}

export type QuestionCard = {
  id: string;
  type: 'mcq';
  q: string;
  choices: string[];
  answerIndex: number;
  explain: string;
  actionTip?: string;
};

export type Lesson = {
  id: string;
  meta: {
    theme: string;
    track: string;
    arc: string;
    lessonIndex?: number;
    totalQuestions: number;
  };
  cards: QuestionCard[];
};

type LessonScreenProps = {
  lesson: Lesson;
};

export default function LessonScreen({ lesson }: LessonScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentCard = lesson.cards[currentIndex];
  const progress = ((currentIndex + 1) / lesson.cards.length) * 100;

  // Shuffle choices for current question (memoized per question)
  const { shuffled: shuffledChoices, newCorrectIndex } = useMemo(
    () => shuffleChoices(currentCard.choices, currentCard.answerIndex),
    [currentIndex, currentCard.choices, currentCard.answerIndex]
  );

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return; // Already answered

    setSelectedAnswer(index);
    setShowExplanation(true);

    // Check if selected shuffled index matches the new correct index
    if (index === newCorrectIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < lesson.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCorrectCount(0);
  };

  const isFinished = currentIndex === lesson.cards.length - 1 && showExplanation;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.lessonTitle}>{lesson.meta.theme}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {lesson.cards.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.questionId}>{currentCard.id}</Text>
        <Text style={styles.question}>{currentCard.q}</Text>

        <View style={styles.choicesContainer}>
          {shuffledChoices.map((choice, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === newCorrectIndex;
            const showCorrect = showExplanation && isCorrect;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <Pressable
                key={index}
                style={[
                  styles.choice,
                  isSelected && styles.choiceSelected,
                  showCorrect && styles.choiceCorrect,
                  showIncorrect && styles.choiceIncorrect,
                ]}
                onPress={() => handleSelectAnswer(index)}
                disabled={showExplanation}
              >
                <Text
                  style={[
                    styles.choiceText,
                    (isSelected || showCorrect) && styles.choiceTextSelected,
                  ]}
                >
                  {choice}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === newCorrectIndex ? '正解！' : 'もう一度整理しよう'}
            </Text>
            <Text style={styles.explanationText}>{currentCard.explain}</Text>
          </View>
        )}

        {showExplanation && currentCard.actionTip && (
          <View style={styles.actionTipContainer}>
            <Text style={styles.actionTipIcon}>💡</Text>
            <View style={styles.actionTipContent}>
              <Text style={styles.actionTipLabel}>今日できる一歩</Text>
              <Text style={styles.actionTipText}>{currentCard.actionTip}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {showExplanation && (
        <View style={styles.footer}>
          {isFinished ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsText}>
                完了！正解率: {correctCount} / {lesson.cards.length} (
                {Math.round((correctCount / lesson.cards.length) * 100)}%)
              </Text>
              <Pressable style={styles.button} onPress={handleRestart}>
                <Text style={styles.buttonText}>もう一度</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>次へ</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 50,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 28,
  },
  choicesContainer: {
    gap: 12,
  },
  choice: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  choiceSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  choiceCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  choiceIncorrect: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  choiceTextSelected: {
    fontWeight: '600',
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 12,
  },
  resultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionTipContainer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionTipIcon: {
    fontSize: 22,
    marginTop: 1,
  },
  actionTipContent: {
    flex: 1,
  },
  actionTipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 6,
  },
  actionTipText: {
    fontSize: 15,
    color: '#0D47A1',
    lineHeight: 22,
    fontWeight: '500',
  },
});
