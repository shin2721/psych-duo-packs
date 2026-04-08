export interface HydrationTaskContext {
  isCancelled: () => boolean;
}

export interface HydrationTaskOptions<Result> {
  setIsHydrated: (value: boolean) => void;
  onStart?: () => void;
  onFinally?: () => void;
  onError?: (error: unknown) => void;
  onSuccess?: (result: Result) => void;
  task: (context: HydrationTaskContext) => Promise<Result>;
}

export function runHydrationTask<Result>(options: HydrationTaskOptions<Result>): () => void {
  let cancelled = false;
  const context: HydrationTaskContext = {
    isCancelled: () => cancelled,
  };

  options.onStart?.();
  options.setIsHydrated(false);

  void (async () => {
    try {
      const result = await options.task(context);
      if (cancelled) return;
      options.onSuccess?.(result);
    } catch (error) {
      if (cancelled) return;
      options.onError?.(error);
    } finally {
      if (cancelled) return;
      options.onFinally?.();
      options.setIsHydrated(true);
    }
  })();

  return () => {
    cancelled = true;
  };
}
