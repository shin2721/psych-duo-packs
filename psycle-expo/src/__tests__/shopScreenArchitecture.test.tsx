import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("shop screen architecture", () => {
  test("shop screen delegates major render sections to components", () => {
    const source = read("app/(tabs)/shop.tsx");
    const subscriptions = read("components/shop/ShopSubscriptionsSection.tsx");
    const subscriptionCards = read("components/shop/ShopSubscriptionCards.tsx");
    const items = read("components/shop/ShopItemsSection.tsx");

    expect(source).toContain('import { ShopSubscriptionsSection }');
    expect(source).toContain('import { ShopItemsSection }');
    expect(source).toContain("<ShopSubscriptionsSection");
    expect(source).toContain("<ShopItemsSection");
    expect(source).not.toContain("purchasablePlans.map((plan)");
    expect(source).not.toContain("shopItems.map((item)");

    expect(subscriptions).toContain("export function ShopSubscriptionsSection");
    expect(subscriptions).toContain("SubscriptionPlansGrid");
    expect(subscriptionCards).toContain("testID={`shop-subscribe-${plan.id}`}");
    expect(items).toContain("export function ShopItemsSection");
    expect(items).toContain("testID={`shop-buy-${item.id}`}");
  });
});
