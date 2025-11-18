import { useState, useEffect } from 'react';
import { Lesson } from '../components/LessonScreen';
import { validateLessonData, createFallbackLesson } from '../utils/lessonValidator';

/**
 * Custom hook to load lesson data from JSON files with validation
 * @param lessonId - The lesson ID to load (e.g., 'mental_l01')
 * @param useFallback - If true, returns fallback lesson on error instead of null (default: true)
 * @returns { lesson, loading, error }
 */
export function useLessonLoader(lessonId: string, useFallback: boolean = true) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import JSON file dynamically based on lessonId
        let lessonData: any;

        // Map lesson IDs to their file paths
        // Add new lesson mappings here as needed
        try {
          if (lessonId === 'mental_l01') {
            // In Expo, we need to use require() for local JSON files
            // Force clear require() cache to ensure fresh data
            const jsonPath = require.resolve('../../data/lessons/mental_v2.json');
            delete require.cache[jsonPath];

            lessonData = require('../../data/lessons/mental_v2.json');
            console.log('=== LOADED LESSON DATA (v2 - CACHE CLEARED) ===');
            console.log('Lesson ID:', lessonData.id);
            console.log('First question:', lessonData.cards?.[0]?.q);
            console.log('First explain:', lessonData.cards?.[0]?.explain);
            console.log('Total cards:', lessonData.cards?.length);
            console.log('=========================');
          } else {
            throw new Error(`Unknown lesson ID: ${lessonId}`);
          }
        } catch (requireError) {
          console.error('Failed to require JSON file:', requireError);
          throw new Error(
            `Failed to load lesson file for '${lessonId}'. Make sure the JSON file exists.`
          );
        }

        // Validate the loaded data structure
        const validation = validateLessonData(lessonData);
        if (!validation.isValid) {
          console.error('Lesson validation errors:', validation.errors);
          throw new Error(
            `Invalid lesson data format:\n${validation.errors.slice(0, 5).join('\n')}`
          );
        }

        // Additional check: ensure lesson ID matches
        if (lessonData.id !== lessonId) {
          console.warn(
            `Lesson ID mismatch: expected '${lessonId}', got '${lessonData.id}'`
          );
        }

        setLesson(lessonData as Lesson);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load lesson data';
        console.error('Failed to load lesson:', errorMessage);
        setError(errorMessage);

        // Use fallback lesson if enabled
        if (useFallback) {
          console.log('Using fallback lesson due to error');
          setLesson(createFallbackLesson());
        }
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [lessonId, useFallback]);

  return { lesson, loading, error };
}
