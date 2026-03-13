import { readFileSync } from "fs";
import { join } from "path";

type Seed = {
  domain: string;
};

describe("content-generator seed domain coverage", () => {
  test("keeps at least three seeds for each canonical domain", () => {
    const filePath = join(
      __dirname,
      "../../scripts/content-generator/seeds/psychology_seeds.json"
    );
    const seeds = JSON.parse(readFileSync(filePath, "utf-8")) as Seed[];

    const domainCounts = seeds.reduce<Record<string, number>>((acc, seed) => {
      acc[seed.domain] = (acc[seed.domain] || 0) + 1;
      return acc;
    }, {});

    const requiredDomains = ["social", "money", "mental", "health", "work", "study"] as const;
    for (const domain of requiredDomains) {
      expect(domainCounts[domain] || 0).toBeGreaterThanOrEqual(3);
    }
  });
});
