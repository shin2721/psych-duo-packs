#!/usr/bin/env node

/**
 * Evidence Quality Automation - Main Orchestrator
 * 3つのエビデンス品質リンターを統合実行
 */

const { lintMultipleCitations } = require('./lint-multiple-citations.js');
const { lintBookSources } = require('./lint-book-sources.js');
const { lintSafetyDisplay } = require('./lint-safety-display.js');

/**
 * 全エビデンス品質チェックを実行
 */
async function lintEvidenceQuality(options = {}) {
    console.log('🚀 Evidence Quality Automation 開始...');
    console.log('=====================================\n');
    
    const { includeStaging = false } = options;
    const results = {};
    
    try {
        // 1. Multiple Citation Linter
        console.log('📊 Step 1: Multiple Citation チェック...');
        results.multipleCitations = lintMultipleCitations({ includeStaging });
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 2. Book Source Linter
        console.log('📚 Step 2: Book Source 多様性チェック...');
        results.bookSources = lintBookSources({ includeStaging });
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 3. Safety Display Linter
        console.log('🛡️  Step 3: Safety Display 言語チェック...');
        results.safetyDisplay = lintSafetyDisplay({ includeStaging });
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 4. 統合サマリー
        console.log('📊 Evidence Quality Automation 完了サマリー:');
        
        const totalWarnings = (results.multipleCitations?.warnings || 0) + 
                             (results.bookSources?.warnings || 0) + 
                             (results.safetyDisplay?.warnings || 0);
        
        const totalErrors = (results.multipleCitations?.errors || 0) + 
                           (results.bookSources?.errors || 0) + 
                           (results.safetyDisplay?.errors || 0);
        
        console.log(`  📄 総Evidence数: ${results.multipleCitations?.totalChecked || 0}`);
        console.log(`  ⚠️  総警告数: ${totalWarnings}`);
        console.log(`  ❌ 総エラー数: ${totalErrors}`);
        console.log('');
        
        // 個別サマリー
        console.log('  📊 Multiple Citations:');
        console.log(`    - 十分な引用 (2+): ${results.multipleCitations?.sufficientCitations || 0}`);
        console.log(`    - 単一ソース (1): ${results.multipleCitations?.singleSourceCount || 0}`);
        console.log(`    - 引用なし (0): ${results.multipleCitations?.noCitationCount || 0} (trackability処理)`);
        
        console.log('  📚 Book Sources:');
        console.log(`    - 良い多様性: ${results.bookSources?.goodDiversityCount || 0}`);
        console.log(`    - 書籍偏重: ${results.bookSources?.bookHeavyCount || 0}`);
        console.log(`    - 単一書籍: ${results.bookSources?.singleBookCount || 0}`);
        
        console.log('  🛡️  Safety Display:');
        console.log(`    - Bronze対象: ${results.safetyDisplay?.bronzeCount || 0}`);
        console.log(`    - リスク指標: ${results.safetyDisplay?.riskIndicatorCount || 0}`);
        console.log(`    - 確率言語不足: ${results.safetyDisplay?.missingProbabilityCount || 0}`);
        
        console.log('\n🎯 推奨アクション:');
        console.log('  1. 単一ソース依存の解消（2番目の引用追加）');
        console.log('  2. 書籍偏重パターンの改善（peer-reviewed追加）');
        console.log('  3. Bronze evidenceの確率言語追加');
        console.log('  4. リスク指標のある内容の慎重言語確認');
        
        console.log('\n📝 生成レポート:');
        console.log('  - docs/_reports/multiple_citations.md');
        console.log('  - docs/_reports/book_sources.md');
        console.log('  - docs/_reports/safety_display.md');
        
        // CI統合用の終了コード
        if (totalErrors > 0) {
            console.log('\n❌ FAIL: エラーが検出されました');
            process.exit(1);
        } else if (totalWarnings > 0) {
            console.log('\n⚠️  WARNING: 警告がありますが、CI継続可能');
            process.exit(0);
        } else {
            console.log('\n✅ PASS: 問題なし');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n❌ Evidence Quality Automation エラー:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
    
    return results;
}

/**
 * コマンドライン引数解析
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        includeStaging: false,
        help: false
    };
    
    for (const arg of args) {
        switch (arg) {
            case '--include-staging':
                options.includeStaging = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                console.warn(`Unknown argument: ${arg}`);
        }
    }
    
    return options;
}

/**
 * ヘルプ表示
 */
function showHelp() {
    console.log(`
Evidence Quality Automation

Usage: node scripts/lint-evidence-quality.js [options]

Options:
  --include-staging    Include staging content in checks
  --help, -h          Show this help message

Description:
  Runs three evidence quality linters to maintain content standards:
  
  1. Multiple Citation Linter - Detects single-source dependency
  2. Book Source Linter - Detects book-heavy citation patterns  
  3. Safety Display Linter - Detects missing probability language

Integration:
  - Complements existing linters (trackability, Bronze assertions, Gold inflation)
  - Generates reports in docs/_reports/ directory
  - WARNING-level issues (CI continues), minimal FAIL conditions
  - Role separation to avoid duplication with existing quality checks

Examples:
  npm run lint:evidence-quality
  node scripts/lint-evidence-quality.js --include-staging
`);
}

// 実行
if (require.main === module) {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        process.exit(0);
    }
    
    lintEvidenceQuality(options);
}

module.exports = { lintEvidenceQuality };