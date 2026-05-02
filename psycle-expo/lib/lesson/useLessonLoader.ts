import { useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Analytics } from "../analytics";
import i18n from "../i18n";
import type { InlineToastTone } from "../../components/InlineToast";

interface UseLessonLoaderParams {
  energy: number;
  maxEnergy: number;
  showToast: (message: string, variant?: InlineToastTone) => void;
}

export function useLessonLoader(params: UseLessonLoaderParams) {
  const isE2EAnalyticsMode = __DEV__ || process.env.EXPO_PUBLIC_E2E_ANALYTICS_DEBUG === "1";

  const handleEnergyBlocked = useCallback(
    (lessonId: string, genreId: string) => {
      Analytics.track("energy_blocked", {
        lessonId,
        genreId,
        energy: params.energy,
        maxEnergy: params.maxEnergy,
      });
      Alert.alert(String(i18n.t("common.error")), String(i18n.t("lesson.energyBlockedMessage")), [
        {
          text: String(i18n.t("common.ok")),
          onPress: () => {
            Analytics.track("shop_open_from_energy", {
              source: "lesson_blocked",
              lessonId,
            });
            router.replace("/(tabs)/shop");
          },
        },
      ]);
    },
    [params.energy, params.maxEnergy]
  );

  const handleLoadFailed = useCallback(
    (message: string) => {
      params.showToast(String(i18n.t("lesson.loadFailed", { message })), "error");
      router.back();
    },
    [params]
  );

  return {
    handleEnergyBlocked,
    handleLoadFailed,
    isE2EAnalyticsMode,
  };
}
