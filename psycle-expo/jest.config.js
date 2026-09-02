// Reminder rules and other scheduling code use the device's local time. Tests are
// written in JST; pin the zone so they pass on UTC runners (GitHub Actions) too.
process.env.TZ = 'Asia/Tokyo';

module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  preset: "react-native",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
};
