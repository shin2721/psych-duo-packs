import { Platform } from "react-native";

export const IOS_EXTERNAL_CHECKOUT_DISABLED_REASON = "ios_external_checkout_disabled" as const;

export function isExternalCheckoutBlockedForCurrentPlatform(): boolean {
  return (
    Platform.OS === "ios" &&
    process.env.EXPO_PUBLIC_APP_ENV === "prod" &&
    process.env.EXPO_PUBLIC_IOS_EXTERNAL_CHECKOUT_ENABLED !== "1"
  );
}
