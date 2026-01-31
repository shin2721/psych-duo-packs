#!/usr/bin/env node

/**
 * Bronze Assertion Linter
 * Bronze evidence_gradeのレッスンで断定表現をチェック
 */

const fs = require('fs');
const path = require('path');

const LESSONS_ROOT = 'data/lessons';
const REPORT_PATH = 'docs/_reports/bronze_assertion_warnings.md';

// 断定表現パターン（部分一致）
const ASSERTION_PATTERNS = [
    /絶対/g,
    /必ず/g,
    /確実/g,
    /治る/g,
    /証明された/g,
    /100%/g,
    /間違いない/g,
    /〜するだけで/g,
    /だけで/g
];

// 偽陽性除外パターン（否定・限定・反証の文脈）
const FALSE_POSITIVE_PATTERNS = [
    /だけでなく/g,      // 「だけでなく」は否定形
    /だけでは/g,        // 「だけでは」は限定形
    /だけではない/g,    // 「だけではない」は否定形
    /絶対.*ではない/g,  // 「絶対〜ではない」は否定形
    /必ずしも.*ない/g   // 「必ずしも〜ない」は否定形
];

function lintBronzeAssertions() {
    console.log('🔍 Bronze断定表現チェック開始...');
    
    // レポートディレクトリ作成
    const reportDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const warnings = [];
    let totalChecked = 0;
    let bronzeCount = 0;
    
    for (const domain of domains) {
        const domainDir = path.join(LESSONS_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            continue;
        }
        
        const lessonFiles = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.ja.json') && f.includes('_l'))
            .sort();
        
        console.log(`\n📁 Checking ${domain}: ${lessonFiles.length} lessons`);
        
        for (const lessonFile of lessonFiles) {
            const basename = lessonFile.replace('.ja.json', '');
            const lessonPath = path.join(domainDir, lessonFile);
            const evidencePath = path.join(domainDir, `${basename}.evidence.json`);
            
            totalChecked++;
            
            // Evidence gradeをチェック
            let evidenceGrade = 'unknown';
            if (fs.existsSync(evidencePath)) {
                try {
                    const evidenceData = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
                    evidenceGrade = evidenceData.evidence_grade || 'unknown';
                } catch (error) {
                    console.error(`  ❌ Error reading evidence ${evidencePath}:`, error.message);
                    continue;
                }
            }
            
            // Bronzeのみチェック
            if (evidenceGrade !== 'bronze') {
                console.log(`  ⏭️  Skipped: ${basename} (${evidenceGrade})`);
                continue;
            }
            
            bronzeCount++;
            console.log(`  🔍 Checking: ${basename} (bronze)`);
            
            // レッスンファイルをチェック
            try {
                const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
                
                if (Array.isArray(lessonData)) {
                    for (let i = 0; i < lessonData.length; i++) {
                        const question = lessonData[i];
                        checkQuestionForAssertions(question, lessonPath, i + 1, warnings);
                    }
                }
            } catch (error) {
                console.error(`  ❌ Error reading lesson ${lessonPath}:`, error.message);
            }
        }
    }
    
    // レポート生成
    const reportContent = generateWarningReport(warnings, totalChecked, bronzeCount);
    fs.writeFileSync(REPORT_PATH, reportContent);
    
    console.log(`\n📊 Bronze断定表現チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  🥉 Bronze対象: ${bronzeCount}`);
    console.log(`  ⚠️  警告: ${warnings.length}`);
    console.log(`  📝 レポート: ${REPORT_PATH}`);
    
    return warnings;
}

function checkQuestionForAssertions(question, filePath, questionIndex, warnings) {
    const fieldsToCheck = ['question', 'explanation', 'actionable_advice'];
    
    for (const field of fieldsToCheck) {
        if (!question[field]) continue;
        
        const text = question[field];
        
        // 偽陽性チェック（先に実行）
        let hasFalsePositive = false;
        for (const falsePattern of FALSE_POSITIVE_PATTERNS) {
            if (text.match(falsePattern)) {
                hasFalsePositive = true;
                break;
            }
        }
        
        // 偽陽性が見つかった場合はスキップ
        if (hasFalsePositive) continue;
        
        for (const pattern of ASSERTION_PATTERNS) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    warnings.push({
                        file: path.relative('.', filePath),
                        questionIndex,
                        questionId: question.id || `q${questionIndex}`,
                        field,
                        assertion: match,
                        context: getContext(text, match),
                        fullText: text
                    });
                }
            }
        }
    }
}

function getContext(text, match) {
    const index = text.indexOf(match);
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + match.length + 20);
    return text.substring(start, end);
}

function generateWarningReport(warnings, totalChecked, bronzeCount) {
    const warningCount = warnings.length;
    
    let markdown = `# Bronze Assertion Warnings Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Lessons Checked | ${totalChecked} |
| Bronze Lessons | ${bronzeCount} |
| Assertion Warnings | ${warningCount} |

## Warning Details

`;

    if (warningCount === 0) {
        markdown += `✅ No assertion warnings found in bronze lessons.\n`;
    } else {
        markdown += `⚠️ Found ${warningCount} assertion warnings that should be reviewed:\n\n`;
        
        for (const warning of warnings) {
            markdown += `### ${warning.file} - Question ${warning.questionIndex} (${warning.questionId})

**Field:** \`${warning.field}\`  
**Assertion:** \`${warning.assertion}\`  
**Context:** ...${warning.context}...

\`\`\`
${warning.fullText}
\`\`\`

---

`;
        }
    }
    
    markdown += `
## Recommended Actions

1. Review each warning above
2. Replace assertions with probability/tendency language:
   - "絶対" → "多くの場合"
   - "必ず" → "しばしば"
   - "確実に" → "可能性が高い"
   - "治る" → "改善する可能性がある"
   - "証明された" → "示唆されている"

3. Update lesson files and re-run this check
4. Consider upgrading evidence grade if stronger evidence is available

## Next Steps

\`\`\`bash
# After fixing assertions, re-run check
npm run lint:bronze-assertions

# Validate all lessons
npm run validate:lessons
\`\`\`
`;

    return markdown;
}

// 実行
if (require.main === module) {
    lintBronzeAssertions();
}

module.exports = { lintBronzeAssertions };