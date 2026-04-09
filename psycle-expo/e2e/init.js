// Timeout configuration is handled via testEnvironment in jest.config.js.
// Previously, DetoxCircusEnvironment(config) was called here but it conflicts
// with testEnvironment: 'detox/runners/jest/testEnvironment', causing the
// Detox worker to fall back to DetoxSecondaryContext (no tap/swipe/screenshot).
//
// Timeouts can be configured via DETOX_* env vars or detox.config overrides
// if the defaults (120s setup, 30s response) are insufficient.