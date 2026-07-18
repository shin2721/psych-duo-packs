export function resolveV2OwnerPilotEnabled(
  isDev: boolean,
  flagValue?: string
): boolean {
  return isDev && flagValue !== "0";
}

export const V2_OWNER_PILOT_ENABLED = resolveV2OwnerPilotEnabled(
  typeof __DEV__ !== "undefined" && __DEV__,
  process.env.EXPO_PUBLIC_V2_OWNER_PILOT
);
