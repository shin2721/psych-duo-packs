#!/usr/bin/env node

/**
 * Safety Display Linter
 * 安全表示言語の検出（既存Bronze断定リンターとは役割分離）
 */

const { BaseLinter, LinterConfig } = require('./lib/linter-base.js');
const { collectAllEvidenceCards, loadCorrespondingLesson } = require('./lib/evidence-parser.js');

class SafetyDisplayLinter extends BaseLinter {
    constructor() {
        super('Safety Display Linter', 'docs/_reports/safety_display.md');
        this.config = new LinterConfig();
        
        // 確率言語パターン（存在チェック用）
        this.probabilityPatterns = [
            /可能性がある/g,
            /報告されている/g,
            /かもしれない/g,
            /傾向がある/g,
            /示唆されている/g,
            /考えられる/g,
            /場合がある/g,
            /ことがある/g,
            /多くの場合/g,
            /一般的に/g,
            /しばしば/g,
            /時として/g
        ];

        // 高リスク指標（limitationsから）
        this.riskIndicators = [
            /副作用/g,
            /注意/g,
            /禁忌/g,
            /危険/g,
            /リスク/g,
            /慎重/g,
            /医師/g,
            /専門家/g,
            /相談/g
        ];
    }

    /**
     * メインのリント実行
     */
    lint(options = {}) {
        console.log('🔍 Safety Display 言語チェック開始...');
        
        const { includeStaging = false } = options;
        const evidenceCards = collectAllEvidenceCards({ includeStaging });
        
        this.clearResults();
        
        let totalChecked = 0;
        let bronzeCount = 0;
        let riskIndicatorCount = 0;
        let missingProbabilityCount = 0;
        let hasRiskButNoProbabilityCount = 0;
        
        const languageStats = {
            bronze_with_probability: 0,
            bronze_without_probability: 0,
            risk_with_probability: 0,
            risk_without_probability: 0
        };

        for (const card of evidenceCards) {
            totalChecked++;
            
            // Bronze evidenceまたはリスク指標のあるevidenceのみチェック
            const isBronze = card.evidenceGrade === 'bronze';
            const hasRiskIndicators = this.checkRiskIndicators(card.limitations);
            
            if (!isBronze && !hasRiskIndicators) {
                console.log(`  ⏭️  Skipped: ${card.basename} (${card.domain}) - not bronze, no risk indicators`);
                continue;
            }

            if (isBronze) bronzeCount++;
            if (hasRiskIndicators) riskIndicatorCount++;

            // 対応するレッスンファイルを読み込み
            const lesson = loadCorrespondingLesson(card.filePath);
            if (!lesson) {
                console.log(`  ⚠️  No lesson: ${card.basename} (${card.domain}) - lesson file not found`);
                continue;
            }

            // レッスン内の確率言語をチェック
            const probabilityCheck = this.checkProbabilityLanguage(lesson.data);
            
            if (isBronze) {
                if (probabilityCheck.hasProbabilityLanguage) {
                    languageStats.bronze_with_probability++;
                    console.log(`  ✅ GOOD: ${card.basename} (${card.domain}) - bronze with probability language`);
                } else {
                    languageStats.bronze_without_probability++;
                    missingProbabilityCount++;
                    
                    // WARNING（弱め）- 短いテキストでの偽陽性を避ける
                    this.addWarning(
                        card.filePath,
                        card.domain,
                        'Bronze evidence missing probability language',
                        `Bronze evidence should use cautious language. No probability expressions found in lesson.`,
                        [
                            'Add probability language: "可能性がある", "報告されている", "かもしれない"',
                            'Replace definitive statements with tentative expressions',
                            'Consider phrases like "多くの場合", "一般的に", "しばしば"',
                            'Review lesson explanation and actionable_advice fields'
                        ],
                        {
                            evidence_grade: 'bronze',
                            has_risk_indicators: hasRiskIndicators,
                            lesson_question_count: Array.isArray(lesson.data) ? lesson.data.length : 1,
                            probability_patterns_found: probabilityCheck.foundPatterns
                        }
                    );
                    
                    console.log(`  ⚠️  WARNING: ${card.basename} (${card.domain}) - bronze without probability language`);
                }
            }

            if (hasRiskIndicators) {
                if (probabilityCheck.hasProbabilityLanguage) {
                    languageStats.risk_with_probability++;
                    if (!isBronze) {
                        console.log(`  ✅ GOOD: ${card.basename} (${card.domain}) - risk indicators with probability language`);
                    }
                } else {
                    languageStats.risk_without_probability++;
                    if (!isBronze) {
                        hasRiskButNoProbabilityCount++;
                        
                        this.addWarning(
                            card.filePath,
                            card.domain,
                            'Risk indicators without probability language',
                            `Evidence limitations mention risks but lesson lacks cautious language.`,
                            [
                                'Add appropriate caution language to match evidence limitations',
                                'Use probability expressions for uncertain outcomes',
                                'Consider adding safety disclaimers if needed',
                                'Review if this content needs professional consultation warnings'
                            ],
                            {
                                evidence_grade: card.evidenceGrade,
                                risk_indicators_found: hasRiskIndicators.foundIndicators,
                                lesson_question_count: Array.isArray(lesson.data) ? lesson.data.length : 1,
                                probability_patterns_found: probabilityCheck.foundPatterns
                            }
                        );
                        
                        console.log(`  ⚠️  WARNING: ${card.basename} (${card.domain}) - risk indicators without probability language`);
                    }
                }
            }
        }

        // サマリー出力
        console.log(`\n📊 Safety Display 言語チェック完了:`);
        console.log(`  📄 総チェック: ${totalChecked}`);
        console.log(`  🥉 Bronze対象: ${bronzeCount}`);
        console.log(`  ⚠️  リスク指標: ${riskIndicatorCount}`);
        console.log(`  ❌ 確率言語不足: ${missingProbabilityCount}`);
        console.log(`  🚨 リスク+言語不足: ${hasRiskButNoProbabilityCount}`);

        // レポート生成
        this.generateReport({
            'Language Pattern Analysis': this.generateLanguageStats(languageStats),
            'Risk Indicator Analysis': this.generateRiskAnalysis(bronzeCount, riskIndicatorCount, missingProbabilityCount),
            'Role Separation': this.generateRoleSeparationInfo()
        });

        this.printSummary();
        
        return {
            totalChecked,
            bronzeCount,
            riskIndicatorCount,
            missingProbabilityCount,
            hasRiskButNoProbabilityCount,
            languageStats,
            warnings: this.getWarningCount(),
            errors: this.getErrorCount()
        };
    }

