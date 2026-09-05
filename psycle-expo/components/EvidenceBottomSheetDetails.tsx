import React from "react";
import { Text, View } from "react-native";
import i18n from "../lib/i18n";
import { getSourceInfo } from "./evidenceBottomSheetSources";
import type { VerdictWeight } from "../types/question";

interface Props {
  expandedDetails?: {
    claim_type?: string;
    evidence_type?: string;
    citation_role?: string;
    how_studied?: string;
    verdict_claim?: string;
    verdict_label?: string;
    verdict_line?: string;
    verdict_weight?: VerdictWeight;
    strength_line?: string;
    best_for?: string[];
    limitations?: string[];
    try_this?: string;
  };
  listSeparator: string;
  sourceId?: string;
  styles: Record<string, object>;
}

const VERDICT_COLORS: Record<VerdictWeight, string> = {
  green: "#22C55E",
  amber: "#E5A93C",
  grey: "#94A3B8",
  // 「調べて、差が出なかった」の確定色。grey（まだ調べられていない）と明度を離す
  // （#5B9CF6 は grey と輝度がほぼ同じで、グレースケールで見分けがつかなかった）。
  blue: "#3B82F6",
};

// 確からしさの行は「結論の1語。理由」。先頭の語をバッジに、残りを本文に分ける。
// 語そのものは UI 文言（lesson.trustWords）から引く。レッスン本文と同じ言語で揃うのはそこだけ。
// 合わない行（締めカードの「固さも3つで違う。…」など）はそのまま本文として出す。
// 色は判定チップと競わないよう白の濃淡だけ。固いほど濃い。
const TRUST_LEVELS = ["solid", "fair", "shaky", "thin"] as const;
type TrustLevel = (typeof TRUST_LEVELS)[number];
// 丸は Cochrane が証拠の確実性に使う ⊕⊕⊕◯ の書き方。語が横にあるので効果の大きさとは読まれない。
const TRUST_BADGE: Record<TrustLevel, { backgroundColor: string; color: string; dots: string }> = {
  solid: { backgroundColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.96)", dots: "●●●●" },
  fair: { backgroundColor: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.9)", dots: "●●●○" },
  shaky: { backgroundColor: "rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.8)", dots: "●●○○" },
  thin: { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.68)", dots: "●○○○" },
};

function splitStrengthLine(line?: string): { level?: TrustLevel; word?: string; reason?: string } {
  if (!line) return {};
  const idx = line.indexOf("。");
  const head = idx > 0 ? line.slice(0, idx) : "";
  const level = TRUST_LEVELS.find((candidate) => i18n.t(`lesson.trustWords.${candidate}`) === head);
  if (level) {
    return { level, word: head, reason: line.slice(idx + 1).trim() || undefined };
  }
  return { reason: line };
}

export function EvidenceBottomSheetDetails({
  expandedDetails,
  listSeparator,
  sourceId,
  styles,
}: Props) {
  const sourceInfo = getSourceInfo(sourceId);
  const strength = splitStrengthLine(expandedDetails?.strength_line);
  const limitations = expandedDetails?.limitations ?? [];
  const hasVerdict = Boolean(expandedDetails?.verdict_line);
  const hasStrength = Boolean(strength.word || strength.reason) || limitations.length > 0;
  const typeLabel = sourceInfo
    ? {
        intervention: i18n.t("evidenceBottomSheet.sourceType.intervention"),
        observational: i18n.t("evidenceBottomSheet.sourceType.observational"),
        theory: i18n.t("evidenceBottomSheet.sourceType.theory"),
        review: i18n.t("evidenceBottomSheet.sourceType.review"),
      }[sourceInfo.type] || sourceInfo.type
    : null;

  return (
    <>
      {/* 「向いているケース」は締めカードの仕事と重なる。シートは限界と出典に絞る。
          best_for のデータ自体は他所で使うため残してある。 */}
      {/* 判定が見出し。確からしさと研究のやり方はその根拠として下に置く。
          脚注の位置に置くと、一番知りたい行が最後まで読まないと出てこない。 */}
      {hasVerdict || hasStrength ? (
        <View style={styles.verdict}>
          {hasVerdict ? (
            <>
              {/* 何についての判定かを先に見せる。チップだけだと「何に対する根拠なし？」になる。 */}
              {expandedDetails?.verdict_claim ? (
                <Text style={styles.verdictClaim}>「{expandedDetails.verdict_claim}」</Text>
              ) : null}
              <View style={styles.verdictHeadRow}>
                <View
                  style={[
                    styles.verdictChip,
                    { backgroundColor: VERDICT_COLORS[expandedDetails?.verdict_weight ?? "grey"] },
                  ]}
                >
                  <Text style={styles.verdictChipText}>{expandedDetails?.verdict_label}</Text>
                </View>
              </View>
              <Text style={styles.verdictText}>{expandedDetails?.verdict_line}</Text>
            </>
          ) : null}
          {/* どれくらい信じていいか、どこまでの話か。読者にはひとつの問いなので見出しも1つ（問いの形）。
              先頭の語（かなり固い／まあ固い／まだ揺れる／薄い）はバッジ、理由は本文、
              射程の限界は箇条書きで続ける。書く側の線引きは QUALITY_CONSTITUTION 2番。 */}
          {hasStrength ? (
            <View style={[styles.strengthBlock, hasVerdict ? styles.strengthBlockBelowVerdict : undefined]}>
              <View style={styles.strengthHeaderRow}>
                <Text style={styles.verdictStrengthLabel}>{i18n.t("lesson.strengthHeader")}</Text>
                {strength.level ? (
                  <View
                    style={[
                      styles.strengthBadge,
                      { backgroundColor: TRUST_BADGE[strength.level].backgroundColor },
                    ]}
                  >
                    <Text style={[styles.strengthDots, { color: TRUST_BADGE[strength.level].color }]}>
                      {TRUST_BADGE[strength.level].dots}
                    </Text>
                    <Text style={[styles.strengthBadgeText, { color: TRUST_BADGE[strength.level].color }]}>
                      {strength.word}
                    </Text>
                  </View>
                ) : null}
              </View>
              {strength.reason ? <Text style={styles.verdictStrength}>{strength.reason}</Text> : null}
              {limitations.length > 0 ? (
                <View style={styles.strengthList}>
                  {limitations.map((limitation, index) => (
                    <View key={index} style={styles.strengthItem}>
                      <Text style={styles.strengthDot}>・</Text>
                      <Text style={styles.strengthItemText}>{limitation}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {expandedDetails?.how_studied ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t("lesson.howStudiedHeader")}</Text>
          <Text style={styles.sectionText}>{expandedDetails.how_studied}</Text>
        </View>
      ) : null}

      {sourceInfo ? (
        <View style={styles.sourceBox}>
          <Text style={styles.sourceLabel}>{i18n.t("evidenceBottomSheet.sourceLabel")}</Text>
          <Text style={styles.sourceAuthor}>
            {sourceInfo.author} ({sourceInfo.year})
          </Text>
          <View style={styles.sourceTypeChip}>
            <Text style={styles.sourceTypeText}>{typeLabel}</Text>
          </View>
        </View>
      ) : null}

    </>
  );
}
