#!/usr/bin/env node

/**
 * Multiple Citation Linter
 * 複数引用の検出と単一ソース依存の警告
 */

const { BaseLinter, LinterConfig } = require('./lib/linter-base.js');
const { collectAllEvidenceCards, classifyCitations } = require('./lib/evidence-parser.js');

class MultipleCitationLinter extends BaseLinter {
    constructor() {
        super('Multiple Citation Linter', 'docs/_reports/multiple_citations.md');
        this.config = new LinterConfig();
    }

    /**
     * メインのリント実行
     */
    lint(options = {}) {
        console.log('🔍 Multiple Citation チェック開始...');
        
        const { includeStaging = false } = options;
        const evidenceCards = collectAllEvidenceCards({ includeStaging });
        
        this.clearResults();
        
        let totalChecked = 0;
        let sufficientCitations = 0;
        let singleSourceCount = 0;
        let noCitationCount = 0;
        
        const citationStats = {
            zero: 0,
            one: 0,
            two: 0,
            three_plus: 0
        };

        for (const card of evidenceCards) {
            totalChecked++;
            const citationCount = card.citations.citationCount;
            
            // 統計更新
            if (citationCount === 0) {
                citationStats.zero++;
                noCitationCount++;
            } else if (citationCount === 1) {
                citationStats.one++;
                singleSourceCount++;
            } else if (citationCount === 2) {
                citationStats.two++;
                sufficientCitations++;
            } else {
                citationStats.three_plus++;
                sufficientCitations++;
            }

            // 0引用は既存trackabilityリンターが処理するのでスキップ
            if (citationCount === 0) {
                console.log(`  ⏭️  Skipped: ${card.basename} (${card.domain}) - 0 citations (handled by trackability linter)`);
                continue;
            }

            // 1引用の場合は警告
            if (citationCount === 1) {
                const citation = card.citations.primaryCitation;
                const citationType = this.getCitationType(citation);
                
                this.addWarning(
                    card.filePath,
                    card.domain,
                    'Single source dependency',
                    `Only 1 citation found (${citationType}). Minimum 2 citations recommended for evidence reliability.`,
                    [
                        'Add a second citation from a different source type',
                        'Consider adding a systematic review or meta-analysis',
                        'Verify the single citation is high-quality peer-reviewed research',
                        'If upgrading to 2+ citations, consider evidence grade improvement'
                    ],
                    {
                        citation_count: citationCount,
                        primary_citation_type: citationType,
                        source_type: citation.source_type,
                        evidence_grade: card.evidenceGrade
                    }
                );
                
                console.log(`  ⚠️  WARNING: ${card.basename} (${card.domain}) - 1 citation (${citationType})`);
                continue;
            }

            // 2+引用の場合は多様性をチェック
            if (citationCount >= 2) {
                const diversity = this.checkCitationDiversity(card);
                
                if (diversity.hasGoodDiversity) {
                    console.log(`  ✅ GOOD: ${card.basename} (${card.domain}) - ${citationCount} citations (${diversity.types.join(', ')})`);
                } else {
                    console.log(`  ✅ OK: ${card.basename} (${card.domain}) - ${citationCount} citations (${diversity.types.join(', ')})`);
                }
            }
        }

        // サマリー出力
        console.log(`\n📊 Multiple Citation チェック完了:`);
        console.log(`  📄 総チェック: ${totalChecked}`);
        console.log(`  ✅ 十分な引用 (2+): ${sufficientCitations}`);
        console.log(`  ⚠️  単一ソース (1): ${singleSourceCount}`);
        console.log(`  ❌ 引用なし (0): ${noCitationCount} (trackability linterで処理)`);
        console.log(`  📈 十分な引用率: ${((sufficientCitations / totalChecked) * 100).toFixed(1)}%`);

        // レポート生成
        this.generateReport({
            'Citation Statistics': this.generateCitationStats(citationStats, totalChecked),
            'Diversity Analysis': this.generateDiversityAnalysis(evidenceCards)
        });

        this.printSummary();
        
        return {
            totalChecked,
            sufficientCitations,
            singleSourceCount,
            noCitationCount,
            citationStats,
            warnings: this.getWarningCount(),
            errors: this.getErrorCount()
        };
    }

    /**
     * 引用タイプを取得
     */
    getCitationType(citation) {
        if (citation.doi) return 'DOI';
        if (citation.pmid) return 'PMID';
        if (citation.isbn) return 'ISBN';
        if (citation.url) return 'URL';
        return 'unknown';
    }