    /**
     * リスク指標をチェック
     */
    checkRiskIndicators(limitations) {
        if (!limitations) return false;
        
        const foundIndicators = [];
        for (const pattern of this.riskIndicators) {
            const matches = limitations.match(pattern);
            if (matches) {
                foundIndicators.push(...matches);
            }
        }
        
        return foundIndicators.length > 0 ? { foundIndicators } : false;
    }

    /**
     * 確率言語をチェック
     */
    checkProbabilityLanguage(lessonData) {
        const foundPatterns = [];
        let hasProbabilityLanguage = false;
        
        // レッスンデータから全テキストを抽出
        const allText = this.extractAllText(lessonData);
        
        for (const pattern of this.probabilityPatterns) {
            const matches = allText.match(pattern);
            if (matches) {
                foundPatterns.push(...matches);
                hasProbabilityLanguage = true;
            }
        }
        
        return {
            hasProbabilityLanguage,
            foundPatterns: [...new Set(foundPatterns)] // 重複除去
        };
    }

    /**
     * レッスンデータから全テキストを抽出
     */
    extractAllText(lessonData) {
        let allText = '';
        
        if (Array.isArray(lessonData)) {
            for (const question of lessonData) {
                if (question.question) allText += question.question + ' ';
                if (question.explanation) allText += question.explanation + ' ';
                if (question.actionable_advice) allText += question.actionable_advice + ' ';
                
                // 選択肢もチェック
                if (question.choices && Array.isArray(question.choices)) {
                    for (const choice of question.choices) {
                        if (typeof choice === 'string') {
                            allText += choice + ' ';
                        } else if (choice.text) {
                            allText += choice.text + ' ';
                        }
                    }
                }
            }
        }
        
        return allText;
    }

