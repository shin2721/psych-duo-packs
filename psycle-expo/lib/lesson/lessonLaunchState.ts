export type LessonLaunchState = "loading" | "ready" | "energy_blocked" | "failed";

export function resolveLessonLaunchGate(params: {
  consumeEnergy: (cost: number) => boolean;
  lessonEnergyCost: number;
  questionCount: number;
  skipEnergyCharge?: boolean;
}): Exclude<LessonLaunchState, "loading"> {
  if (params.questionCount < 1) return "failed";
  if (params.skipEnergyCharge) return "ready";
  return params.consumeEnergy(params.lessonEnergyCost) ? "ready" : "energy_blocked";
}

export function resolveLessonRuntimeAvailability(params: {
  hasCurrentQuestion: boolean;
  launchState: LessonLaunchState;
}): {
  canStart: boolean;
  energyBlocked: boolean;
  loadError: boolean;
} {
  return {
    canStart: params.launchState === "ready" && params.hasCurrentQuestion,
    energyBlocked: params.launchState === "energy_blocked",
    loadError: params.launchState === "failed",
  };
}
