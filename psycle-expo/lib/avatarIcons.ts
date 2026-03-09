export const PROFILE_AVATAR_ICONS = [
    "person",
    "happy",
    "star",
    "heart",
    "flash",
    "leaf",
] as const;

export type ProfileAvatarIcon = (typeof PROFILE_AVATAR_ICONS)[number];

export function isProfileAvatarIcon(value: string | null | undefined): value is ProfileAvatarIcon {
    return !!value && PROFILE_AVATAR_ICONS.includes(value as ProfileAvatarIcon);
}
