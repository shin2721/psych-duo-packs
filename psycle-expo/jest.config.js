module.exports = {
  preset: "react-native",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@react-native-async-storage/async-storage$":
      "@react-native-async-storage/async-storage/jest/async-storage-mock",
  },
};
