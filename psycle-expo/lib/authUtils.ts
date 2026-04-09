export const GUEST_USER_ID_PREFIX = 'guest_user_';

export function isGuestUserId(userId: string | null | undefined): boolean {
    return typeof userId === 'string' && userId.startsWith(GUEST_USER_ID_PREFIX);
}
