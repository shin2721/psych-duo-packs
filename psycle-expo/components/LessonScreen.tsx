import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export type QuestionCard = {
  id: string;
  type: 'mcq';
  q: string;
  choices: string[];
  answerIndex: number;
  explain: string;
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

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return; // Already answered

    setSelectedAnswer(index);
    setShowExplanation(true);

    if (index === currentCard.answerIndex) {
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
          {currentCard.choices.map((choice, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentCard.answerIndex;
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
              {selectedAnswer === currentCard.answerIndex ? '正解！' : '不正解'}
            </Text>
            <Text style={styles.explanationText}>{currentCard.explain}</Text>
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
});
