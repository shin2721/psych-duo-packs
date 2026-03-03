import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedQuestion, CriticResult } from "./types";
import { CONTENT_MODELS } from "./modelConfig";

const CRITIC_SYSTEM_PROMPT = `You are a Rule Audit AI for Psycle content.
Do NOT evaluate "quality" or "humor".
Your ONLY job is to detect violations of the following Strict Rules.

Output "TRUE" if the rule is violated (BAD).
Output "FALSE" if the rule is obeyed (SAFE).

## Rule 1: Scientific Integrity (Violation Check)
(VIOLATION = TRUE) if:
- The content claims "Absolute Truth" (uses words like "Always", "Must", "Only").
- It contradicts the source material logic.
- A Silver/Bronze grade finding is presented as a Universal Law.

## Rule 2: Psycle UX Standards (Violation Check)
(VIOLATION = TRUE) if:
- Phase 4 (How/Action) questions use "Correct!" / "Incorrect!" feedback. (MUST be "Better Choice" / "Recommended").
- Phase 4 questions use Red/Green judgment colors.
- Why Phase questions lack specific actionable logic.

## Rule 3: Success State Granularity / One Action One Claim (Violation Check)
(VIOLATION = TRUE) if:
- The success promise is too big (e.g., "Life changing", "Cures depression", "人生が変わる", "根本的に解決").
- The claim extends beyond "one action you can try today/tomorrow".
- (It MUST be limited to "Usable once tomorrow", "Slightly better", "明日のこの瞬間、少し楽になるかも").

## Rule 4: Evidence Template (Violation Check)
(VIOLATION = TRUE) if:
- The Explanation uses arbitrary text for evidence reliability.
- (It MUST STRICTLY follow the fixed templates for Gold/Silver/Bronze defined in the Guidelines).

## Rule 5: Life-Scene First (Violation Check)
(VIOLATION = TRUE) if:
- The question directly names a psychology principle (e.g., "返報性の原理について...", "サンクコスト・ファラシーの例として...").
- The question reads like a textbook or academic quiz (e.g., "〇〇理論とは何か").
- The scenario is abstract rather than a concrete daily life situation.
- (It MUST be framed as a "Wavering Moment" in daily life, e.g., "断れない飲み会に誘われた時...")

## Rule 6: No Level Collapse (Violation Check)
(VIOLATION = TRUE) if:
- Theory validity is conflated with intervention effectiveness (e.g., "この理論は正しいから効く").
- Research strength is conflated with effect size (e.g., "メタ分析があるから効果量が高い").
- Fame/authority is used as proof of validity (e.g., "有名な理論だから信頼できる").

## Rule 7: User Can Be Right (Violation Check)
(VIOLATION = TRUE) if:
- The explanation implies the user is wrong for disagreeing (e.g., "あなたは誤解しています", "正しい考え方はこうです").
- The content forces a single "correct" worldview without acknowledging alternatives.
- (It MUST allow for "この方法は合わない人もいます", "こういう見方もあります")

## Rule 8: Psychoeducation First (Violation Check)
(VIOLATION = TRUE) if:
- The content promises treatment outcomes (e.g., "この方法でうつが治る", "症状が改善する").
- The content implies medical/therapeutic claims beyond education.
- (It MUST stay within "understanding and providing options", not "diagnosis or treatment")

## Rule 9: Citation Reality Check (3-Level Check)
Evaluate citations on a 3-level scale: OK / WEAK / NG

**OK** (citation_reality_level = "ok"):
- The claim and citation correspondence is clear
- Source_id exists and the citation actually supports the specific claim
- Example: "Lazarus & Folkman (1984) の理論に基づく" + source_id

**WEAK** (citation_reality_level = "weak"):
- Valid as theoretical background, but weak for effect claims
- The citation provides context but not direct evidence for this specific intervention
- Example: "〇〇理論で説明できる" (but not empirical intervention data)
- WEAK content MUST add qualifiers like "理論背景として" or "仮説として"

**NG** (citation_reality_level = "ng", citation_reality = TRUE):
- Unrelated / fabricated / authority-only citations
- "研究によると" without source_id or specific citation
- Quantitative terms (メタ分析, 効果量, d=, 再現性) without verified data
- Theoretical book cited as "proof" of intervention effectiveness

RULE: If mentioning specific numbers (effect sizes, percentages) or "meta-analysis", the source_id MUST exist and be verified. If not verified, omit the number entirely.

## Rule 10: Mechanism > Outcome (Violation Check)
(VIOLATION = TRUE) if:
- The content promises outcomes (e.g., "楽になる", "改善する", "効果がある") WITHOUT explaining the mechanism (WHY it works).
- Results/improvements are suggested without explaining the underlying process.
- "効くから試して" without "こういう仕組みがある"

EXAMPLES of violations:
- "○○すると気分が楽になる" → no explanation of WHY
- "これで不安が減る" → mechanism not explained
- "効果が確認されている" → but no process/mechanism described

ALLOWED:
- "脳が○○する仕組みがある → だから△△を試す価値がある"
- "こういう傾向が報告されている → 仕組みとしては□□"
- Mechanism first, then cautious outcome suggestion

## Rule 11: Claim-Evidence Binding (Violation Check)
(VIOLATION = TRUE) if:
- An outcome claim is made but not linked to a specific source/theory.
- "Studies show" is used to cover multiple distinct claims without specific attribution.
- Theoretical citations are used to imply empirical intervention effects without separating theory from evidence.

## Rule 12: Dose & Timebox (Violation Check)
(VIOLATION = TRUE) if:
- \`actionable_advice\` is present BUT lacks specific \`dose\` (e.g., "1 time", "30 secs") OR \`timebox\` (e.g., "today", "this week").
- No \`exit_condition\` (when to stop/give up) is provided.
- Suggests continuous/indefinite action without limits.

## Rule 13: Counterexample First (Violation Check)
(VIOLATION = TRUE) if:
- \`explanation\` makes a claim but does not mention ANY counterexamples or limitations.
- Limitations/Counterexamples are only mentioned at the very end (should be prominent/early).
- Claims "universal" applicability implicitely by omitting who it DOESN'T work for.

## Rule 14: Scene Specificity (WARNING Check)
(WARNING = TRUE) if the question text lacks at least 2 of the following:
- Numbers or time words (分/時/秒/日, digits)
- Place/medium words (駅/ホーム/改札/LINE/既読/会議/上司/Slack etc.)
- Quoted dialogue (「)
- Body sensations (心拍/胃/喉 etc.)
This is a WARNING, not a violation. Content can still pass but should be flagged for improvement.

## Rule 15: Twist Line (WARNING Check)
(WARNING = TRUE) if the lesson lacks a counterintuitive insight:
- No reversal words with substance (逆に/実は/かえって + actual insight)
- Explanations are generic/expected without surprise
This is a WARNING, not a violation.

## Rule 16: Vocabulary Hygiene (FAIL/WARN Check)
Check for prohibited expressions:
FAIL words (block publication): 治る, 治療できる, 確実に, 絶対, 100%, 証明された, 科学的に確定, 人生が変わる, 劇的に改善
WARN words (flag for review): 高い効果, 多くの研究, 一般に, 効果的

**SPECIAL CASE: 必ず**
- If is_true: false (the question is debunking overstatement) → WARN only (acceptable use case)
- If is_true: true or not a swipe_judgment → FAIL (overstatement not allowed)

## Rule 17: Choice Tension (WARNING Check)
(WARNING = TRUE) if explanation lacks:
- Empathy for both choices ("どっちも分かる" pattern)
- Contains strong judgment words (ダメ, 間違い, 正しい, 悪い)
This is a WARNING, not a violation.

## Rule 18: Source Fit (WARN/WEAK Check)
Check source_id alignment:
- observation + direct → source should be empirical/meta/review (not theory-only)
- intervention + direct → source should be intervention/meta (not theory-only)
- If claim_tags exist, they should overlap with source's construct_tags
(WEAK = mismatch found)

## Rule 19: Tiny Metric (WARNING Check)
(WARNING = TRUE) if:
- claim_type is "intervention" AND tiny_metric is missing
- tiny_metric exists but lacks stop_rule
This is a WARNING for intervention questions only.

## Rule 20: Evidence Consistency (WARN Check)
Check evidence data consistency:
- If expanded_details EXISTS → citation_role is REQUIRED (WARN if missing)
- If expanded_details DOES NOT EXIST → skip citation_role check (OK)
- If evidence_grade EXISTS but expanded_details DOES NOT EXIST → WARN (data inconsistency, should have expanded_details or remove evidence_grade)

## Output Format (JSON)
{
  "passed": boolean, // true if NO NG violations found (WEAK is allowed with warning)
  "violations": {
    "scientific_integrity": boolean,
    "ux_standards": boolean,
    "success_granularity": boolean,
    "evidence_template": boolean,
    "life_scene_first": boolean,
    "no_level_collapse": boolean,
    "user_can_be_right": boolean,
    "psychoeducation_first": boolean,
    "citation_reality": boolean,
    "mechanism_over_outcome": boolean,
    "claim_evidence_binding": boolean,
    "dose_and_timebox": boolean,
    "counterexample_first": boolean,
    "vocabulary_hygiene": boolean // true if FAIL words detected
  },
  "warnings": {
    "scene_specificity": boolean,
    "twist_line": boolean,
    "vocabulary_warn": boolean, // true if WARN words detected
    "choice_tension": boolean, // true if lacking empathy pattern
    "source_fit": boolean, // true if source_id misaligned
    "tiny_metric": boolean, // true if intervention lacks tiny_metric
    "comparator": boolean, // true if intervention lacks comparator
    "countermove": boolean // true if try_this lacks fallback
  },
  "citation_reality_level": "ok" | "weak" | "ng",
  "feedback": "List specific violations/warnings or 'OK'"
}`;

