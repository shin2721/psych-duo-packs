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

export function EvidenceBottomSheetDetails({
  expandedDetails,
  listSeparator,
  sourceId,
  styles,
}: Props) {
  const sourceInfo = getSourceInfo(sourceId);
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
      {/* 判定が見出し。やり方と限界はその根拠として下に置く。
          脚注の位置に置くと、一番知りたい行が最後まで読まないと出てこない。 */}
      {expandedDetails?.verdict_line ? (
        <View style={styles.verdict}>
          {/* 何についての判定かを先に見せる。チップだけだと「何に対する根拠なし？」になる。 */}
          {expandedDetails.verdict_claim ? (
            <Text style={styles.verdictClaim}>「{expandedDetails.verdict_claim}」</Text>
          ) : null}
          <View style={styles.verdictHeadRow}>
            <View
              style={[
                styles.verdictChip,
                { backgroundColor: VERDICT_COLORS[expandedDetails.verdict_weight ?? "grey"] },
              ]}
            >
              <Text style={styles.verdictChipText}>{expandedDetails.verdict_label}</Text>
            </View>
          </View>
          <Text style={styles.verdictText}>{expandedDetails.verdict_line}</Text>
          {/* なぜそこまで信じていいか。等級ではなく理由で書く。 */}
          {expandedDetails.strength_line ? (
            <Text style={styles.verdictStrength}>{expandedDetails.strength_line}</Text>
          ) : null}
        </View>
      ) : null}

      {expandedDetails?.how_studied ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t("lesson.howStudiedHeader")}</Text>
          <Text style={styles.sectionText}>{expandedDetails.how_studied}</Text>
        </View>
      ) : null}

      {expandedDetails?.limitations && expandedDetails.limitations.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t("lesson.limitationsHeader")}</Text>
          {expandedDetails.limitations.map((limitation, index) => (
            <Text key={index} style={styles.bulletText}>
              ・{limitation}
            </Text>
          ))}
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
