#!/usr/bin/env node

/**
 * Book Source Linter
 * 書籍ソース偏重の検出（多様性重視、既存Goldインフレとは役割分離）
 */

const { BaseLinter, LinterConfig } = require('./lib/linter-base.js');
const { collectAllEvidenceCards } = require('./lib/evidence-parser.js');

class BookSourceLinter extends BaseLinter {
    constructor() {
        super('Book Source Linter', 'docs/_reports/book_sources.md');
        this.config = new LinterConfig();
    }

    /**
     * メインのリント実行
     */
    lint(options = {}) {
        console.log('🔍 Book Source 多様性チェック開始...');
        
        const { includeStaging = false } = options;
        const evidenceCards = collectAllEvidenceCards({ includeStaging });
        
        this.clearResults();
        
        let totalChecked = 0;
        let bookHeavyCount = 0;
        let singleBookCount = 0;
        let allBookCount = 0;
        let goodDiversityCount = 0;
        
        const sourceTypeStats = {
            peer_reviewed: 0,
            systematic: 0,
            meta: 0,
            book: 0,
            classic: 0,
            mixed: 0
        };

        for (const card of evidenceCards) {
            totalChecked++;
            const citationCount = card.citations.citationCount;
            const classification = card.classification;
            
            // 引用がない場合はスキップ
            if (citationCount === 0) {
                console.log(`  ⏭️  Skipped: ${card.basename} (${card.domain}) - no citations`);
                continue;
            }

            // ソースタイプ統計更新
            this.updateSourceTypeStats(classification, sourceTypeStats);

            // 書籍系引用の分析
            const bookCount = classification.book.length + classification.classic.length;
            const peerReviewedCount = classification.peerReviewed.length + classification.systematic.length + classification.meta.length;
            
            // 1引用 + 書籍系の場合
            if (citationCount === 1 && bookCount === 1) {
                singleBookCount++;
                bookHeavyCount++;
                
                const bookType = classification.book.length > 0 ? 'book' : 'classic';
                
                this.addWarning(
                    card.filePath,
                    card.domain,
                    'Single book citation dependency',
                    `Only 1 citation and it's a ${bookType}. Consider adding peer-reviewed research for scientific credibility.`,
                    [
                        'Add a peer-reviewed journal article (DOI/PMID)',
                        'Look for systematic reviews on this topic',
                        'Verify the book is from a reputable academic publisher',
                        'Consider if this claim needs stronger evidence base'
                    ],
                    {
                        citation_count: citationCount,
                        book_count: bookCount,
                        book_type: bookType,
                        evidence_grade: card.evidenceGrade,
                        primary_citation_type: this.getPrimaryCitationType(card)
                    }
                );
                
                console.log(`  ⚠️  WARNING: ${card.basename} (${card.domain}) - single ${bookType} citation`);
                continue;
            }

            // 全て書籍系の場合（2+引用）
            if (citationCount >= 2 && bookCount === citationCount && peerReviewedCount === 0) {
                allBookCount++;
                bookHeavyCount++;
                
                this.addWarning(
                    card.filePath,
                    card.domain,
                    'All-book citation pattern',
                    `All ${citationCount} citations are books/classics. No peer-reviewed diversity found.`,
                    [
                        'Add at least one peer-reviewed journal article',
                        'Search for systematic reviews or meta-analyses',
                        'Verify scientific claims with empirical research',
                        'Consider evidence grade implications of book-only sources'
                    ],
                    {
                        citation_count: citationCount,
                        book_count: bookCount,
                        peer_reviewed_count: peerReviewedCount,
                        evidence_grade: card.evidenceGrade,
                        book_types: this.getBookTypes(classification)
                    }
                );
                
                console.log(`  ⚠️  WARNING: ${card.basename} (${card.domain}) - all ${citationCount} citations are books`);
                continue;
            }

            // 良い多様性（少なくとも1つのpeer-reviewed）
            if (peerReviewedCount >= 1) {
                goodDiversityCount++;
                const diversityTypes = this.getDiversityTypes(classification);
                console.log(`  ✅ GOOD: ${card.basename} (${card.domain}) - ${citationCount} citations (${diversityTypes.join(', ')})`);
                continue;
            }

            // その他のケース
            console.log(`  ✅ OK: ${card.basename} (${card.domain}) - ${citationCount} citations`);
        }

        // サマリー出力
        console.log(`\n📊 Book Source 多様性チェック完了:`);
        console.log(`  📄 総チェック: ${totalChecked}`);
        console.log(`  ✅ 良い多様性: ${goodDiversityCount}`);
        console.log(`  ⚠️  書籍偏重: ${bookHeavyCount}`);
        console.log(`    - 単一書籍: ${singleBookCount}`);
        console.log(`    - 全書籍: ${allBookCount}`);
        console.log(`  📈 多様性率: ${((goodDiversityCount / totalChecked) * 100).toFixed(1)}%`);

        // レポート生成
        this.generateReport({
            'Source Type Distribution': this.generateSourceTypeStats(sourceTypeStats, totalChecked),
            'Diversity Analysis': this.generateDiversityAnalysis(totalChecked, goodDiversityCount, bookHeavyCount, singleBookCount, allBookCount),
            'Role Separation': this.generateRoleSeparationInfo()
        });

        this.printSummary();
        
        return {
            totalChecked,
            goodDiversityCount,
            bookHeavyCount,
            singleBookCount,
            allBookCount,
            sourceTypeStats,
            warnings: this.getWarningCount(),
            errors: this.getErrorCount()
        };
    }

