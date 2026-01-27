#!/usr/bin/env node

/**
 * Verification Staleness Check (D-pack D1)
 * Evidence Card の last_verified 期限切れを検出
 */

const fs = require('fs');
const path = require('path');

function lintVerificationStaleness() {
    console.log('🔍 Verification Staleness チェック開始...');
    
    const warnings = [];
    const failures = [];
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
    const today = new Date();
    
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
                
                if (!evidence.last_verified) {
                    warnings.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        issue: 'missing_last_verified',
                        message: 'last_verified フィールドが存在しません'
                    });
                    console.log(`  ⚠️  WARNING: ${basename} (last_verified missing)`);
                    continue;
                }
                
                const lastVerified = new Date(evidence.last_verified);
                const daysSince = Math.floor((today - lastVerified) / (1000 * 60 * 60 * 24));
                
                if (daysSince > 730) {
                    // 730日超：FAIL（または強いWARNING）
                    failures.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        issue: 'verification_expired',
                        daysSince,
                        lastVerified: evidence.last_verified,
                        message: `${daysSince}日前に検証済み（730日超過）- 要再検証`
                    });
                    console.log(`  🚨 FAIL: ${basename} (${daysSince}日前検証 - 730日超過)`);
                } else if (daysSince > 365) {
                    // 365日超：WARNING
                    warnings.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        issue: 'verification_stale',
                        daysSince,
                        lastVerified: evidence.last_verified,
                        message: `${daysSince}日前に検証済み（365日超過）- 再検証推奨`
                    });
                    console.log(`  ⚠️  WARNING: ${basename} (${daysSince}日前検証 - 365日超過)`);
                } else {
                    console.log(`  ✅ OK: ${basename} (${daysSince}日前検証)`);
                }
                
            } catch (error) {
                console.error(`  ❌ ERROR: ${basename} - ${error.message}`);
                warnings.push({
                    file: basename,
                    domain: domain.replace('_units', ''),
                    issue: 'parse_error',
                    message: `JSON解析エラー: ${error.message}`
                });
            }
        }
    }
    
    // レポート生成
    const reportPath = path.join(reportsDir, 'verification_staleness.md');
    let report = `# Verification Staleness Report\n\n`;
    report += `Generated: ${today.toISOString().split('T')[0]}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- Total Checked: ${totalChecked}\n`;
    report += `- Warnings (365+ days): ${warnings.filter(w => w.issue === 'verification_stale').length}\n`;
    report += `- Failures (730+ days): ${failures.length}\n`;
    report += `- Missing last_verified: ${warnings.filter(w => w.issue === 'missing_last_verified').length}\n`;
    report += `- Parse Errors: ${warnings.filter(w => w.issue === 'parse_error').length}\n\n`;
    
    if (failures.length > 0) {
        report += `## 🚨 Failures (730+ days - 要再検証)\n\n`;
        for (const failure of failures) {
            report += `- **${failure.file}** (${failure.domain}): ${failure.message}\n`;
        }
        report += `\n`;
    }
    
    if (warnings.filter(w => w.issue === 'verification_stale').length > 0) {
        report += `## ⚠️ Warnings (365+ days - 再検証推奨)\n\n`;
        for (const warning of warnings.filter(w => w.issue === 'verification_stale')) {
            report += `- **${warning.file}** (${warning.domain}): ${warning.message}\n`;
        }
        report += `\n`;
    }
    
    if (warnings.filter(w => w.issue === 'missing_last_verified').length > 0) {
        report += `## ⚠️ Missing last_verified\n\n`;
        for (const warning of warnings.filter(w => w.issue === 'missing_last_verified')) {
            report += `- **${warning.file}** (${warning.domain}): ${warning.message}\n`;
        }
        report += `\n`;
    }
    
    if (warnings.filter(w => w.issue === 'parse_error').length > 0) {
        report += `## ❌ Parse Errors\n\n`;
        for (const warning of warnings.filter(w => w.issue === 'parse_error')) {
            report += `- **${warning.file}** (${warning.domain}): ${warning.message}\n`;
        }
        report += `\n`;
    }
    
    report += `## Next Steps\n\n`;
    report += `1. Review evidence files with 730+ days since verification\n`;
    report += `2. Update last_verified dates after re-verification\n`;
    report += `3. Consider updating evidence content if source has been superseded\n`;
    report += `4. Add last_verified field to files missing it\n`;
    
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📊 Verification Staleness チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  ⚠️  警告 (365+日): ${warnings.filter(w => w.issue === 'verification_stale').length}`);
    console.log(`  🚨 失格 (730+日): ${failures.length}`);
    console.log(`  📝 レポート: ${reportPath}`);
    
    return {
        totalChecked,
        warnings: warnings.filter(w => w.issue === 'verification_stale'),
        failures,
        missingFields: warnings.filter(w => w.issue === 'missing_last_verified'),
        parseErrors: warnings.filter(w => w.issue === 'parse_error')
    };
}

// 実行
if (require.main === module) {
    lintVerificationStaleness();
}

module.exports = { lintVerificationStaleness };