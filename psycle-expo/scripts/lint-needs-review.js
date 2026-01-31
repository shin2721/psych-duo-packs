#!/usr/bin/env node

/**
 * Needs Review Check (D-pack D3)
 * status: needs_review の検出と管理
 */

const fs = require('fs');
const path = require('path');

function lintNeedsReview() {
    console.log('🔍 Needs Review チェック開始...');
    
    const needsReview = [];
    const statusCounts = {
        active: 0,
        draft: 0,
        needs_review: 0,
        deprecated: 0,
        missing: 0
    };
    const reportsDir = 'docs/_reports';
    
    // レポートディレクトリ作成
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const unitsDir = 'data/lessons';
    const domains = fs.readdirSync(unitsDir).filter(dir => 
        dir.endsWith('_units') && 
        fs.statSync(path.join(unitsDir, dir)).isDirectory()
    );
    
    let totalChecked = 0;
    
    for (const domain of domains) {
        const domainPath = path.join(unitsDir, domain);
        const evidenceFiles = fs.readdirSync(domainPath).filter(file => 
            file.endsWith('.evidence.json')
        );
        
        console.log(`\n📁 Checking ${domain.replace('_units', '')}: ${evidenceFiles.length} evidence files`);
        
        for (const file of evidenceFiles) {
            const filePath = path.join(domainPath, file);
            const basename = file.replace('.evidence.json', '');
            
            try {
                const evidence = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                totalChecked++;
                
                const status = evidence.status || 'missing';
                
                if (status === 'missing') {
                    statusCounts.missing++;
                    console.log(`  ⚠️  WARNING: ${basename} (status missing)`);
                } else if (status === 'needs_review') {
                    statusCounts.needs_review++;
                    needsReview.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        lastVerified: evidence.last_verified || 'unknown',
                        reviewer: evidence.review?.reviewer || 'unknown',
                        reason: evidence.review_reason || 'not specified'
                    });
                    console.log(`  🔍 NEEDS REVIEW: ${basename} (要再監査)`);
                } else {
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                    console.log(`  ✅ OK: ${basename} (${status})`);
                }
                
            } catch (error) {
                console.error(`  ❌ ERROR: ${basename} - ${error.message}`);
                totalChecked++;
            }
        }
    }
    
    // レポート生成
    const reportPath = path.join(reportsDir, 'needs_review.md');
    let report = `# Needs Review Report\n\n`;
    report += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- Total Checked: ${totalChecked}\n`;
    report += `- Active: ${statusCounts.active}\n`;
    report += `- Draft: ${statusCounts.draft}\n`;
    report += `- **Needs Review: ${statusCounts.needs_review}**\n`;
    report += `- Deprecated: ${statusCounts.deprecated}\n`;
    report += `- Missing Status: ${statusCounts.missing}\n\n`;
    
    if (needsReview.length > 0) {
        report += `## 🔍 Evidence Files Requiring Review\n\n`;
        report += `| File | Domain | Last Verified | Reviewer | Reason |\n`;
        report += `|------|--------|---------------|----------|--------|\n`;
        for (const item of needsReview) {
            report += `| ${item.file} | ${item.domain} | ${item.lastVerified} | ${item.reviewer} | ${item.reason} |\n`;
        }
        report += `\n`;
    }
    
    if (statusCounts.missing > 0) {
        report += `## ⚠️ Missing Status Field\n\n`;
        report += `${statusCounts.missing} evidence files are missing the status field. Please add one of:\n`;
        report += `- \`"status": "active"\` - Currently valid and in use\n`;
        report += `- \`"status": "draft"\` - Work in progress, not yet approved\n`;
        report += `- \`"status": "needs_review"\` - Requires human review/update\n`;
        report += `- \`"status": "deprecated"\` - No longer valid, should not be used\n\n`;
    }
    
    report += `## Status Definitions\n\n`;
    report += `- **active**: Evidence is current and approved for use\n`;
    report += `- **draft**: Evidence is being developed, not yet ready for production\n`;
    report += `- **needs_review**: Evidence requires human review (e.g., source updated, conflicting research found)\n`;
    report += `- **deprecated**: Evidence is outdated or superseded, should not be used\n\n`;
    
    report += `## Next Steps\n\n`;
    report += `1. Review all evidence files with "needs_review" status\n`;
    report += `2. Update evidence content if necessary\n`;
    report += `3. Change status to "active" after review completion\n`;
    report += `4. Add status field to files missing it\n`;
    report += `5. Consider adding review_reason field to explain why review is needed\n`;
    
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📊 Needs Review チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  🔍 要再監査: ${statusCounts.needs_review}`);
    console.log(`  ⚠️  status未設定: ${statusCounts.missing}`);
    console.log(`  📝 レポート: ${reportPath}`);
    
    return {
        totalChecked,
        needsReview,
        statusCounts
    };
}

// 実行
if (require.main === module) {
    lintNeedsReview();
}

module.exports = { lintNeedsReview };