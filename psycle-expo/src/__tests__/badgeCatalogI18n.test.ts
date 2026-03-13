import { BADGES } from "../../lib/badges";
import i18n from "../../lib/i18n";
import { de } from "../../lib/locales/de";
import { en } from "../../lib/locales/en";
import { es } from "../../lib/locales/es";
import { fr } from "../../lib/locales/fr";
import { ja } from "../../lib/locales/ja";
import { ko } from "../../lib/locales/ko";
import { pt } from "../../lib/locales/pt";
import { zh } from "../../lib/locales/zh";

const LOCALES = {
  ja,
  en,
  es,
  zh,
  fr,
  de,
  ko,
  pt,
} as const;

type LocaleCode = keyof typeof LOCALES;
type BadgeField = "name" | "description";

function getObjectValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") return undefined;
  return (source as Record<string, unknown>)[key];
}

function getBadgeTranslation(localeCode: LocaleCode, badgeId: string, field: BadgeField): string | undefined {
  const locale = LOCALES[localeCode];
  const badges = getObjectValue(locale, "badges");
  const catalog = getObjectValue(badges, "catalog");
  const entry = getObjectValue(catalog, badgeId);
  const value = getObjectValue(entry, field);
  return typeof value === "string" ? value : undefined;
}

describe("badge catalog i18n", () => {
  const originalLocale = i18n.locale;

  afterEach(() => {
    i18n.locale = originalLocale;
  });

  test("every badge has name and description entries in every supported locale", () => {
    for (const localeCode of Object.keys(LOCALES) as LocaleCode[]) {
      for (const badge of BADGES) {
        const name = getBadgeTranslation(localeCode, badge.id, "name");
        const description = getBadgeTranslation(localeCode, badge.id, "description");

        expect(name).toBeDefined();
        expect(typeof name).toBe("string");
        expect(name?.trim()).not.toBe("");

        expect(description).toBeDefined();
        expect(typeof description).toBe("string");
        expect(description?.trim()).not.toBe("");
      }
    }
  });

  test("badge getters resolve to the active locale values", () => {
    for (const localeCode of Object.keys(LOCALES) as LocaleCode[]) {
      i18n.locale = localeCode;

      for (const badge of BADGES) {
        expect(badge.name).toBe(getBadgeTranslation(localeCode, badge.id, "name"));
        expect(badge.description).toBe(getBadgeTranslation(localeCode, badge.id, "description"));
      }
    }
  });
});