    /**
     * ソースタイプ統計を更新
     */
    updateSourceTypeStats(classification, stats) {
        const types = [];
        if (classification.peerReviewed.length > 0) types.push('peer_reviewed');
        if (classification.systematic.length > 0) types.push('systematic');
        if (classification.meta.length > 0) types.push('meta');
        if (classification.book.length > 0) types.push('book');
        if (classification.classic.length > 0) types.push('classic');

        if (types.length > 1) {
            stats.mixed++;
        } else if (types.length === 1) {
            stats[types[0]]++;
        }
    }

    /**
     * プライマリ引用タイプを取得
     */
    getPrimaryCitationType(card) {
        const primary = card.citations.primaryCitation;
        if (!primary) return 'unknown';
        return primary.source_type || 'unknown';
    }

    /**
     * 書籍タイプを取得
     */
    getBookTypes(classification) {
        const types = [];
        if (classification.book.length > 0) types.push('book');
        if (classification.classic.length > 0) types.push('classic');
        return types;
    }

    /**
     * 多様性タイプを取得
     */
    getDiversityTypes(classification) {
        const types = [];
        if (classification.peerReviewed.length > 0) types.push('peer_reviewed');
        if (classification.systematic.length > 0) types.push('systematic');
        if (classification.meta.length > 0) types.push('meta');
        if (classification.book.length > 0) types.push('book');
        if (classification.classic.length > 0) types.push('classic');
        return types;
    }

    /**
     * ソースタイプ統計セクションを生成
     */
    generateSourceTypeStats(stats, total) {
        const peerPercent = ((stats.peer_reviewed / total) * 100).toFixed(1);
        const systematicPercent = ((stats.systematic / total) * 100).toFixed(1);
        const metaPercent = ((stats.meta / total) * 100).toFixed(1);
        const bookPercent = ((stats.book / total) * 100).toFixed(1);
        const classicPercent = ((stats.classic / total) * 100).toFixed(1);
        const mixedPercent = ((stats.mixed / total) * 100).toFixed(1);

        return `| Source Type | Files | Percentage |
|-------------|-------|------------|
| Peer-reviewed only | ${stats.peer_reviewed} | ${peerPercent}% |
| Systematic only | ${stats.systematic} | ${systematicPercent}% |
| Meta-analysis only | ${stats.meta} | ${metaPercent}% |
| Book only | ${stats.book} | ${bookPercent}% |
| Classic only | ${stats.classic} | ${classicPercent}% |
| Mixed types | ${stats.mixed} | ${mixedPercent}% |

**Target:** Increase mixed types and reduce book-only patterns`;
    }

