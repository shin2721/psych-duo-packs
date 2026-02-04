import mental_l01_ja from "./mental_l01.ja.json";
import mental_l02_ja from "./mental_l02.ja.json";
import mental_l03_ja from "./mental_l03.ja.json";
import mental_l04_ja from "./mental_l04.ja.json";
import mental_l05_ja from "./mental_l05.ja.json";

// English translations (fallback to ja if not available)
import mental_l01_en from "./mental_l01.en.json";

// Japanese (base) - always available
export const mentalData_ja = [
  ...mental_l01_ja,
  ...mental_l02_ja,
  ...mental_l03_ja,
  ...mental_l04_ja,
  ...mental_l05_ja,
];

// English - uses en where available, falls back to ja
export const mentalData_en = [
  ...mental_l01_en,
  ...mental_l02_ja, // fallback to ja
  ...mental_l03_ja, // fallback to ja
  ...mental_l04_ja, // fallback to ja
  ...mental_l05_ja, // fallback to ja
];

// Default export (ja for backward compatibility)
export const mentalData = mentalData_ja;

/**
 * Get mental data for specified locale with fallback
 * Fallback order: requested -> en -> ja
 */
export function getMentalDataForLocale(locale: string): any[] {
  const lang = locale.split('-')[0].toLowerCase();

  if (lang === 'en') {
    return mentalData_en;
  }

  // All other languages fall back to ja for now
  return mentalData_ja;
}
