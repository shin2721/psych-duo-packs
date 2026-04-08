import {
  getUserStorageKey,
  persistJson,
  persistNumber,
  persistString,
} from "./persistence";

type UserStorageKey = Parameters<typeof getUserStorageKey>[0];

interface PersistEffectBase<Key extends UserStorageKey> {
  isHydrated: boolean;
  key: Key;
  userId?: string | null;
}

function runPersistEffect(
  isHydrated: boolean,
  userId: string | null | undefined,
  persistTask: (resolvedUserId: string) => Promise<void>
): void {
  if (!isHydrated || !userId) return;
  void persistTask(userId).catch(() => {});
}

export function createPersistNumberEffect<Key extends UserStorageKey>(
  options: PersistEffectBase<Key> & { value: number | null | undefined }
): void {
  runPersistEffect(options.isHydrated, options.userId, (resolvedUserId) =>
    persistNumber(getUserStorageKey(options.key, resolvedUserId), options.value ?? null)
  );
}

export function createPersistStringEffect<Key extends UserStorageKey>(
  options: PersistEffectBase<Key> & { value: string | null | undefined }
): void {
  runPersistEffect(options.isHydrated, options.userId, (resolvedUserId) =>
    persistString(getUserStorageKey(options.key, resolvedUserId), options.value ?? null)
  );
}

export function createPersistJsonEffect<Key extends UserStorageKey>(
  options: PersistEffectBase<Key> & { value: unknown | null | undefined }
): void {
  runPersistEffect(options.isHydrated, options.userId, (resolvedUserId) =>
    persistJson(getUserStorageKey(options.key, resolvedUserId), options.value ?? null)
  );
}
