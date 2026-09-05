import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../lib/i18n";
import { getSourceInfo } from "./evidenceBottomSheetSources";
import { VERDICT_COLORS } from "./evidenceVerdictColors";
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

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// 確からしさの行は「結論の1語。理由」。先頭の語をバッジに、残りを本文に分ける。
// 語そのものは UI 文言（lesson.trustWords）から引く。レッスン本文と同じ言語で揃うのはそこだけ。
// 合わない行（締めカードの「固さも3つで違う。…」など）はそのまま本文として出す。
// 色は判定チップと競わないよう白の濃淡だけ。固いほど濃い。
// 丸は Cochrane が証拠の確実性に使う ⊕⊕⊕◯ の書き方。語が横にあるので効果の大きさとは読まれない。
const TRUST_LEVELS = ["solid", "fair", "shaky", "thin"] as const;
type TrustLevel = (typeof TRUST_LEVELS)[number];
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

// **で囲んだ語を少し明るく出す。種明かしの金色の強調とは別で、動かさない。
// 読み飛ばしても数字だけ拾える、パレオの太字と同じ役目。
function renderEmphasis(text: string, strongStyle: object) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <Text key={index} style={strongStyle}>
          {part.slice(2, -2)}
        </Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
}

// 台帳の evidence_through（YYYY-MM）を「2024年1月までの研究」に。無ければ出さない。
function evidenceThroughLabel(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return i18n.t("evidenceBottomSheet.evidenceThrough", { year: match[1], month: String(Number(match[2])) });
}

function SectionLabel({
  icon,
  text,
  styles,
  tight,
}: {
  icon: IoniconName;
  text: string;
  styles: Record<string, object>;
  tight?: boolean;
}) {
  return (
    <View style={[styles.sectionLabelRow, tight ? undefined : styles.sectionLabelGap]}>
      <Ionicons name={icon} size={13} color="rgba(255,255,255,0.45)" />
      <Text style={styles.sectionLabel}>{text}</Text>
    </View>
  );
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
  const verdictColor = VERDICT_COLORS[expandedDetails?.verdict_weight ?? "grey"];
  // 種別は台帳の値をそのまま i18n のキーにする。訳が無い値は生のまま出て、リントで気づける。
  const typeLabel = sourceInfo
    ? i18n.t(`evidenceBottomSheet.sourceType.${sourceInfo.type}`, { defaultValue: sourceInfo.type })
    : null;
  const evidenceThrough = evidenceThroughLabel(sourceInfo?.evidence_through);
  void listSeparator;

  return (
    <>
      {/* 判定が見出し。確からしさと研究のやり方はその根拠として下に置く。
          脚注の位置に置くと、一番知りたい行が最後まで読まないと出てこない。 */}
      {hasVerdict || hasStrength ? (
        <View style={styles.verdict}>
          {hasVerdict ? (
            <>
              {/* 何についての判定かを先に見せる。チップだけだと「何に対する根拠なし？」になる。
                  引用線は判定チップと同じ色で、説と判定が対だと分かる。 */}
              {expandedDetails?.verdict_claim ? (
                <Text style={[styles.verdictClaim, { borderLeftColor: verdictColor }]}>
                  「{expandedDetails.verdict_claim}」
                </Text>
              ) : null}
              <View style={styles.verdictHeadRow}>
                <View style={[styles.verdictChip, { backgroundColor: verdictColor }]}>
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
                <SectionLabel icon="help-circle-outline" text={i18n.t("lesson.strengthHeader")} styles={styles} tight />
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
              {strength.reason ? (
                <Text style={styles.verdictStrength}>
                  {renderEmphasis(strength.reason, styles.verdictStrengthStrong)}
                </Text>
              ) : null}
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
          <SectionLabel icon="flask-outline" text={i18n.t("lesson.howStudiedHeader")} styles={styles} />
          <Text style={styles.sectionText}>{expandedDetails.how_studied}</Text>
        </View>
      ) : null}

      {/* 出どころは静かに。著者と年、種別と「いつまでの研究か」を小さなピルで。
          判定の時点（PRODUCT_DIRECTION 3章）はここに出る。 */}
      {sourceInfo ? (
        <View style={styles.sourceBox}>
          <SectionLabel icon="book-outline" text={i18n.t("evidenceBottomSheet.sourceLabel")} styles={styles} />
          <Text style={styles.sourceAuthor}>
            {sourceInfo.author} ({sourceInfo.year})
          </Text>
          <View style={styles.sourcePillRow}>
            <View style={styles.sourcePill}>
              <Text style={styles.sourcePillText}>{typeLabel}</Text>
            </View>
            {evidenceThrough ? (
              <View style={styles.sourcePill}>
                <Text style={styles.sourcePillText}>{evidenceThrough}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
}