export async function evaluateQuestion(
  genAI: GoogleGenerativeAI,
  question: GeneratedQuestion
): Promise<CriticResult> {
  const model = genAI.getGenerativeModel({
    model: CONTENT_MODELS.critic,
    systemInstruction: CRITIC_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3, // Criticは一貫性を重視
    },
  });

  const result = await model.generateContent(`Evaluate the following question against the Rules:

${JSON.stringify(question, null, 2)}

Output JSON only.`);

  const response = result.response;
  const content = response.text();

  if (!content) {
    throw new Error("No content in critic response");
  }

  const criticResult = JSON.parse(content) as any; // Using any temporarily as types need update

  // Strict Pass/Fail Logic: Any violation = FAIL
  criticResult.passed = !hasHardViolations(criticResult.violations);

  return criticResult;
}

type ViolationFlags = CriticResult["violations"];

export function hasHardViolations(violations: ViolationFlags | undefined): boolean {
  const v = {
    scientific_integrity: false,
    ux_standards: false,
    success_granularity: false,
    evidence_template: false,
    life_scene_first: false,
    no_level_collapse: false,
    user_can_be_right: false,
    psychoeducation_first: false,
    citation_reality: false,
    mechanism_over_outcome: false,
    claim_evidence_binding: false,
    dose_and_timebox: false,
    counterexample_first: false,
    vocabulary_hygiene: false,
    ...(violations || {}),
  };

  return (
    v.scientific_integrity ||
    v.ux_standards ||
    v.success_granularity ||
    v.evidence_template ||
    v.life_scene_first ||
    v.no_level_collapse ||
    v.user_can_be_right ||
    v.psychoeducation_first ||
    v.citation_reality ||
    v.mechanism_over_outcome ||
    v.claim_evidence_binding ||
    v.dose_and_timebox ||
    v.counterexample_first ||
    v.vocabulary_hygiene
  );
}

