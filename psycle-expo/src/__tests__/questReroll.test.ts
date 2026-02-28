import {
  DAILY_QUEST_TEMPLATES,
  createMonthlyFixedQuestInstances,
  createQuestInstanceFromTemplate,
} from "../../lib/questDefinitions";
import { buildQuestBoardForCycles, rerollQuestInstance } from "../../lib/questRotation";
import type { QuestCycleKeys } from "../../lib/questCycles";

const BASE_KEYS: QuestCycleKeys = {
  daily: "2026-03-10",
  weekly: "2026-W11",
  monthly: "2026-03",
};

describe("rerollQuestInstance", () => {
  test("daily quest can be rerolled and resets quest state", () => {
    const { quests } = buildQuestBoardForCycles({
      cycleKeys: BASE_KEYS,
      previousSelection: { daily: [], weekly: [] },
      random: () => 0,
    });
    const target = quests.find((quest) => quest.type === "daily");
    expect(target).toBeDefined();

    const result = rerollQuestInstance({ quests, questId: target!.id, random: () => 0 });

    expect(result.success).toBe(true);
    expect(result.type).toBe("daily");
    expect(result.oldTemplateId).toBe(target!.templateId);
    expect(result.newTemplateId).not.toBe(target!.templateId);

    const replaced = result.quests.find((quest) => quest.id === target!.id);
    expect(replaced).toBeUndefined();

    const rerolledQuest = result.quests.find((quest) => quest.templateId === result.newTemplateId);
    expect(rerolledQuest?.cycleKey).toBe(target!.cycleKey);
    expect(rerolledQuest?.progress).toBe(0);
    expect(rerolledQuest?.claimed).toBe(false);
    expect(rerolledQuest?.chestState).toBe("closed");
  });

  test("weekly quest can be rerolled", () => {
    const { quests } = buildQuestBoardForCycles({
      cycleKeys: BASE_KEYS,
      previousSelection: { daily: [], weekly: [] },
      random: () => 0,
    });
    const target = quests.find((quest) => quest.type === "weekly");
    expect(target).toBeDefined();

    const result = rerollQuestInstance({ quests, questId: target!.id, random: () => 0 });

    expect(result.success).toBe(true);
    expect(result.type).toBe("weekly");
    expect(result.oldTemplateId).toBe(target!.templateId);
    expect(result.newTemplateId).not.toBe(target!.templateId);
  });

  test("monthly quest reroll returns invalid_type", () => {
    const monthly = createMonthlyFixedQuestInstances(BASE_KEYS.monthly);
    const target = monthly[0];

    const result = rerollQuestInstance({ quests: monthly, questId: target.id, random: () => 0 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_type");
  });

  test("completed quest reroll returns already_completed", () => {
    const { quests } = buildQuestBoardForCycles({
      cycleKeys: BASE_KEYS,
      previousSelection: { daily: [], weekly: [] },
      random: () => 0,
    });
    const target = quests.find((quest) => quest.type === "daily");
    expect(target).toBeDefined();

    const completedQuests = quests.map((quest) =>
      quest.id === target!.id
        ? {
            ...quest,
            progress: quest.need,
          }
        : quest
    );

    const result = rerollQuestInstance({ quests: completedQuests, questId: target!.id, random: () => 0 });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("already_completed");
  });

  test("returns no_candidate when all same-type templates are already on board", () => {
    const allDaily = DAILY_QUEST_TEMPLATES.map((template) =>
      createQuestInstanceFromTemplate(template, BASE_KEYS.daily)
    );

    const result = rerollQuestInstance({
      quests: allDaily,
      questId: allDaily[0].id,
      random: () => 0,
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("no_candidate");
  });
});
