/**
 * Evidence Summary Utility
 * 
 * Generates user-friendly summary from claim_type/evidence_type
 * for the "まず試す価値" display
 */

export type TryValue = "高め" | "ふつう" | "限定的";

export interface EvidenceSummary {
    tryValue: TryValue;
    valueLabel: string;  // claim_type別ラベル：「まず試す価値」「理解の確からしさ」「起こりやすさの根拠」
    actionHint: string;  // 「迷ったらこうする」判断の一言
    basisLabel: string;  // e.g., "介入 × 直接"
    note: string;        // Safety note
}

const CLAIM_LABELS: Record<string, string> = {
    intervention: "介入",
    observation: "観察",
    theory: "理論"
};

const EVIDENCE_LABELS: Record<string, string> = {
    direct: "直接",
    indirect: "間接",
    theoretical: "理論"
};

/**
 * Calculate "まず試す価値" from expanded_details
 */
export function getEvidenceSummary(expandedDetails: {
    claim_type?: string;
    evidence_type?: string;
} | undefined): EvidenceSummary {
    if (!expandedDetails) {
        return {
            tryValue: "限定的",
            valueLabel: "まず試す価値",
            actionHint: "合う/合わないは使って判断",
            basisLabel: "情報なし",
            note: "合う/合わないは個人差あり"
        };
    }

    const { claim_type, evidence_type } = expandedDetails;

    // Calculate tryValue
    let tryValue: TryValue = "限定的";

    if (claim_type === "intervention" && evidence_type === "direct") {
        tryValue = "高め";
    } else if (
        (claim_type === "intervention" && evidence_type === "indirect") ||
        (claim_type === "observation" && evidence_type === "direct")
    ) {
        tryValue = "ふつう";
    } else {
        tryValue = "限定的";
    }

    // Generate basis label
    const claimLabel = CLAIM_LABELS[claim_type || ""] || claim_type || "不明";
    const evidenceLabel = EVIDENCE_LABELS[evidence_type || ""] || evidence_type || "不明";
    const basisLabel = `${claimLabel} × ${evidenceLabel}`;

    // claim_type別のラベルと判断の一言（ユーザーが迷わない表現）
    let valueLabel: string;
    let actionHint: string;
    switch (claim_type) {
        case "intervention":
            valueLabel = "まず試す価値";
            actionHint = "迷ったら：10秒だけ試す → 合うかどうかで判断";
            break;
        case "theory":
            valueLabel = "理解の確からしさ";
            actionHint = "これは考え方の地図。合う/合わないは使って判断";
            break;
        case "observation":
            valueLabel = "起こりやすさの根拠";
            actionHint = "多くの人に起きやすい傾向。自分に当てはまるか確認";
            break;
        default:
            valueLabel = "まず試す価値";
            actionHint = "合う/合わないは使って判断";
    }

    // Note based on type
    const note = claim_type === "intervention"
        ? "安全に試せる範囲で実践可能"
        : "合う/合わないは個人差あり";

    return { tryValue, valueLabel, actionHint, basisLabel, note };
}

/**
 * Get color for tryValue badge
 */
export function getTryValueColor(tryValue: TryValue): string {
    switch (tryValue) {
        case "高め": return "#22c55e"; // green
        case "ふつう": return "#60a5fa"; // blue (neutral)
        case "限定的": return "#94a3b8"; // light gray (non-negative)
    }
}
