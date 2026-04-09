import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExportableJSON } from "../dogfood";

export async function resetOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem("hasSeenOnboarding");
}

export async function clearLocalAppData(): Promise<void> {
  await AsyncStorage.clear();
}

export async function exportDogfoodData(): Promise<string> {
  return getExportableJSON();
}
