#!/usr/bin/env node

/**
 * Claim Alignment Linter
 * Evidence claimとlesson contentの整合性をチェック
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';
const REPORT_PATH = 'docs/_reports/claim_alignment.md';

function lintClaimAlignment() {
    console.log('🔍 Claim Alignment チェック開始...');
    
    // レポートディレクトリ作成
    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const results = [];
    let totalChecked = 0;
    let alignmentWarnings = 0;
    
    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            continue;
        }
        
        const lessonFiles = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.ja.json'))
            .sort();
        
        console.log(`\n📁 Checking ${domain}: ${lessonFiles.length} lesson files`);
        
        for (const lessonFile of lessonFiles) {
            const lessonPath = path.join(domainDir, lessonFile);
            const basename = lessonFile.replace('.ja.json', '');
            const evidencePath = path.join(domainDir, `${basename}.evidence.json`);
            
            totalChecked++;
            
            try {
                // レッスンファイル読み込み
                const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
                
                // Evidenceファイル読み込み
                let evidenceData = null;
                let hasEvidence = false;
                if (fs.existsSync(evidencePath)) {
                    evidenceData = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
                    hasEvidence = true;
                }
                
                if (!hasEvidence) {
                    console.log(`  ⚠️  NO EVIDENCE: ${basename}`);
                    results.push({
                        domain,
                        basename,
                        hasEvidence: false,
                        alignmentIssues: ['No evidence file'],
                        hasAlignmentWarning: true
                    });
                    alignmentWarnings++;
                    continue;
                }
                
                // Alignment チェック
                const alignmentIssues = checkAlignment(lessonData, evidenceData, basename);
                const hasAlignmentWarning = alignmentIssues.length > 0;
                
                if (hasAlignmentWarning) {
                    alignmentWarnings++;
                    console.log(`  ⚠️  ALIGNMENT: ${basename} (${alignmentIssues.length} issues)`);
                } else {
                    console.log(`  ✅ OK: ${basename}`);
                }
                
                results.push({
                    domain,
                    basename,
                    hasEvidence: true,
                    alignmentIssues,
                    hasAlignmentWarning
                });
                
            } catch (error) {
                console.error(`  ❌ Error reading ${lessonPath}:`, error.message);
                results.push({
                    domain,
                    basename,
                    hasEvidence: false,
                    alignmentIssues: [`Error: ${error.message}`],
                    hasAlignmentWarning: true
                });
                alignmentWarnings++;
            }
        }
    }
    
    // レポート生成
    const reportContent = generateAlignmentReport(results, totalChecked, alignmentWarnings);
    fs.writeFileSync(REPORT_PATH, reportContent);
    
    console.log(`\n📊 Claim Alignment チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  ⚠️  整合性警告: ${alignmentWarnings}`);
    console.log(`  📝 レポート: ${REPORT_PATH}`);
    
    return { results, totalChecked, alignmentWarnings };
}

function checkAlignment(lessonData, evidenceData, basename) {
    const issues = [];
    
    // 基本的な整合性チェック
    const claim = evidenceData.claim || '';
    const sourceLabel = evidenceData.source_label || '';
    
    // レッスンのテキスト内容を抽出
    const lessonTexts = extractLessonTexts(lessonData);
    
    // 1. Claim が空でないかチェック
    if (!claim.trim()) {
        issues.push('Empty claim in evidence');
    }
    
    // 2. Source label が空でないかチェック
    if (!sourceLabel.trim()) {
        issues.push('Empty source_label in evidence');
    }
    
    // 3. Evidence grade と content の整合性チェック
    const evidenceGrade = evidenceData.evidence_grade || 'bronze';
    const hasStrongClaims = checkForStrongClaims(lessonTexts);
    
    if (evidenceGrade === 'bronze' && hasStrongClaims) {
        issues.push('Bronze evidence with strong claims in lesson content');
    }
    
    // 4. Citation の完全性チェック
    const citation = evidenceData.citation || {};
    const hasTrackableCitation = !!(
        (citation.doi && citation.doi.trim()) ||
        (citation.pmid && citation.pmid.trim()) ||
        (citation.isbn && citation.isbn.trim()) ||
        (citation.url && citation.url.trim())
    );
    
    if (!hasTrackableCitation) {
        issues.push('No trackable citation (DOI/PMID/ISBN/URL)');
    }
    
    // 5. Status と approval の整合性チェック
    const status = evidenceData.status || 'draft';
    const humanApproved = evidenceData.review?.human_approved;
    
    if (status === 'published' && !humanApproved) {
        issues.push('Published status but not human approved');
    }
    
    return issues;
}

function extractLessonTexts(lessonData) {
    const texts = [];
    
    // Questions からテキストを抽出
    if (lessonData.questions && Array.isArray(lessonData.questions)) {
        for (const question of lessonData.questions) {
            if (question.question) texts.push(question.question);
            if (question.explanation) texts.push(question.explanation);
            if (question.choices && Array.isArray(question.choices)) {
                for (const choice of question.choices) {
                    if (typeof choice === 'string') {
                        texts.push(choice);
                    } else if (choice.text) {
                        texts.push(choice.text);
                    }
                }
            }
        }
    }
    
    return texts;
}

function checkForStrongClaims(texts) {
    const strongClaimPatterns = [
        /必ず/,
        /絶対/,
        /確実に/,
        /間違いなく/,
        /証明された/,
        /治る/,
        /完全に/
    ];
    
    for (const text of texts) {
        for (const pattern of strongClaimPatterns) {
            if (pattern.test(text)) {
                return true;
            }
        }
    }
    
    return false;
}

function generateAlignmentReport(results, totalChecked, alignmentWarnings) {
    let markdown = `# Claim Alignment Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Lessons Checked | ${totalChecked} |
| Alignment Warnings | ${alignmentWarnings} |
| Alignment Success Rate | ${((totalChecked - alignmentWarnings) / totalChecked * 100).toFixed(1)}% |

## Alignment Rules

- **Evidence必須**: 全レッスンにevidence fileが必要
- **Claim完全性**: claim, source_labelが空でないこと
- **Grade整合性**: Bronze evidenceで強い断定表現を使わない
- **Citation追跡性**: DOI/PMID/ISBN/URLのいずれか必須
- **Status整合性**: published statusは human_approved=true が必要

## Detailed Results

| Domain | Basename | Evidence | Issues | Status |
|--------|----------|----------|--------|--------|
`;

    for (const result of results) {
        const status = result.hasAlignmentWarning ? '⚠️ WARNING' : '✅ OK';
        const evidenceStatus = result.hasEvidence ? 'Y' : 'N';
        const issuesText = result.alignmentIssues.length > 0 ? result.alignmentIssues.join('; ') : 'None';
        
        markdown += `| ${result.domain} | ${result.basename} | ${evidenceStatus} | ${issuesText} | ${status} |\n`;
    }
    
    markdown += `
## Alignment Issues Details

`;

    const warningResults = results.filter(r => r.hasAlignmentWarning);
    if (warningResults.length === 0) {
        markdown += `✅ No alignment issues found.\n`;
    } else {
        markdown += `⚠️ Found ${warningResults.length} lessons with alignment issues:\n\n`;
        
        for (const result of warningResults) {
            markdown += `### ${result.domain}/${result.basename}

**Issues:**
`;
            for (const issue of result.alignmentIssues) {
                markdown += `- ${issue}\n`;
            }
            markdown += `\n---\n\n`;
        }
    }
    
    markdown += `
## Recommended Actions

1. Review alignment issues above
2. Ensure all lessons have evidence files
3. Fill in empty claim/source_label fields
4. Add trackable citations (DOI/PMID/ISBN/URL)
5. Review evidence grades vs lesson content strength
6. Approve evidence files (human_approved=true)

## Next Steps

\`\`\`bash
# After fixing alignment issues, re-run check
npm run lint:claim-alignment

# Run full preflight check
npm run content:preflight
\`\`\`
`;

    return markdown;
}

// 実行
if (require.main === module) {
    lintClaimAlignment();
}

module.exports = { lintClaimAlignment };