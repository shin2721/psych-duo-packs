import { supabase } from "../supabase";
import { warnDev } from "../devLog";

function toFallbackWeekId(date: Date): string {
  const year = date.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const dayOfYear = Math.ceil(
    (date.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

export async function getCurrentWeekId(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("get_current_week_id");
    if (error) throw error;
    return data as string;
  } catch (error) {
    warnDev(
      "[League] Failed to get week ID from server, using fallback:",
      error
    );
    return toFallbackWeekId(new Date());
  }
}

export async function getLastWeekId(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("get_last_week_id");
    if (error) throw error;
    return data as string;
  } catch (error) {
    warnDev(
      "[League] Failed to get last week ID from server, using fallback:",
      error
    );
    return toFallbackWeekId(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
  }
}
