import { I18n } from 'i18n-js';
import { ja } from './locales/ja';

// Locale policy (config/locales.json): ja is the only hand-written locale.
// Other locales are generated from ja and registered here once they are active.
// Any locale that is not registered falls back to ja (enableFallback below).
const i18n = new I18n({
    ja,
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