    /**
     * 引用多様性をチェック
     */
    checkCitationDiversity(card) {
        const classification = card.classification;
        const types = [];
        let hasGoodDiversity = false;

        // 各タイプの存在をチェック
        if (classification.peerReviewed.length > 0) types.push('peer_reviewed');
        if (classification.systematic.length > 0) types.push('systematic');
        if (classification.meta.length > 0) types.push('meta');
        if (classification.book.length > 0) types.push('book');
        if (classification.classic.length > 0) types.push('classic');

        // 良い多様性の定義: primary research + synthesis の組み合わせ
        const hasPrimary = classification.peerReviewed.length > 0;
        const hasSynthesis = classification.systematic.length > 0 || classification.meta.length > 0;
        
        if (hasPrimary && hasSynthesis) {
            hasGoodDiversity = true;
        }

        return {
            hasGoodDiversity,
            types,
            hasPrimary,
            hasSynthesis
        };
    }

    /**
     * 引用統計セクションを生成
     */
    generateCitationStats(stats, total) {
        const zeroPercent = ((stats.zero / total) * 100).toFixed(1);
        const onePercent = ((stats.one / total) * 100).toFixed(1);
        const twoPercent = ((stats.two / total) * 100).toFixed(1);
        const threePlusPercent = ((stats.three_plus / total) * 100).toFixed(1);

        return `| Citation Count | Files | Percentage |
|----------------|-------|------------|
| 0 citations | ${stats.zero} | ${zeroPercent}% |
| 1 citation | ${stats.one} | ${onePercent}% |
| 2 citations | ${stats.two} | ${twoPercent}% |
| 3+ citations | ${stats.three_plus} | ${threePlusPercent}% |

**Target:** Minimize single-source dependency (1 citation warnings)`;
    }

    /**
     * 多様性分析セクションを生成
     */
    generateDiversityAnalysis(evidenceCards) {
        const diversityStats = {
            good_diversity: 0,
            adequate_citations: 0,
            single_source: 0,
            no_citations: 0
        };

        for (const card of evidenceCards) {
            const citationCount = card.citations.citationCount;
            
            if (citationCount === 0) {
                diversityStats.no_citations++;
            } else if (citationCount === 1) {
                diversityStats.single_source++;
            } else {
                const diversity = this.checkCitationDiversity(card);
                if (diversity.hasGoodDiversity) {
                    diversityStats.good_diversity++;
                } else {
                    diversityStats.adequate_citations++;
                }
            }
        }

        const total = evidenceCards.length;
        const goodPercent = ((diversityStats.good_diversity / total) * 100).toFixed(1);
        const adequatePercent = ((diversityStats.adequate_citations / total) * 100).toFixed(1);
        const singlePercent = ((diversityStats.single_source / total) * 100).toFixed(1);
        const nonePercent = ((diversityStats.no_citations / total) * 100).toFixed(1);

        return `| Diversity Level | Files | Percentage |
|-----------------|-------|------------|
| Good diversity (primary + synthesis) | ${diversityStats.good_diversity} | ${goodPercent}% |
| Adequate citations (2+ same type) | ${diversityStats.adequate_citations} | ${adequatePercent}% |
| Single source dependency | ${diversityStats.single_source} | ${singlePercent}% |
| No citations | ${diversityStats.no_citations} | ${nonePercent}% |

**Good diversity:** Primary research + systematic review/meta-analysis  
**Target:** Increase good diversity percentage over time`;
    }

    /**
     * 推奨アクションをカスタマイズ
     */
    generateRecommendedActions() {
        return `## Recommended Actions

### For Single Source Dependencies (1 citation)
1. **Add a second citation** from a different source type
2. **Prioritize systematic reviews** or meta-analyses as supporting citations
3. **Verify primary citation quality** before adding supporting citations
4. **Consider evidence grade upgrade** when moving from 1 to 2+ high-quality citations

### For Citation Diversity Improvement
1. **Combine primary research + synthesis** for optimal evidence strength
2. **Use peer-reviewed + systematic** combination when possible
3. **Avoid book-only citations** for scientific claims
4. **Maintain citation quality** over quantity

### Integration with Existing Linters
- **0 citations:** Handled by citation trackability linter
- **Book-heavy patterns:** Handled by book source linter  
- **Grade inflation:** Handled by evidence grade inflation linter

## Next Steps

\`\`\`bash
# Re-run multiple citation check
npm run lint:multiple-citations

# Check citation trackability (0 citations)
npm run lint:trackability

# Run full preflight check
npm run content:preflight
\`\`\`
`;
    }
}

/**
 * スタンドアロン実行
 */
function lintMultipleCitations(options = {}) {
    const linter = new MultipleCitationLinter();
    return linter.lint(options);
}

// 実行
if (require.main === module) {
    const includeStaging = process.argv.includes('--include-staging');
    lintMultipleCitations({ includeStaging });
}

module.exports = { lintMultipleCitations, MultipleCitationLinter };