    /**
     * 多様性分析セクションを生成
     */
    generateDiversityAnalysis(total, good, bookHeavy, singleBook, allBook) {
        const goodPercent = ((good / total) * 100).toFixed(1);
        const bookHeavyPercent = ((bookHeavy / total) * 100).toFixed(1);
        const singleBookPercent = ((singleBook / total) * 100).toFixed(1);
        const allBookPercent = ((allBook / total) * 100).toFixed(1);

        return `| Diversity Level | Files | Percentage |
|-----------------|-------|------------|
| Good diversity (≥1 peer-reviewed) | ${good} | ${goodPercent}% |
| Book-heavy patterns | ${bookHeavy} | ${bookHeavyPercent}% |
| - Single book citations | ${singleBook} | ${singleBookPercent}% |
| - All-book citations | ${allBook} | ${allBookPercent}% |

**Good diversity:** At least one peer-reviewed, systematic, or meta-analysis citation  
**Book-heavy:** Single book or all-book citation patterns  
**Target:** Minimize book-heavy patterns, maximize good diversity`;
    }

    /**
     * 役割分離情報セクションを生成
     */
    generateRoleSeparationInfo() {
        return `This linter focuses on **citation diversity** and complements existing linters:

| Linter | Focus | Scope |
|--------|-------|-------|
| **Book Source Linter** (this) | Citation diversity | Book-heavy patterns, peer-reviewed balance |
| Evidence Grade Inflation Linter | Grade appropriateness | Gold/Silver grade vs book citations |
| Multiple Citation Linter | Citation count | Single-source dependency (1 citation) |
| Citation Trackability Linter | Citation validity | Missing DOI/PMID/ISBN/URL (0 citations) |

**No duplication:** Each linter has distinct responsibilities and warning conditions.`;
    }

    /**
     * 推奨アクションをカスタマイズ
     */
    generateRecommendedActions() {
        return `## Recommended Actions

### For Single Book Citations
1. **Add peer-reviewed research** to support book-based claims
2. **Search academic databases** (PubMed, Google Scholar) for empirical studies
3. **Verify book credibility** - academic publisher, expert author, recent edition
4. **Consider claim strength** - does this need stronger evidence base?

### For All-Book Citation Patterns
1. **Add at least one peer-reviewed source** for scientific credibility
2. **Prioritize systematic reviews** or meta-analyses when available
3. **Balance theoretical and empirical** sources appropriately
4. **Review evidence grade** - all-book patterns may not support Gold grade

### Citation Diversity Best Practices
1. **Combine source types:** peer-reviewed + book for comprehensive coverage
2. **Prioritize recent research:** newer studies over older books when possible
3. **Use books for context:** theoretical background, not primary evidence
4. **Maintain quality:** fewer high-quality sources > many low-quality sources

### Integration Notes
- **Grade concerns:** Use evidence grade inflation linter for Gold/Silver appropriateness
- **Citation count:** Use multiple citation linter for single-source dependency
- **Missing citations:** Use trackability linter for 0-citation issues

## Next Steps

\`\`\`bash
# Re-run book source diversity check
npm run lint:book-sources

# Check evidence grade appropriateness
npm run lint:evidence-grade-inflation

# Run full preflight check
npm run content:preflight
\`\`\`
`;
    }
}

/**
 * スタンドアロン実行
 */
function lintBookSources(options = {}) {
    const linter = new BookSourceLinter();
    return linter.lint(options);
}

// 実行
if (require.main === module) {
    const includeStaging = process.argv.includes('--include-staging');
    lintBookSources({ includeStaging });
}

module.exports = { lintBookSources, BookSourceLinter };