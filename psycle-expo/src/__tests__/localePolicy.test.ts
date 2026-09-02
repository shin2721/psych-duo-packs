import localeConfig from "../../config/locales.json";
import i18n from "../../lib/i18n";
import { LOCALE_OPTIONS, SUPPORTED_LOCALES } from "../../lib/LocaleContext";
import { getHealthDataForLocale } from "../../data/lessons/health_units";
import { getMentalDataForLocale } from "../../data/lessons/mental_units";
import { getMoneyDataForLocale } from "../../data/lessons/money_units";
import { getSocialDataForLocale } from "../../data/lessons/social_units";
import { getStudyDataForLocale } from "../../data/lessons/study_units";
import { getWorkDataForLocale } from "../../data/lessons/work_units";

// Locale policy: ja is the hand-written source, every other locale is generated
// from it and switched on through config/locales.json. These tests pin the
// contract the scripts, the runtime, and CI all read from that one file.
//
// Inactive examples are derived from the config so activating a locale never
// breaks these tests: every target that is not active, plus a locale code that
// is not a target at all (a device language the product does not offer).
const INACTIVE_TARGETS = localeConfig.targets.filter((locale) => !localeConfig.active.includes(locale));
const UNKNOWN_LOCALE = "zz";
const INACTIVE_LOCALES = [...INACTIVE_TARGETS, UNKNOWN_LOCALE];

describe("locale policy", () => {
  test("ja is the source and is always active", () => {
    expect(localeConfig.source).toBe("ja");
    expect(localeConfig.active).toContain("ja");
    expect(localeConfig.targets).not.toContain("ja");
  });

  test("every active locale is registered in the i18n runtime, and nothing else is", () => {
    expect(Object.keys(i18n.translations).sort()).toEqual([...localeConfig.active].sort());
  });

  test("the language picker offers exactly the active locales", () => {
    expect([...SUPPORTED_LOCALES]).toEqual(localeConfig.active);
    expect(LOCALE_OPTIONS.map((option) => option.code)).toEqual(localeConfig.active);
  });

  test("an inactive locale falls back to the ja UI copy", () => {
    const previous = i18n.locale;
    try {
      i18n.locale = "ja";
      const jaCopy = i18n.t("common.close");
      for (const locale of INACTIVE_LOCALES) {
        i18n.locale = locale;
        expect(i18n.t("common.close")).toBe(jaCopy);
      }
    } finally {
      i18n.locale = previous;
    }
  });

  test("every unit serves the ja lesson data to an inactive locale", () => {
    const getters = [
      getHealthDataForLocale,
      getMentalDataForLocale,
      getMoneyDataForLocale,
      getSocialDataForLocale,
      getStudyDataForLocale,
      getWorkDataForLocale,
    ];
    for (const getter of getters) {
      expect(getter("ja").length).toBeGreaterThan(0);
      for (const locale of INACTIVE_LOCALES) {
        expect(getter(locale)).toBe(getter("ja"));
      }
    }
  });
});
