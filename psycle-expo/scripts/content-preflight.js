#!/usr/bin/env node

/**
 * Content Preflight Check
 * 全体的なコンテンツ品質チェックを実行
 */

const { generateInventoryReport } = require('./generate-lesson-inventory.js');
const { generateEvidenceCards } = require('./generate-evidence-scaffold.js');
const { lintBronzeAssertions } = require('./lint-bronze-assertions.js');
const { lintEvidenceGradeInflation } = require('./lint-evidence-grade-inflation.js');
const { lintCitationTrackability } = require('./lint-citation-trackability.js');
const { lintEvidenceSpecificity } = require('./lint-evidence-specificity.js');
const { lintClaimAlignment } = require('./lint-claim-alignment.js');

async function runPreflight() {
    console.log('🚀 Content Preflight Check 開始...');
    console.log('=====================================\n');
    
    // 1. インベントリ生成
    console.log('📋 Step 1: レッスン棚卸し...');
    const inventory = generateInventoryReport();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Evidence scaffold生成
    console.log('🔧 Step 2: Evidence scaffold生成...');
    const scaffoldResult = generateEvidenceCards();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. Bronze断定表現チェック
    console.log('🔍 Step 3: Bronze断定表現チェック...');
    const assertionWarnings = lintBronzeAssertions();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. Evidence Grade Inflation チェック
    console.log('🔍 Step 4: Evidence Grade Inflation チェック...');
    const inflationWarnings = lintEvidenceGradeInflation();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. Citation Trackability チェック
    console.log('🔍 Step 5: Citation Trackability チェック...');
    const trackabilityResult = lintCitationTrackability();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 6. Evidence Specificity チェック (C-pack K1)
    console.log('🔍 Step 6: Evidence Specificity チェック...');
    const specificityResult = lintEvidenceSpecificity();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 7. Claim Alignment チェック (C-pack K2)
    console.log('🔍 Step 7: Claim Alignment チェック...');
    const alignmentResult = lintClaimAlignment();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 8. 未承認Evidence警告
    console.log('⚠️  Step 8: 未承認Evidence警告...');
    const unapproved = inventory.filter(item => item.humanApproved === 'false');
    
    if (unapproved.length > 0) {
        console.log(`⚠️  WARNING: ${unapproved.length}個の未承認Evidenceがあります:`);
        for (const item of unapproved) {
            console.log(`  - ${item.basename} (${item.domain})`);
        }
        console.log('\n💡 これらのEvidenceは人間による承認が必要です。');
        console.log('   承認後、review.human_approved を true に変更してください。');
    } else {
        console.log('✅ 全てのEvidenceが承認済みです。');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 9. 最終サマリー
    console.log('📊 Preflight Check 完了サマリー:');
    console.log(`  📄 総レッスン数: ${inventory.length}`);
    console.log(`  📋 Evidence網羅率: ${((inventory.filter(i => i.hasEvidence).length / inventory.length) * 100).toFixed(1)}%`);
    console.log(`  🔧 新規scaffold: ${scaffoldResult.generated}個`);
    console.log(`  ⚠️  Bronze断定警告: ${assertionWarnings.length}個`);
    console.log(`  🔍 Goldインフレ警告: ${inflationWarnings.length}個`);
    console.log(`  📎 追跡可能: ${trackabilityResult.trackableCount}/${trackabilityResult.totalChecked}`);
    console.log(`  📏 薄いEvidence警告: ${specificityResult.thinWarnings}個`);
    console.log(`  🎯 整合性警告: ${alignmentResult.alignmentWarnings}個`);
    console.log(`  🚨 未承認Evidence: ${unapproved.length}個`);
    
    console.log('\n🎯 次のステップ:');
    console.log('  1. 未承認Evidenceの中身を埋める（Antigravity担当）');
    console.log('  2. Bronze断定表現を修正する');
    console.log('  3. DOI/PMID情報を追加する');
    console.log('  4. Evidence承認（human_approved=true）');
    
    return {
        inventory,
        scaffoldResult,
        assertionWarnings,
        inflationWarnings,
        trackabilityResult,
        specificityResult,
        alignmentResult,
        unapproved
    };
}

// 実行
if (require.main === module) {
    runPreflight().catch(console.error);
}

module.exports = { runPreflight };