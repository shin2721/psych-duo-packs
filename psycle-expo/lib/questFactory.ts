import type { QuestInstance, QuestTemplate } from "./questDefinitions";
import { MONTHLY_FIXED_QUEST_TEMPLATES, QUEST_TEMPLATE_BY_ID } from "./questTemplates";

export function createQuestInstanceFromTemplate(
  template: QuestTemplate,
  cycleKey: string
): QuestInstance {
  return {
    id: `${template.templateId}__${cycleKey}`,
    templateId: template.templateId,
    type: template.type,
    metric: template.metric,
    need: template.need,
    progress: 0,
    rewardXp: template.rewardXp,
    claimed: false,
    chestState: "closed",
    title: template.title,
    titleKey: template.titleKey,
    cycleKey,
  };
}

export function createMonthlyFixedQuestInstances(cycleKey: string): QuestInstance[] {
  return MONTHLY_FIXED_QUEST_TEMPLATES.map((template) => ({
    ...createQuestInstanceFromTemplate(template, cycleKey),
    id: template.templateId,
  }));
}

export function getQuestTemplateNeed(templateId: string): number | null {
  const template = QUEST_TEMPLATE_BY_ID.get(templateId);
  if (!template) return null;
  return template.need;
}
