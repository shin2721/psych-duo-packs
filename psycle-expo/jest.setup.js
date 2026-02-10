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
