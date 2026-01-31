#!/usr/bin/env node

/**
 * Evidence Specificity Linter
 * Evidence深度スコア（claim/limitations長さ等）をチェック
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';
const REPORT_PATH = 'docs/_reports/evidence_specificity.md';

function lintEvidenceSpecificity() {
    console.log('🔍 Evidence Specificity チェック開始...');
    
    // レポートディレクトリ作成
    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const results = [];
    let totalChecked = 0;
    let thinWarnings = 0;
    
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
                
                const sourceLabel = evidenceData.source_label || '';
                const claim = evidenceData.claim || '';
                const limitations = evidenceData.limitations || '';
                const lastVerified = evidenceData.last_verified || '';
                const status = evidenceData.status || 'unknown';
                
                const hasSourceLabel = !!(sourceLabel.trim());
                const claimLen = claim.trim().length;
                const limitationsLen = limitations.trim().length;
                const hasLimitations = !!(limitations.trim());
                
                // 追跡可能性タイプ判定
                const citation = evidenceData.citation || {};
                const trackableTypes = [];
                if (citation.doi && citation.doi.trim()) trackableTypes.push('DOI');
                if (citation.pmid && citation.pmid.trim()) trackableTypes.push('PMID');
                if (citation.isbn && citation.isbn.trim()) trackableTypes.push('ISBN');
                if (citation.url && citation.url.trim()) trackableTypes.push('URL');
                const trackableType = trackableTypes.join(',') || 'NONE';
                
                // 薄い判定
                const isThin = claimLen < 40 || limitationsLen < 60;
                if (isThin) {
                    thinWarnings++;
                    console.log(`  ⚠️  THIN: ${basename} (claim:${claimLen}, limitations:${limitationsLen})`);
                } else {
                    console.log(`  ✅ OK: ${basename} (claim:${claimLen}, limitations:${limitationsLen})`);
                }
                
                results.push({
                    domain,
                    basename,
                    hasSourceLabel,
                    claimLen,
                    limitationsLen,
                    hasLimitations,
                    trackableType,
                    lastVerified,
                    status,
                    isThin
                });
                
            } catch (error) {
                console.error(`  ❌ Error reading ${evidencePath}:`, error.message);
            }
        }
    }
    
    // レポート生成
    const reportContent = generateSpecificityReport(results, totalChecked, thinWarnings);
    fs.writeFileSync(REPORT_PATH, reportContent);
    
    console.log(`\n📊 Evidence Specificity チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  ⚠️  薄い警告: ${thinWarnings}`);
    console.log(`  📝 レポート: ${REPORT_PATH}`);
    
    return { results, totalChecked, thinWarnings };
}

function generateSpecificityReport(results, totalChecked, thinWarnings) {
    let markdown = `# Evidence Specificity Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | ${totalChecked} |
| Thin Evidence Warnings | ${thinWarnings} |
| Thin Evidence Rate | ${((thinWarnings / totalChecked) * 100).toFixed(1)}% |

## Specificity Rules

- **THIN WARNING**: claim < 40文字 または limitations < 60文字
- **推奨**: claim 40文字以上、limitations 60文字以上で具体性を確保

## Detailed Results

| Domain | Basename | Source Label | Claim Len | Limitations Len | Has Limitations | Trackable Type | Last Verified | Status | Warning |
|--------|----------|--------------|-----------|-----------------|-----------------|----------------|---------------|--------|---------|
`;

    for (const result of results) {
        const warning = result.isThin ? '⚠️ THIN' : '✅ OK';
        const hasSourceLabelStr = result.hasSourceLabel ? 'Y' : 'N';
        const hasLimitationsStr = result.hasLimitations ? 'Y' : 'N';
        
        markdown += `| ${result.domain} | ${result.basename} | ${hasSourceLabelStr} | ${result.claimLen} | ${result.limitationsLen} | ${hasLimitationsStr} | ${result.trackableType} | ${result.lastVerified} | ${result.status} | ${warning} |\n`;
    }
    
    markdown += `
## Thin Evidence Details

`;

    const thinResults = results.filter(r => r.isThin);
    if (thinResults.length === 0) {
        markdown += `✅ No thin evidence warnings found.\n`;
    } else {
        markdown += `⚠️ Found ${thinResults.length} thin evidence cases:\n\n`;
        
        for (const result of thinResults) {
            markdown += `### ${result.domain}/${result.basename}

**Claim Length:** ${result.claimLen} (推奨: 40+)  
**Limitations Length:** ${result.limitationsLen} (推奨: 60+)  
**Issue:** ${result.claimLen < 40 ? 'Claim too short' : ''} ${result.limitationsLen < 60 ? 'Limitations too short' : ''}

---

`;
        }
    }
    
    markdown += `
## Recommended Actions

1. Review thin evidence cases above
2. Expand claim descriptions to 40+ characters
3. Expand limitations descriptions to 60+ characters
4. Ensure source_label is filled for all evidence

## Next Steps

\`\`\`bash
# After improving evidence specificity, re-run check
npm run lint:evidence-specificity

# Run full preflight check
npm run content:preflight
\`\`\`
`;

    return markdown;
}

// 実行
if (require.main === module) {
    lintEvidenceSpecificity();
}

module.exports = { lintEvidenceSpecificity };