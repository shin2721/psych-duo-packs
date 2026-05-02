import { readFileSync } from "fs";

type GamificationConfig = {
  combo_xp: { bonus_cap_per_lesson: number };
  comeback_reward: { reward_energy: number; reward_gems: number; threshold_days: number };
  daily_goal: { default_xp: number; reward_gems: number };
  double_xp_boost: { cost_gems: number; duration_minutes: number };
  quest_rewards: { claim_bonus_gems_by_type: { daily: number; weekly: number; monthly: number } };
  quest_reroll: { cost_gems: number; daily_limit: number };
  shop_sinks: { energy_full_refill: { cost_gems: number; daily_limit: number } };
  streak_repair: { cost_gems: number; window_hours: number };
  xp_rewards: { correct_answer: number; felt_better_positive: number; lesson_complete: number };
};

function readProjectFile(relativePath: string): string {
  return readFileSync(`${process.cwd()}/${relativePath}`, "utf8");
}

describe("engagement principles contract", () => {
  const principles = readProjectFile("docs/ENGAGEMENT_PRINCIPLES.md");
  const gamification = JSON.parse(readProjectFile("config/gamification.json")) as GamificationConfig;

  test("documents the live economy values that product decisions depend on", () => {
    expect(principles).toContain(`Current daily goal is \`${gamification.daily_goal.default_xp} XP\``);
    expect(principles).toContain(`current lesson completion is \`${gamification.xp_rewards.lesson_complete} XP\``);
    expect(principles).toContain(`\`${gamification.xp_rewards.correct_answer} XP\``);
    expect(principles).toContain(`\`${gamification.xp_rewards.felt_better_positive} XP\``);
    expect(principles).toContain(`\`${gamification.daily_goal.reward_gems} gems\``);
    expect(principles).toContain(
      `\`${gamification.quest_rewards.claim_bonus_gems_by_type.daily}/${gamification.quest_rewards.claim_bonus_gems_by_type.weekly}/${gamification.quest_rewards.claim_bonus_gems_by_type.monthly} gems\``
    );
    expect(principles).toContain(
      `\`+${gamification.comeback_reward.reward_energy} energy\` and \`+${gamification.comeback_reward.reward_gems} gems\``
    );
    expect(principles).toContain(`\`${gamification.shop_sinks.energy_full_refill.cost_gems} gems\``);
    expect(principles).toContain(`\`${gamification.double_xp_boost.cost_gems} gems\``);
    expect(principles).toContain(`\`${gamification.double_xp_boost.duration_minutes} minutes\``);
    expect(principles).toContain(`\`${gamification.streak_repair.cost_gems} gems\``);
    expect(principles).toContain(`\`${gamification.streak_repair.window_hours}h window\``);
    expect(principles).toContain(
      `\`${gamification.quest_reroll.cost_gems} gems\`, \`${gamification.quest_reroll.daily_limit}/day\``
    );
  });

  test("uses implemented analytics names instead of stale principle-only names", () => {
    expect(principles).toContain("`daily_goal_reached`");
    expect(principles).toContain("`quest_claimed`");
    expect(principles).toContain("`streak_repair_offered`");
    expect(principles).toContain("`comeback_reward_offered`");
    expect(principles).toContain("`comeback_reward_claimed`");
    expect(principles).toContain("`course_support_shown`");
    expect(principles).toContain("`course_support_started`");
    expect(principles).toContain("`course_support_completed`");
    expect(principles).not.toContain("`daily_goal_completed`");
    expect(principles).not.toContain("`comeback_reward_shown`");
  });
});