    /**
     * 言語統計セクションを生成
     */
    generateLanguageStats(stats) {
        const bronzeTotal = stats.bronze_with_probability + stats.bronze_without_probability;
        const riskTotal = stats.risk_with_probability + stats.risk_without_probability;
        
        const bronzeGoodPercent = bronzeTotal > 0 ? ((stats.bronze_with_probability / bronzeTotal) * 100).toFixed(1) : '0.0';
        const riskGoodPercent = riskTotal > 0 ? ((stats.risk_with_probability / riskTotal) * 100).toFixed(1) : '0.0';

        return `| Category | With Probability Language | Without | Total | Good % |
|----------|---------------------------|---------|-------|--------|
| Bronze Evidence | ${stats.bronze_with_probability} | ${stats.bronze_without_probability} | ${bronzeTotal} | ${bronzeGoodPercent}% |
| Risk Indicators | ${stats.risk_with_probability} | ${stats.risk_without_probability} | ${riskTotal} | ${riskGoodPercent}% |

**Target:** Maximize probability language usage for Bronze evidence and risk-indicated content`;
    }

    /**
     * リスク分析セクションを生成
     */
    generateRiskAnalysis(bronzeCount, riskCount, missingCount) {
        return `| Risk Level | Count | Description |
|------------|-------|-------------|
| Bronze Evidence | ${bronzeCount} | Evidence grade requires cautious language |
| Risk Indicators | ${riskCount} | Limitations mention safety concerns |
| Missing Probability Language | ${missingCount} | Bronze evidence without cautious expressions |

**Risk Indicators:** 副作用, 注意, 禁忌, 危険, リスク, 慎重, 医師, 専門家, 相談  
**Probability Language:** 可能性がある, 報告されている, かもしれない, 傾向がある, 示唆されている`;
    }

    /**
     * 役割分離情報セクションを生成
     */
    generateRoleSeparationInfo() {
        return `This linter focuses on **required probability language** and complements existing linters:

| Linter | Focus | Detection Method |
|--------|-------|------------------|
| **Safety Display Linter** (this) | Required cautious language | Positive detection of probability expressions |
| Bronze Assertion Linter | Prohibited definitive language | Negative detection of assertion patterns |

**Key Differences:**
- **Bronze Assertion:** Detects "絶対", "必ず", "確実", "治る" (prohibited)
- **Safety Display:** Detects "可能性がある", "報告されている", "かもしれない" (required)

**No duplication:** Different pattern sets, different warning conditions, complementary coverage.`;
    }

    /**
     * 推奨アクションをカスタマイズ
     */
    generateRecommendedActions() {
        return `## Recommended Actions

### For Bronze Evidence Missing Probability Language
1. **Add probability expressions** to lesson explanations:
   - "可能性がある" (there is a possibility)
   - "報告されている" (it has been reported)
   - "かもしれない" (it might be)
   - "傾向がある" (there is a tendency)

2. **Replace definitive statements** with cautious language:
   - "効果的です" → "効果的である可能性があります"
   - "改善します" → "改善する場合があります"
   - "役立ちます" → "役立つ傾向があります"

### For Risk Indicators Without Probability Language
1. **Match lesson language to evidence limitations**
2. **Add appropriate safety disclaimers** when needed
3. **Consider professional consultation warnings** for high-risk content
4. **Use conditional language** for uncertain outcomes

### Language Pattern Guidelines
1. **Use tentative expressions** for Bronze evidence claims
2. **Maintain scientific accuracy** while being appropriately cautious
3. **Balance informativeness** with uncertainty acknowledgment
4. **Consider user safety** in language choices

### Integration Notes
- **Prohibited language:** Use Bronze assertion linter for definitive expressions
- **Evidence grading:** Use evidence grade inflation linter for grade appropriateness
- **Citation quality:** Use other linters for source credibility issues

## Next Steps

\`\`\`bash
# Re-run safety display language check
npm run lint:safety-display

# Check for prohibited assertions
npm run lint:bronze-assertions

# Run full preflight check
npm run content:preflight
\`\`\`
`;
    }
}

/**
 * スタンドアロン実行
 */
function lintSafetyDisplay(options = {}) {
    const linter = new SafetyDisplayLinter();
    return linter.lint(options);
}

// 実行
if (require.main === module) {
    const includeStaging = process.argv.includes('--include-staging');
    lintSafetyDisplay({ includeStaging });
}

module.exports = { lintSafetyDisplay, SafetyDisplayLinter };