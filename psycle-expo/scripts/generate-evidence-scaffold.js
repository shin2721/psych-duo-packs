#!/usr/bin/env node

/**
 * Evidence Scaffold Generator
 * 不足しているEvidence Cardを自動生成（既存は保護）
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';

// Evidence最小テンプレート（未承認・ドラフト状態）
const EVIDENCE_TEMPLATE = {
    "source_type": "unknown",
    "citation": {
        "doi": "",
        "pmid": "",
        "url": ""
    },
    "source_label": "",
    "claim": "",
    "limitations": "",
    "evidence_grade": "bronze",
    "confidence": "low",
    "status": "draft",
    "last_verified": new Date().toISOString().split('T')[0],
    "generated_by": "mode_a",
    "review": {
        "human_approved": false,
        "reviewer": "owner"
    }
};

function generateEvidenceCards() {
    console.log('🔧 Evidence Card自動生成開始...');
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    let generated = 0;
    let skipped = 0;
    let updated = 0;
    
    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            console.log(`⏭️  Skipped: ${domainDir} (not found)`);
            continue;
        }
        
        const lessonFiles = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.ja.json') && f.includes('_l'))
            .sort();
        
        console.log(`\n📁 Processing ${domain}: ${lessonFiles.length} lessons`);
        
        for (const lessonFile of lessonFiles) {
            const basename = lessonFile.replace('.ja.json', '');
            const evidenceFile = `${basename}.evidence.json`;
            const evidencePath = path.join(domainDir, evidenceFile);
            
            if (fs.existsSync(evidencePath)) {
                // 既存ファイルの必須キー補完
                try {
                    const existing = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
                    const merged = mergeWithTemplate(existing, EVIDENCE_TEMPLATE);
                    
                    if (JSON.stringify(existing) !== JSON.stringify(merged)) {
                        fs.writeFileSync(evidencePath, JSON.stringify(merged, null, 2));
                        console.log(`  🔄 Updated: ${evidenceFile} (missing keys added)`);
                        updated++;
                    } else {
                        console.log(`  ✅ OK: ${evidenceFile}`);
                        skipped++;
                    }
                } catch (error) {
                    console.error(`  ❌ Error updating ${evidenceFile}:`, error.message);
                }
            } else {
                // 新規作成
                const newEvidence = { ...EVIDENCE_TEMPLATE };
                newEvidence.source_label = `Evidence for ${basename}`;
                newEvidence.claim = `Claims made in lesson ${basename}`;
                newEvidence.limitations = `Limitations and context for ${basename}`;
                
                fs.writeFileSync(evidencePath, JSON.stringify(newEvidence, null, 2));
                console.log(`  ✨ Created: ${evidenceFile}`);
                generated++;
            }
        }
    }
    
    console.log(`\n📊 Evidence Card生成完了:`);
    console.log(`  ✨ 新規作成: ${generated}`);
    console.log(`  🔄 更新: ${updated}`);
    console.log(`  ✅ スキップ: ${skipped}`);
    console.log(`  📈 総処理: ${generated + updated + skipped}`);
    
    return { generated, updated, skipped };
}

function mergeWithTemplate(existing, template) {
    const merged = { ...existing };
    
    // 必須キーを再帰的に補完
    function ensureKeys(target, source) {
        for (const [key, value] of Object.entries(source)) {
            if (!(key in target)) {
                target[key] = value;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                if (typeof target[key] !== 'object' || target[key] === null) {
                    target[key] = {};
                }
                ensureKeys(target[key], value);
            }
        }
    }
    
    ensureKeys(merged, template);
    return merged;
}

// 実行
if (require.main === module) {
    generateEvidenceCards();
}

module.exports = { generateEvidenceCards };