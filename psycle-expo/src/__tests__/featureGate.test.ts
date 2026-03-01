// src/__tests__/featureGate.test.ts
import {
  canUseMistakesHub,
  consumeMistakesHub,
  getMistakesHubRemaining,
  hasProItemAccess,
  hasLiteItemAccess,
  isExplainEnabled,
} from "../featureGate";

describe("featureGate", () => {
  describe("MistakesHub", () => {
    test("Free プランは利用不可", () => {
      expect(canUseMistakesHub("user1", "free")).toBe(false);
      expect(getMistakesHubRemaining("user1", "free")).toBe(0);
    });

    test("Pro プランは無制限", () => {
      expect(canUseMistakesHub("user2", "pro")).toBe(true);
      expect(getMistakesHubRemaining("user2", "pro")).toBe(null);
    });

    test("Max プランは無制限", () => {
      expect(canUseMistakesHub("user3", "max")).toBe(true);
      expect(getMistakesHubRemaining("user3", "max")).toBe(null);
    });

    test("Pro プランでの消費後も利用可能", () => {
      const userId = "user_pro_test";
      expect(canUseMistakesHub(userId, "pro")).toBe(true);

      // 複数回消費
      for (let i = 0; i < 10; i++) {
        consumeMistakesHub(userId);
      }

      expect(canUseMistakesHub(userId, "pro")).toBe(true);
      expect(getMistakesHubRemaining(userId, "pro")).toBe(null);
    });
  });

  describe("Pro Item Access", () => {
    test("Free プランはPro問題にアクセス不可", () => {
      expect(hasProItemAccess("free")).toBe(false);
    });

    test("Pro プランはPro問題にアクセス可能", () => {
      expect(hasProItemAccess("pro")).toBe(true);
    });

    test("Max プランはPro問題にアクセス可能", () => {
      expect(hasProItemAccess("max")).toBe(true);
    });
  });

  describe("Lite Item Access", () => {
    test("全プランでLite問題にアクセス可能", () => {
      expect(hasLiteItemAccess("free")).toBe(true);
      expect(hasLiteItemAccess("pro")).toBe(true);
      expect(hasLiteItemAccess("max")).toBe(true);
    });
  });

  describe("AI Explain", () => {
    test("全プランでAI解説は無効", () => {
      expect(isExplainEnabled("free")).toBe(false);
      expect(isExplainEnabled("pro")).toBe(false);
      expect(isExplainEnabled("max")).toBe(false);
    });
  });
});
