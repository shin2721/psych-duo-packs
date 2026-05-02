import { QuestionType } from "./types";

export type PhaseId = 1 | 2 | 3 | 4 | 5;

export const PHASE_SEQUENCE: readonly PhaseId[] = [1, 2, 3, 4, 5];

const PHASE_TYPE_MAP: Record<PhaseId, QuestionType> = {
    1: "swipe_judgment",
    2: "multiple_choice",
    3: "multiple_choice",
    4: "conversation",
    5: "conversation",
};

const SUPPORTED_DOMAINS = new Set([
    "social",
    "mental",
    "money",
    "health",
    "productivity",
    "study",
    "work",
    "relationships",
]);

const DOMAIN_ALIAS_MAP: Record<string, string> = {
    productivity: "study",
    relationships: "social",
};

export function getPhaseForIndex(index: number): PhaseId {
    const normalized = index % PHASE_SEQUENCE.length;
    return PHASE_SEQUENCE[normalized];
}

export function getQuestionTypeForPhase(phase: PhaseId): QuestionType {
    return PHASE_TYPE_MAP[phase];
}

export function isValidPhase(value: unknown): value is PhaseId {
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function isSupportedDomain(value: unknown): value is string {
    return typeof value === "string" && SUPPORTED_DOMAINS.has(value.toLowerCase());
}

export function normalizeDomain(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const normalized = value.toLowerCase();
    if (!SUPPORTED_DOMAINS.has(normalized)) return null;
    return DOMAIN_ALIAS_MAP[normalized] || normalized;
}

export function inferPhaseFromQuestionType(questionType: QuestionType): PhaseId {
    if (questionType === "swipe_judgment") return 1;
    if (questionType === "multiple_choice") return 2;
    if (questionType === "conversation") return 4;
    return 2;
}

export function getPhaseObjective(phase: PhaseId): string {
    switch (phase) {
        case 1:
            return "Hook: 共感を引く導入";
        case 2:
            return "What: 現象を認識させる";
        case 3:
            return "Why: 原理を理解させる";
        case 4:
            return "How: 実践シミュレーション";
        case 5:
            return "Anchor: 振り返り・定着";
        default:
            return "What: 現象を認識させる";
    }
}

export function selectBalancedPhaseItems<T extends { phase: number }>(
    items: T[],
    requiredPerPhase = 2
): T[] | null {
    const buckets: Record<PhaseId, T[]> = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
    };

    for (const item of items) {
        if (!isValidPhase(item.phase)) continue;
        buckets[item.phase].push(item);
    }

    for (const phase of PHASE_SEQUENCE) {
        if (buckets[phase].length < requiredPerPhase) {
            return null;
        }
    }

    const selected: T[] = [];
    for (const phase of PHASE_SEQUENCE) {
        selected.push(...buckets[phase].slice(0, requiredPerPhase));
    }
    return selected;
}

export function getPhaseRequirements(targetCount: number): Record<PhaseId, number> {
    const normalizedTarget = Math.max(5, Math.min(10, Math.round(targetCount)));
    const requirements: Record<PhaseId, number> = {
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
    };

    const expansionOrder: PhaseId[] = [4, 5, 2, 3, 1];
    let extras = normalizedTarget - PHASE_SEQUENCE.length;

    for (const phase of expansionOrder) {
        if (extras <= 0) break;
        requirements[phase] += 1;
        extras -= 1;
    }

    return requirements;
}

export function selectItemsForPhaseRequirements<T extends { phase: number }>(
    items: T[],
    requirements: Record<PhaseId, number>
): T[] | null {
    const buckets: Record<PhaseId, T[]> = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
    };

    for (const item of items) {
        if (!isValidPhase(item.phase)) continue;
        buckets[item.phase].push(item);
    }

    for (const phase of PHASE_SEQUENCE) {
        if (buckets[phase].length < requirements[phase]) {
            return null;
        }
    }

    const selected: T[] = [];
    for (const phase of PHASE_SEQUENCE) {
        selected.push(...buckets[phase].slice(0, requirements[phase]));
    }

    return selected;
}
