import React from "react";
import { Text, View } from "react-native";
import i18n from "../lib/i18n";
import { getSourceInfo } from "./evidenceBottomSheetSources";

interface Props {
  expandedDetails?: {
    claim_type?: string;
    evidence_type?: string;
    citation_role?: string;
    best_for?: string[];
    limitations?: string[];
    try_this?: string;
  };
  listSeparator: string;
  sourceId?: string;
  styles: Record<string, object>;
}

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

      {/* 限界を読んだ読者の「で、どうすれば」に、毎回同じ場所で答える。
          限界は行動を萎縮させるためではなく、他人の言い切りから身を守るためにある。 */}
      <View style={styles.verdictGuide}>
        <Text style={styles.verdictGuideTitle}>{i18n.t("lesson.verdictGuide.title")}</Text>
        <Text style={styles.verdictGuideLine}>{i18n.t("lesson.verdictGuide.strong")}</Text>
        <Text style={styles.verdictGuideLine}>{i18n.t("lesson.verdictGuide.mixed")}</Text>
        <Text style={styles.verdictGuideLine}>{i18n.t("lesson.verdictGuide.unknown")}</Text>
      </View>
    </>
  );
}
