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
      {expandedDetails?.best_for && expandedDetails.best_for.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{i18n.t("lesson.bestForHeader")}</Text>
          <Text style={styles.sectionText}>
            {expandedDetails.best_for.join(listSeparator)}
          </Text>
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

      <Text style={styles.disclaimer}>{i18n.t("lesson.disclaimerEffectSize")}</Text>
    </>
  );
}
