import React from "react";
import { Text, View } from "react-native";
import i18n from "../lib/i18n";
import { getSourceInfo } from "./evidenceBottomSheetSources";

interface Props {
  expandedDetails?: {
    claim_type?: string;
    evidence_type?: string;
    citation_role?: string;
    how_studied?: string;
    verdict_line?: string;
    verdict_weight?: "green" | "amber" | "grey";
    best_for?: string[];
    limitations?: string[];
    try_this?: string;
  };
  listSeparator: string;
  sourceId?: string;
  styles: Record<string, object>;
}

const VERDICT_COLORS: Record<"green" | "amber" | "grey", string> = {
  green: "#22C55E",
  amber: "#E5A93C",
  grey: "rgba(255,255,255,0.35)",
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
      {expandedDetails?.how_studied ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t("lesson.howStudiedHeader")}</Text>
          <Text style={styles.sectionText}>{expandedDetails.how_studied}</Text>
        </View>
      ) : null}

      {expandedDetails?.limitations && expandedDetails.limitations.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t("lesson.limitationsHeader")}</Text>
          <Text style={styles.sectionText}>
            {expandedDetails.limitations.join(listSeparator)}
          </Text>
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

      {/* 限界を読んだ読者の「で、どうすれば」に答える。分類の凡例は出さない。
          色が段階を伝え、文が向きを言う。強さの目盛りを一本引くと
          「調べた結果、効く証拠がなかった」の置き場所がなくなる。 */}
      {expandedDetails?.verdict_line ? (
        <View style={styles.verdict}>
          <View
            style={[
              styles.verdictDot,
              { backgroundColor: VERDICT_COLORS[expandedDetails.verdict_weight ?? "grey"] },
            ]}
          />
          <Text style={styles.verdictText}>{expandedDetails.verdict_line}</Text>
        </View>
      ) : null}
    </>
  );
}
