#!/usr/bin/env node

/**
 * Evidence Grade Inflation Linter
 * Goldインフレ（book/classic source_typeでgold grade）を検出
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';
const REPORT_PATH = 'docs/_reports/evidence_grade_inflation.md';

function lintEvidenceGradeInflation() {
    console.log('🔍 Evidence Grade Inflation チェック開始...');
    
    // レポートディレクトリ作成
    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const warnings = [];
    let totalChecked = 0;
    
    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            continue;
        }
        
        const evidenceFiles = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.evidence.json'))
            .sort();
        
        console.log(`\n📁 Checking ${domain}: ${evidenceFiles.length} evidence files`);
        
        for (const evidenceFile of evidenceFiles) {
            const evidencePath = path.join(domainDir, evidenceFile);
            const basename = evidenceFile.replace('.evidence.json', '');
            
            totalChecked++;
            
            try {
                const evidenceData = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
                const sourceType = evidenceData.source_type || 'unknown';
                const evidenceGrade = evidenceData.evidence_grade || 'unknown';
                
                // Goldインフレ検出：book/classic + gold の組み合わせ
                if ((sourceType === 'book' || sourceType === 'classic') && evidenceGrade === 'gold') {
                    warnings.push({
                        file: path.relative('.', evidencePath),
                        basename,
                        sourceType,
                        evidenceGrade,
                        issue: 'Gold inflation: book/classic source should not be gold grade'
                    });
                    console.log(`  ⚠️  WARNING: ${basename} (${sourceType} → ${evidenceGrade})`);
                } else {
                    console.log(`  ✅ OK: ${basename} (${sourceType} → ${evidenceGrade})`);
                }
            } catch (error) {
                console.error(`  ❌ Error reading ${evidencePath}:`, error.message);
            }
        }
    }
    
    // レポート生成
    const reportContent = generateInflationReport(warnings, totalChecked);
    fs.writeFileSync(REPORT_PATH, reportContent);
    
    console.log(`\n📊 Evidence Grade Inflation チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  ⚠️  インフレ警告: ${warnings.length}`);
    console.log(`  📝 レポート: ${REPORT_PATH}`);
    
    return warnings;
}

function generateInflationReport(warnings, totalChecked) {
    const warningCount = warnings.length;
    
    let markdown = `# Evidence Grade Inflation Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | ${totalChecked} |
| Gold Inflation Warnings | ${warningCount} |

## Inflation Detection Rules

- **WARNING**: \`source_type\` が "book" または "classic" で \`evidence_grade\` が "gold" の場合
- **理由**: 書籍や古典的研究は通常 Silver 以下が適切

## Warning Details

`;

    if (warningCount === 0) {
        markdown += `✅ No gold inflation warnings found.\n`;
    } else {
        markdown += `⚠️ Found ${warningCount} potential gold inflation cases:\n\n`;
        
        for (const warning of warnings) {
            markdown += `### ${warning.file}

**Basename:** ${warning.basename}  
**Source Type:** ${warning.sourceType}  
**Evidence Grade:** ${warning.evidenceGrade}  
**Issue:** ${warning.issue}

---

`;
        }
    }
    
    markdown += `
## Recommended Actions

1. Review each warning above
2. Consider downgrading evidence grade:
   - Book sources: Usually Silver or Bronze
   - Classic studies: Usually Silver (unless meta-analysis)
3. Update evidence files and re-run this check

## Next Steps

\`\`\`bash
# After fixing inflation, re-run check
npm run lint:evidence-grade

# Run full preflight check
npm run content:preflight
\`\`\`
`;

    return markdown;
}

// 実行
if (require.main === module) {
    lintEvidenceGradeInflation();
}

module.exports = { lintEvidenceGradeInflation };