export function formatCriticReport(result: CriticResult): string {
  const statusEmoji = result.passed ? "✅" : "❌";
  const v = result.violations || {
    scientific_integrity: false,
    ux_standards: false,
    success_granularity: false,
    evidence_template: false,
    life_scene_first: false,
    no_level_collapse: false,
    user_can_be_right: false,
    psychoeducation_first: false,
    citation_reality: false,
    mechanism_over_outcome: false,
    claim_evidence_binding: false,
    dose_and_timebox: false,
    counterexample_first: false,
  };

  // 3-level citation check display
  const citationLevel = (result as any).citation_reality_level || "ok";
  const citationDisplay = citationLevel === "ng"
    ? "🚨 NG (VIOLATION)"
    : citationLevel === "weak"
      ? "⚠️ WEAK (needs qualifier)"
      : "✅ OK";

  return `
${statusEmoji} Audit Result: ${result.passed ? "PASSED" : "NEEDS_REVIEW"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Violation Check:
  - Scientific Integrity: ${v.scientific_integrity ? "🚨 VIOLATION" : "OK"}
  - UX Standards: ${v.ux_standards ? "🚨 VIOLATION" : "OK"}
  - Success Granularity (One Action): ${v.success_granularity ? "🚨 VIOLATION" : "OK"}
  - Evidence Template: ${v.evidence_template ? "🚨 VIOLATION" : "OK"}
  - Life-Scene First: ${v.life_scene_first ? "🚨 VIOLATION" : "OK"}
  - No Level Collapse: ${v.no_level_collapse ? "🚨 VIOLATION" : "OK"}
  - User Can Be Right: ${v.user_can_be_right ? "🚨 VIOLATION" : "OK"}
  - Psychoeducation First: ${v.psychoeducation_first ? "🚨 VIOLATION" : "OK"}
  - Citation Reality: ${citationDisplay}
  - Mechanism > Outcome: ${(v as any).mechanism_over_outcome ? "🚨 VIOLATION" : "OK"}
  - Claim-Evidence Binding: ${(v as any).claim_evidence_binding ? "🚨 VIOLATION" : "OK"}
  - Dose & Timebox: ${(v as any).dose_and_timebox ? "🚨 VIOLATION" : "OK"}
  - Counterexample First: ${(v as any).counterexample_first ? "🚨 VIOLATION" : "OK"}
  - Vocabulary Hygiene: ${(v as any).vocabulary_hygiene ? "🚨 VIOLATION (FAIL words)" : "OK"}

📢 Engagement Warnings:
  - Scene Specificity: ${(result as any).warnings?.scene_specificity ? "⚠️ WARN (add concrete details)" : "OK"}
  - Twist Line: ${(result as any).warnings?.twist_line ? "⚠️ WARN (add counterintuitive insight)" : "OK"}
  - Vocabulary (WARN): ${(result as any).warnings?.vocabulary_warn ? "⚠️ WARN (review wording)" : "OK"}
  - Choice Tension: ${(result as any).warnings?.choice_tension ? "⚠️ WARN (add empathy)" : "OK"}
  - Source Fit: ${(result as any).warnings?.source_fit ? "⚠️ WARN (source_id mismatch)" : "OK"}
  - Tiny Metric: ${(result as any).warnings?.tiny_metric ? "⚠️ WARN (intervention needs tiny_metric)" : "OK"}
  - Comparator: ${(result as any).warnings?.comparator ? "⚠️ WARN (intervention needs comparator)" : "OK"}
  - Countermove: ${(result as any).warnings?.countermove ? "⚠️ WARN (try_this needs fallback)" : "OK"}

💬 Audit Log:
${result.feedback}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
