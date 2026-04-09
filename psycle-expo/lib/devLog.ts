export function logDev(message: string, payload?: unknown): void {
  if (!__DEV__) return;
  if (typeof payload === "undefined") {
    console.log(message);
    return;
  }
  console.log(message, payload);
}

export function warnDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (typeof error === "undefined") {
    console.warn(message);
    return;
  }
  console.warn(message, error);
}

export function errorDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (typeof error === "undefined") {
    console.error(message);
    return;
  }
  console.error(message, error);
}
