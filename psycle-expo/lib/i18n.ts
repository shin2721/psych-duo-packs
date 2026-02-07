import { I18n } from 'i18n-js';
import { ja } from './locales/ja';
import { en } from './locales/en';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { ko } from './locales/ko';
import { pt } from './locales/pt';

const i18n = new I18n({
    ja,
    en,
    es,
    zh,
    fr,
    de,
    ko,
    pt,
});

// Set the locale once at the beginning of your app.
i18n.enableFallback = true;
i18n.defaultLocale = 'ja';

// Resolve locale at runtime. In Jest, expo-localization may not be transformable.
let deviceLocale = 'ja';
try {
    const localization = require('expo-localization');
    deviceLocale = localization.getLocales?.()[0]?.languageCode ?? 'ja';
} catch {
    deviceLocale = 'ja';
}
i18n.locale = deviceLocale;

export default i18n;
