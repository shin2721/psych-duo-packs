jest.mock("../../lib/pricing", () => ({
  getPlanPrice: jest.fn(),
}));

jest.mock("../../lib/gamificationConfig", () => ({
  getShopSinksConfig: jest.fn(() => ({
    energy_full_refill: {
      enabled: true,
      cost_gems: 15,
    },
  })),
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  },
}));

const { getPlanPrice } = require("../../lib/pricing");
const {
  buildShopItems,
  formatPlanPrice,
  getDateLocaleForLanguage,
  getEnergyRecoveryMinutesRemaining,
} = require("../../lib/shop/shopCatalog");

describe("shopCatalog", () => {
  test("returns language locale when supported", () => {
    expect(getDateLocaleForLanguage("ja")).toBe("ja-JP");
    expect(getDateLocaleForLanguage("xx")).toBeUndefined();
  });

  test("computes energy recovery minutes remaining", () => {
    expect(
      getEnergyRecoveryMinutesRemaining({
        isSubscriptionActive: false,
        energy: 1,
        maxEnergy: 5,
        lastEnergyUpdateTime: 0,
        energyRefillMinutes: 10,
        nowTs: 3 * 60 * 1000,
      })
    ).toBe(7);
  });

  test("falls back to numeric plan price when pricing helper throws", () => {
    (getPlanPrice as jest.Mock).mockImplementation(() => {
      throw new Error("pricing failed");
    });

    expect(
      formatPlanPrice(
        {
          id: "pro",
          priceMonthly: 980,
        },
        "monthly"
      )
    ).toBe("¥980");
  });

  test("builds freeze, double xp, and energy refill items", () => {
    const items = buildShopItems({
      buyFreeze: jest.fn(() => true),
      buyEnergyFullRefill: jest.fn(() => true),
      buyDoubleXP: jest.fn(() => true),
      isDoubleXpActive: false,
      doubleXpEndTime: null,
    });

    expect(items.map((item: { id: string }) => item.id)).toEqual([
      "freeze",
      "double_xp",
      "energy_full_refill",
    ]);
  });
});
