import { isGuestUserId } from "../authUtils";
import { supabase } from "../supabase";

function canUseRemoteEconomyUserId(userId: string | null | undefined): userId is string {
  return typeof userId === "string" && userId.length > 0 && !isGuestUserId(userId);
}

export async function syncProfileGems(userId: string | null | undefined, gems: number): Promise<void> {
  if (!canUseRemoteEconomyUserId(userId)) return;

  const { error } = await supabase
    .from("profiles")
    .update({ gems })
    .eq("id", userId);

  if (error) throw error;
}
