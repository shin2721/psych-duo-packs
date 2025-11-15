import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LessonScreen from '../../components/LessonScreen';
import { useLessonLoader } from '../../hooks/useLessonLoader';

/**
 * Preview screen for mental_l01 lesson
 * Loads lesson data dynamically from data/lessons/mental.json
 */
export default function MentalL01Preview() {
  const { lesson, loading, error } = useLessonLoader('mental_l01');

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Lesson not found'}</Text>
      </View>
    );
  }

  return <LessonScreen lesson={lesson} />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    padding: 20,
  },
});
