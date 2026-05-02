// Global Jest setup for RN tests

// AsyncStorage: NativeModule null 回避
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// expo-constants is ESM; mock it in Jest's CJS runtime.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo/env', () => ({ env: process.env }), { virtual: true });
jest.mock('expo/virtual/env', () => ({ env: process.env }), { virtual: true });

jest.mock('expo-crypto', () => {
  const crypto = require('node:crypto');
  return {
    CryptoDigestAlgorithm: {
      SHA256: 'SHA-256',
    },
    digestStringAsync: jest.fn(async (_algorithm, content) =>
      crypto.createHash('sha256').update(String(content)).digest('hex')
    ),
  };
});

jest.mock('react-native-url-polyfill/auto', () => ({}));
