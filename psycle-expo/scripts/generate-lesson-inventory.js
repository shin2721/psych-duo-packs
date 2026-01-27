#!/usr/bin/env node

/**
 * Lesson Inventory Report Generator
 * 既存レッスンの棚卸しレポートを生成
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';
const REPORT_PATH = 'docs/_reports/lesson_inventory.md';

function generateInventoryReport() {
    console.log('📋 レッスン棚卸しレポート生成開始...');
    
    // レポートディレクトリ作成
    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const inventory = [];
    let totalLessons = 0;
    let totalWithEvidence = 0;
    
    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            continue;
        }
        
        const files = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.ja.json') && f.includes('_l'))
            .sort();
        
        for (const file of files) {
            const basename = file.replace('.ja.json', '');
            const lessonPath = path.join(domainDir, file);
            const evidencePath = path.join(domainDir, `${basename}.evidence.json`);
            
            // レッスンファイル読み込み
            let questionCount = 0;
            try {
                const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
                questionCount = Array.isArray(lessonData) ? lessonData.length : 0;
            } catch (error) {
                console.error(`❌ Error reading ${lessonPath}:`, error.message);
            }
            
            // Evidence有無とDOI/PMID/ISBN/URL/human_approved有無をチェック
            const hasEvidence = fs.existsSync(evidencePath);
            let hasDoi = false;
            let hasPmid = false;
            let hasIsbn = false;
            let hasUrl = false;
            let humanApproved = 'none';
            
            if (hasEvidence) {
                try {
                    const evidenceData = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
                    const citation = evidenceData.citation || {};
                    hasDoi = !!(citation.doi && citation.doi.trim());
                    hasPmid = !!(citation.pmid && citation.pmid.trim());
                    hasIsbn = !!(citation.isbn && citation.isbn.trim());
                    hasUrl = !!(citation.url && citation.url.trim());
                    
                    const review = evidenceData.review || {};
                    humanApproved = review.human_approved === true ? 'true' : 
                                   review.human_approved === false ? 'false' : 'none';
                } catch (error) {
                    console.error(`❌ Error reading evidence ${evidencePath}:`, error.message);
                }
            }
            
            inventory.push({
                domain,
                basename,
                questionCount,
                hasEvidence,
                hasDoi,
                hasPmid,
                hasIsbn,
                hasUrl,
                humanApproved,
                lessonPath: path.relative('.', lessonPath),
                evidencePath: path.relative('.', evidencePath)
            });
            
            totalLessons++;
            if (hasEvidence) totalWithEvidence++;
        }
    }
    
    // レポート生成
    const reportContent = generateReportMarkdown(inventory, totalLessons, totalWithEvidence);
    fs.writeFileSync(REPORT_PATH, reportContent);
    
    console.log(`✅ レポート生成完了: ${REPORT_PATH}`);
    console.log(`📊 総レッスン数: ${totalLessons}`);
    console.log(`📄 Evidence有り: ${totalWithEvidence}`);
    console.log(`❌ Evidence無し: ${totalLessons - totalWithEvidence}`);
    console.log(`📈 Evidence網羅率: ${((totalWithEvidence / totalLessons) * 100).toFixed(1)}%`);
    
    return inventory;
}

function generateReportMarkdown(inventory, totalLessons, totalWithEvidence) {
    const coveragePercent = ((totalWithEvidence / totalLessons) * 100).toFixed(1);
    const withDoi = inventory.filter(item => item.hasDoi).length;
    const withPmid = inventory.filter(item => item.hasPmid).length;
    const withIsbn = inventory.filter(item => item.hasIsbn).length;
    const withUrl = inventory.filter(item => item.hasUrl).length;
    const withCitation = inventory.filter(item => item.hasDoi || item.hasPmid || item.hasIsbn || item.hasUrl).length;
    const unapproved = inventory.filter(item => item.humanApproved === 'false').length;
    
    let markdown = `# Lesson Inventory Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Lessons | ${totalLessons} |
| With Evidence | ${totalWithEvidence} |
| Without Evidence | ${totalLessons - totalWithEvidence} |
| Evidence Coverage | ${coveragePercent}% |
| DOI Available | ${withDoi} (${((withDoi / totalLessons) * 100).toFixed(1)}%) |
| PMID Available | ${withPmid} (${((withPmid / totalLessons) * 100).toFixed(1)}%) |
| ISBN Available | ${withIsbn} (${((withIsbn / totalLessons) * 100).toFixed(1)}%) |
| URL Available | ${withUrl} (${((withUrl / totalLessons) * 100).toFixed(1)}%) |
| Citation Trackable | ${withCitation} (${((withCitation / totalLessons) * 100).toFixed(1)}%) |
| Unapproved Evidence | ${unapproved} (${((unapproved / totalLessons) * 100).toFixed(1)}%) |

## Detailed Inventory

| Domain | Basename | Questions | Evidence | DOI | PMID | ISBN | URL | Human Approved | Status |
|--------|----------|-----------|----------|-----|------|------|-----|----------------|--------|
`;

    for (const item of inventory) {
        const status = item.hasEvidence ? '✅' : '❌';
        const doiStatus = item.hasDoi ? 'Y' : 'N';
        const pmidStatus = item.hasPmid ? 'Y' : 'N';
        const isbnStatus = item.hasIsbn ? 'Y' : 'N';
        const urlStatus = item.hasUrl ? 'Y' : 'N';
        markdown += `| ${item.domain} | ${item.basename} | ${item.questionCount} | ${item.hasEvidence ? 'Y' : 'N'} | ${doiStatus} | ${pmidStatus} | ${isbnStatus} | ${urlStatus} | ${item.humanApproved} | ${status} |\n`;
    }
    
    markdown += `
## Missing Evidence Files

`;

    const missing = inventory.filter(item => !item.hasEvidence);
    if (missing.length === 0) {
        markdown += `✅ All lessons have evidence files.\n`;
    } else {
        for (const item of missing) {
            markdown += `- \`${item.evidencePath}\`\n`;
        }
    }
    
    markdown += `
## Citation Status

`;

    const withoutCitation = inventory.filter(item => item.hasEvidence && !item.hasDoi && !item.hasPmid && !item.hasIsbn && !item.hasUrl);
    if (withoutCitation.length === 0) {
        markdown += `✅ All evidence files have citation trackability (DOI/PMID/ISBN/URL).\n`;
    } else {
        markdown += `❌ Evidence files missing citation trackability:\n`;
        for (const item of withoutCitation) {
            markdown += `- \`${item.evidencePath}\`\n`;
        }
    }
    
    markdown += `
## Approval Status

`;

    const unapprovedList = inventory.filter(item => item.humanApproved === 'false');
    if (unapprovedList.length === 0) {
        markdown += `✅ All evidence files are approved.\n`;
    } else {
        markdown += `⚠️ Unapproved evidence files:\n`;
        for (const item of unapprovedList) {
            markdown += `- \`${item.evidencePath}\`\n`;
        }
    }
    
    markdown += `
## Next Steps

1. Run \`npm run generate:evidence-scaffold\` to create missing evidence files
2. Review and update evidence content with Antigravity
3. Add citation trackability (DOI/PMID/ISBN/URL) to evidence files
4. Approve evidence files (set human_approved=true)
5. Run \`npm run lint:bronze-assertions\` to check for assertion issues
`;

    return markdown;
}

// 実行
if (require.main === module) {
    generateInventoryReport();
}

module.exports = { generateInventoryReport };