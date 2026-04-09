import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { getMyLeague } from "../league";
import { formatProfileLeagueLabel } from "../profileLeagueLabel";
import { isProfileAvatarIcon, type ProfileAvatarIcon } from "../avatarIcons";
import { warnDev } from "../devLog";
import { supabase } from "../supabase";
import i18n from "../i18n";

interface ProfileScreenState {
  leagueLabel: string;
  leagueLoading: boolean;
  profileUsername: string | null;
  avatarIcon: ProfileAvatarIcon;
  userEmail: string | null;
}

function isMissingColumnError(error: unknown): boolean {
  const maybeError = error as { code?: string; message?: string } | null;
  return maybeError?.code === "42703" || maybeError?.message?.includes("column") === true;
}

export function useProfileScreen(): ProfileScreenState {
  const { user } = useAuth();
  const [leagueLabel, setLeagueLabel] = React.useState<string>("...");
  const [leagueLoading, setLeagueLoading] = React.useState(true);
  const [profileUsername, setProfileUsername] = React.useState<string | null>(null);
  const [avatarIcon, setAvatarIcon] = React.useState<ProfileAvatarIcon>("person");

  const refreshProfile = React.useCallback(async () => {
    if (!user?.id) {
      setProfileUsername(null);
      setAvatarIcon("person");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_icon")
        .eq("id", user.id)
        .single();

      if (error) {
        if (isMissingColumnError(error)) {
          const fallback = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

          if (fallback.error) throw fallback.error;

          setProfileUsername(
            typeof fallback.data?.username === "string" && fallback.data.username.length > 0
              ? fallback.data.username
              : null
          );
          setAvatarIcon("person");
          return;
        }

        throw error;
      }

      setProfileUsername(
        typeof data?.username === "string" && data.username.length > 0 ? data.username : null
      );
      setAvatarIcon(isProfileAvatarIcon(data?.avatar_icon) ? data.avatar_icon : "person");
    } catch (error) {
      if (!isMissingColumnError(error)) {
        warnDev("Failed to load profile data:", error);
      }
      setProfileUsername(null);
      setAvatarIcon("person");
    }
  }, [user?.id]);

  const refreshLeague = React.useCallback(async () => {
    if (!user?.id) {
      setLeagueLabel(String(i18n.t("profile.stats.leagueUnjoined")));
      setLeagueLoading(false);
      return;
    }

    setLeagueLoading(true);
    try {
      const league = await getMyLeague(user.id);
      setLeagueLabel(
        formatProfileLeagueLabel(league, String(i18n.t("profile.stats.leagueUnjoined")))
      );
    } catch (error) {
      warnDev("Failed to load profile league:", error);
      setLeagueLabel(String(i18n.t("profile.stats.leagueUnjoined")));
    } finally {
      setLeagueLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    refreshProfile();
    refreshLeague();
  }, [refreshLeague, refreshProfile]);

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
      refreshLeague();
    }, [refreshLeague, refreshProfile])
  );

  return {
    leagueLabel,
    leagueLoading,
    profileUsername,
    avatarIcon,
    userEmail: user?.email ?? null,
  };
}
