import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  V2_PILOT_SCHEMA_VERSION,
  V2_PILOT_UNIT_ID,
} from "../../types/v2Pilot";
import { resolveV2OwnerPilotEnabled } from "../../lib/v2-pilot/featureFlag";
import {
  createInitialV2PilotSnapshot,
  getV2PilotStorageKey,
  loadV2PilotSnapshot,
  normalizeV2PilotSnapshot,
  resetV2PilotSnapshot,
  saveV2PilotSnapshot,
} from "../../lib/v2-pilot/storage";

const NOW = "2026-07-18T08:00:00.000Z";

describe("V2 owner pilot storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("uses an isolated user-scoped key", () => {
    expect(getV2PilotStorageKey("owner-1")).toBe(
      "psycle:v2-owner-pilot:ai-diversity:v1:owner-1"
    );
    expect(getV2PilotStorageKey(null)).toBe(
      "psycle:v2-owner-pilot:ai-diversity:v1:local"
    );
  });

  test("normalizes a compatible partial snapshot without admitting malformed fields", () => {
    const normalized = normalizeV2PilotSnapshot(
      {
        schemaVersion: V2_PILOT_SCHEMA_VERSION,
        unitId: V2_PILOT_UNIT_ID,
        currentStep: "not-a-step",
        qualityPrediction: {
          direction: "increase",
          reason: "  AI can connect distant ideas  ",
          confidence: 130.2,
        },
        diversityPrediction: {
          direction: "wider",
          reason: 42,
          confidence: "80",
        },
        qualityUpdate: {
          comparison: "higher_than_expected",
          reason: "  external ratings changed my view ",
          confidence: -8,
        },
        boundaryAnswers: {
          headline_1: { boundaryTag: " trait leap ", note: " too broad " },
          headline_2: { boundaryTag: 1, note: null },
        },
        recall: { answer: "  average ratings rose ", confidence: 64.6 },
        completedAt: "2026-07-18T07:00:00.000Z",
        updatedAt: "not-a-date",
      },
      NOW
    );

    expect(normalized).toEqual({
      schemaVersion: V2_PILOT_SCHEMA_VERSION,
      unitId: V2_PILOT_UNIT_ID,
      currentStep: "prediction",
      qualityPrediction: {
        direction: "increase",
        reason: "AI can connect distant ideas",
        confidence: 100,
      },
      diversityPrediction: {
        direction: null,
        reason: "",
        confidence: null,
      },
      qualityUpdate: {
        comparison: "higher_than_expected",
        reason: "external ratings changed my view",
        confidence: 0,
      },
      boundaryAnswers: {
        headline_1: { boundaryTag: "trait leap", note: "too broad" },
        headline_2: null,
        headline_3: null,
        headline_4: null,
      },
      recall: { answer: "average ratings rose", confidence: 65 },
      completedAt: null,
      updatedAt: NOW,
    });
  });

  test("returns the initial snapshot for incompatible or malformed storage", async () => {
    const initial = createInitialV2PilotSnapshot(NOW);
    expect(
      normalizeV2PilotSnapshot(
        { schemaVersion: 99, unitId: V2_PILOT_UNIT_ID },
        NOW
      )
    ).toEqual(initial);

    await AsyncStorage.setItem(getV2PilotStorageKey("owner-1"), "{bad-json");
    await expect(loadV2PilotSnapshot("owner-1", NOW)).resolves.toEqual(initial);
  });

  test("saves normalized state and reset removes only the pilot key", async () => {
    await AsyncStorage.setItem("completed_lessons_owner-1", "legacy-progress");
    const snapshot = createInitialV2PilotSnapshot("2026-07-18T07:00:00.000Z");
    snapshot.currentStep = "diversity_prediction";
    snapshot.qualityPrediction = {
      direction: "increase",
      reason: "my prediction",
      confidence: 72,
    };

    const saved = await saveV2PilotSnapshot("owner-1", snapshot, NOW);
    expect(saved.updatedAt).toBe(NOW);
    await expect(loadV2PilotSnapshot("owner-1", NOW)).resolves.toEqual(saved);

    const completed = await saveV2PilotSnapshot(
      "owner-1",
      { ...saved, currentStep: "complete" },
      "2026-07-18T09:00:00.000Z"
    );
    expect(completed.completedAt).toBe("2026-07-18T09:00:00.000Z");

    await resetV2PilotSnapshot("owner-1");
    expect(await AsyncStorage.getItem(getV2PilotStorageKey("owner-1"))).toBeNull();
    expect(await AsyncStorage.getItem("completed_lessons_owner-1")).toBe(
      "legacy-progress"
    );
  });
});

describe("V2 owner pilot feature flag", () => {
  test("defaults on only in development and exact zero disables it", () => {
    expect(resolveV2OwnerPilotEnabled(true, undefined)).toBe(true);
    expect(resolveV2OwnerPilotEnabled(true, "1")).toBe(true);
    expect(resolveV2OwnerPilotEnabled(true, "0")).toBe(false);
    expect(resolveV2OwnerPilotEnabled(false, "1")).toBe(false);
  });
});
