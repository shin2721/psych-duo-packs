const mem = new Map<string, string>();
const hasLS = typeof globalThis !== "undefined" && !!(globalThis as any).localStorage;

export function getItem(k: string): string | null {
    try {
        return hasLS ? localStorage.getItem(k) : (mem.get(k) ?? null);
    } catch {
        return mem.get(k) ?? null;
    }
}

export function setItem(k: string, v: string | number): void {
    try {
        if (hasLS) {
            localStorage.setItem(k, String(v));
            return;
        }
    } catch { }
    mem.set(k, String(v));
}
