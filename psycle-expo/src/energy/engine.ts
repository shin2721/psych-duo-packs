import { getItem, setItem } from "./persist";

export const ENERGY_MAX = 25;
export const REGEN_MS = 60 * 60 * 1000; // 1時間で+1

// 連続正解ボーナス: 5連続=+1, 10連続=+3（各しきい値で一度だけ付与）
export const STREAK_BONUSES: Record<number, number> = { 5: 1, 10: 3 };

// レッスン全問正解ボーナス
export const PERFECT_BONUS = 5;

const K = { energy: "psycle.energy", streak: "psycle.streak", ts: "psycle.ts" };
const now = () => Date.now();

interface EnergyState {
    energy: number;
    streak: number;
    ts: number;
}

function load(): EnergyState {
    const e = Number(getItem(K.energy) ?? ENERGY_MAX);
    const s = Number(getItem(K.streak) ?? 0);
    const t = Number(getItem(K.ts) ?? now());
    return {
        energy: isNaN(e) ? ENERGY_MAX : Math.max(0, Math.min(ENERGY_MAX, e)),
        streak: isNaN(s) ? 0 : Math.max(0, s),
        ts: isNaN(t) ? now() : t
    };
}

function save(st: EnergyState) {
    setItem(K.energy, st.energy);
    setItem(K.streak, st.streak);
    setItem(K.ts, st.ts);
}

function regen(st: EnergyState): EnergyState {
    const diff = now() - st.ts;
    if (diff < REGEN_MS) return st;
    const gained = Math.floor(diff / REGEN_MS);
    if (gained > 0) {
        st.energy = Math.min(ENERGY_MAX, st.energy + gained);
        st.ts += gained * REGEN_MS;
    }
    return st;
}

export function getEnergy(): number {
    const st = regen(load());
    save(st);
    return st.energy;
}

export function canStart(need = 1): boolean {
    return getEnergy() >= need;
}

interface AnswerResult {
    ok: boolean;
    reason?: string;
    energy: number;
    streak: number;
    awarded?: number;
}

// 回答ごとに呼ぶ: -1消費、連続正解しきい値でボーナス付与
export function onAnswer({ correct }: { correct?: boolean } = {}): AnswerResult {
    const st = regen(load());
    if (st.energy <= 0) {
        save(st);
        return { ok: false, reason: "no_energy", energy: st.energy, streak: st.streak };
    }

    // 回答で-1
    st.energy = Math.max(0, st.energy - 1);

    let awarded = 0;
    let reason: string | undefined;

    if (correct === true) {
        st.streak += 1;
        if (Object.prototype.hasOwnProperty.call(STREAK_BONUSES, st.streak)) {
            awarded = STREAK_BONUSES[st.streak];
            if (awarded > 0) {
                st.energy = Math.min(ENERGY_MAX, st.energy + awarded);
                reason = st.streak === 10 ? "streak10" : "streak5";
            }
        }
    } else {
        st.streak = 0;
    }

    st.ts = now();
    save(st);
    return { ok: true, energy: st.energy, streak: st.streak, awarded, reason };
}

interface LessonEndResult {
    energy: number;
    streak: number;
    awarded: number;
    reason?: string | null;
}

// レッスン終了時に呼ぶ: 全問正解なら+5
export function onLessonEnd({ asked, correct }: { asked?: number; correct?: number } = {}): LessonEndResult {
    const st = regen(load());
    const a = Number(asked) || 0;
    const c = Number(correct) || 0;

    let awarded = 0;
    let reason: string | null = null;

    if (a > 0 && a === c) {
        awarded = PERFECT_BONUS;
        st.energy = Math.min(ENERGY_MAX, st.energy + awarded);
        reason = "perfect";
    }

    st.ts = now();
    save(st);
    return { energy: st.energy, streak: st.streak, awarded, reason };
}

export function addEnergy(n: number): number {
    const st = regen(load());
    st.energy = Math.min(ENERGY_MAX, st.energy + Math.max(0, Math.floor(n || 0)));
    st.ts = now();
    save(st);
    return st.energy;
}

export function setEnergy(n: number): number {
    const st = load();
    st.energy = Math.max(0, Math.min(ENERGY_MAX, Math.floor(n || 0)));
    st.ts = now();
    save(st);
    return st.energy;
}

export function resetEnergy(): number {
    const st = { energy: ENERGY_MAX, streak: 0, ts: now() };
    save(st);
    return st.energy;
}
