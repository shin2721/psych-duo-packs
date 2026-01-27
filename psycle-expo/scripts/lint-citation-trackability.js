#!/usr/bin/env node

/**
 * Citation Trackability Linter
 * 引用の追跡可能性（DOI/PMID/ISBN/URL）をチェック
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';
const REPORT_PATH = 'docs/_reports/citation_trackability.md';

function lintCitationTrackability() {
    console.log('🔍 Citation Trackability チェック開始...');
    
    // レポートディレクトリ作成
    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const warnings = [];
    let totalChecked = 0;
    let trackableCount = 0;
    
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
                const citation = evidenceData.citation || {};
                const sourceType = evidenceData.source_type || 'unknown';
                
                const hasDoi = !!(citation.doi && citation.doi.trim());
                const hasPmid = !!(citation.pmid && citation.pmid.trim());
                const hasIsbn = !!(citation.isbn && citation.isbn.trim());
                const hasUrl = !!(citation.url && citation.url.trim());
                
                const isTrackable = hasDoi || hasPmid || hasIsbn || hasUrl;
                
                if (isTrackable) {
                    trackableCount++;
                    const trackingMethods = [];
                    if (hasDoi) trackingMethods.push('DOI');
                    if (hasPmid) trackingMethods.push('PMID');
                    if (hasIsbn) trackingMethods.push('ISBN');
                    if (hasUrl) trackingMethods.push('URL');
                    
                    console.log(`  ✅ TRACKABLE: ${basename} (${sourceType} → ${trackingMethods.join(', ')})`);
                } else {
                    warnings.push({
                        file: path.relative('.', evidencePath),
                        basename,
                        sourceType,
                        issue: 'No citation trackability: missing DOI, PMID, ISBN, and URL'
                    });
                    console.log(`  ❌ NOT TRACKABLE: ${basename} (${sourceType})`);
                }
            } catch (error) {
                console.error(`  ❌ Error reading ${evidencePath}:`, error.message);
            }
        }
    }
    
    // レポート生成
    const reportContent = generateTrackabilityReport(warnings, totalChecked, trackableCount);
    fs.writeFileSync(REPORT_PATH, reportContent);
    
    console.log(`\n📊 Citation Trackability チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  ✅ 追跡可能: ${trackableCount}`);
    console.log(`  ❌ 追跡不可: ${warnings.length}`);
    console.log(`  📈 追跡可能率: ${((trackableCount / totalChecked) * 100).toFixed(1)}%`);
    console.log(`  📝 レポート: ${REPORT_PATH}`);
    
    return { warnings, totalChecked, trackableCount };
}

function generateTrackabilityReport(warnings, totalChecked, trackableCount) {
    const warningCount = warnings.length;
    const trackabilityPercent = ((trackableCount / totalChecked) * 100).toFixed(1);
    
    let markdown = `# Citation Trackability Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Evidence Files Checked | ${totalChecked} |
| Citation Trackable | ${trackableCount} (${trackabilityPercent}%) |
| Not Trackable | ${warningCount} |

## Trackability Rules

- **TRACKABLE**: DOI or PMID or ISBN or URL のいずれか1つ以上が存在
- **book/classic**: DOI/PMID が無くても ISBN/URL でOK
- **peer_reviewed**: DOI/PMID を優先、無ければ公式URL
- **systematic/meta**: DOI必須（例外なし）

## Warning Details

`;

    if (warningCount === 0) {
        markdown += `✅ All evidence files have citation trackability.\n`;
    } else {
        markdown += `❌ Found ${warningCount} evidence files without citation trackability:\n\n`;
        
        for (const warning of warnings) {
            markdown += `### ${warning.file}

**Basename:** ${warning.basename}  
**Source Type:** ${warning.sourceType}  
**Issue:** ${warning.issue}

---

`;
        }
    }
    
    markdown += `
## Recommended Actions

1. Review each warning above
2. Add appropriate citation information:
   - Academic papers: Add DOI or PMID
   - Books: Add ISBN or publisher URL
   - Web resources: Add official URL
3. Update evidence files and re-run this check

## Next Steps

\`\`\`bash
# After adding citations, re-run check
npm run lint:trackability

# Run full preflight check
npm run content:preflight
\`\`\`
`;

    return markdown;
}

// 実行
if (require.main === module) {
    lintCitationTrackability();
}

module.exports = { lintCitationTrackability };