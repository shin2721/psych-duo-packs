import AsyncStorage from "@react-native-async-storage/async-storage";
const KEY = "psycle:ministore:v1";
export type MiniState = {
  selectedCourseId?: string;
  weeklyXP: number;
  displayName: string;
  unitIndex: number;
};
export async function getState(): Promise<MiniState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { weeklyXP:0, displayName:"You", unitIndex:0 };
    const j = JSON.parse(raw);
    return { weeklyXP:0, displayName:"You", unitIndex:0, ...j };
  } catch {
    return { weeklyXP:0, displayName:"You", unitIndex:0 };
  }
}
export async function patchState(p: Partial<MiniState>) {
  const cur = await getState();
  const next = { ...cur, ...p };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
