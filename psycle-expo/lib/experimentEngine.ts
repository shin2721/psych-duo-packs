import {
  getExperimentsConfig,
  type ExperimentDefinitionConfig,
  type ExperimentVariantConfig,
} from "./gamificationConfig";

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  payload: Record<string, unknown>;
}

function hashToUnitInterval(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function normalizeVariants(variants: ExperimentVariantConfig[]): ExperimentVariantConfig[] {
  const normalized = variants
    .filter((variant) => typeof variant.id === "string" && variant.id.length > 0)
    .map((variant) => ({
      ...variant,
      weight: Number.isFinite(variant.weight) ? Math.max(0, variant.weight) : 0,
      payload: variant.payload && typeof variant.payload === "object" ? variant.payload : {},
    }));
  return normalized;
}

export function isExperimentEnabled(experimentId: string): boolean {
  const config = getExperimentsConfig();
  if (!config.enabled) return false;
  const definition = config.experiments[experimentId];
  if (!definition || !definition.enabled) return false;
  return normalizeVariants(definition.variants).length > 0;
}

export function getExperimentDefinition(experimentId: string): ExperimentDefinitionConfig | null {
  const config = getExperimentsConfig();
  const definition = config.experiments[experimentId];
  if (!definition) return null;
  return definition;
}

export function assignVariant(
  userId: string,
  experimentId: string,
  variants: ExperimentVariantConfig[]
): string {
  const normalized = normalizeVariants(variants);
  if (normalized.length === 0) return "control";

  const totalWeight = normalized.reduce((sum, variant) => sum + variant.weight, 0);
  if (totalWeight <= 0) {
    return normalized[0].id;
  }

  const roll = hashToUnitInterval(`${userId}:${experimentId}`) * totalWeight;
  let cursor = 0;

  for (const variant of normalized) {
    cursor += variant.weight;
    if (roll <= cursor) {
      return variant.id;
    }
  }

  return normalized[normalized.length - 1].id;
}

export function getVariantPayload(
  experimentId: string,
  variantId: string
): Record<string, unknown> | null {
  const definition = getExperimentDefinition(experimentId);
  if (!definition) return null;
  const variant = normalizeVariants(definition.variants).find((item) => item.id === variantId);
  if (!variant) return null;
  return variant.payload ?? {};
}

export function assignExperiment(
  userId: string,
  experimentId: string
): ExperimentAssignment | null {
  if (!isExperimentEnabled(experimentId)) return null;
  const definition = getExperimentDefinition(experimentId);
  if (!definition) return null;

  const variantId = assignVariant(userId, experimentId, definition.variants);
  return {
    experimentId,
    variantId,
    payload: getVariantPayload(experimentId, variantId) ?? {},
  };
}
