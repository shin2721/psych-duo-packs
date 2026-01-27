#!/usr/bin/env node

/**
 * Citation Format Check (D-pack D2)
 * DOI/PMID/ISBN の形式と空欄チェック
 */

const fs = require('fs');
const path = require('path');

function lintCitationFormat() {
    console.log('🔍 Citation Format チェック開始...');
    
    const warnings = [];
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
    
    // 形式チェック関数
    function validateDOI(doi) {
        if (!doi || doi.trim() === '') return { valid: true, message: 'empty' };
        // DOIは10.で始まる形式
        if (!doi.match(/^10\.\d+\/.+/)) {
            return { valid: false, message: 'DOI形式が不正（10.xxxx/yyyy形式である必要があります）' };
        }
        return { valid: true, message: 'valid' };
    }
    
    function validatePMID(pmid) {
        if (!pmid || pmid.trim() === '') return { valid: true, message: 'empty' };
        // PMIDは数値のみ
        if (!pmid.match(/^\d+$/)) {
            return { valid: false, message: 'PMID形式が不正（数値のみである必要があります）' };
        }
        return { valid: true, message: 'valid' };
    }
    
    function validateISBN(isbn) {
        if (!isbn || isbn.trim() === '') return { valid: true, message: 'empty' };
        // ISBN-10またはISBN-13形式（ハイフンありなし両対応）
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        if (!cleanISBN.match(/^(978|979)?\d{9}[\dX]$/)) {
            return { valid: false, message: 'ISBN形式が不正（ISBN-10またはISBN-13形式である必要があります）' };
        }
        return { valid: true, message: 'valid' };
    }
    
    function validateURL(url) {
        if (!url || url.trim() === '') return { valid: true, message: 'empty' };
        // 基本的なURL形式チェック
        if (!url.match(/^https?:\/\/.+/)) {
            return { valid: false, message: 'URL形式が不正（http://またはhttps://で始まる必要があります）' };
        }
        return { valid: true, message: 'valid' };
    }
    
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
                
                if (!evidence.citation) {
                    warnings.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        issue: 'missing_citation',
                        message: 'citation フィールドが存在しません'
                    });
                    console.log(`  ⚠️  WARNING: ${basename} (citation missing)`);
                    continue;
                }
                
                const citation = evidence.citation;
                let hasValidCitation = false;
                const issues = [];
                
                // DOI チェック
                if (citation.doi) {
                    const doiCheck = validateDOI(citation.doi);
                    if (!doiCheck.valid) {
                        issues.push(`DOI: ${doiCheck.message}`);
                    } else if (doiCheck.message === 'valid') {
                        hasValidCitation = true;
                    }
                }
                
                // PMID チェック
                if (citation.pmid) {
                    const pmidCheck = validatePMID(citation.pmid);
                    if (!pmidCheck.valid) {
                        issues.push(`PMID: ${pmidCheck.message}`);
                    } else if (pmidCheck.message === 'valid') {
                        hasValidCitation = true;
                    }
                }
                
                // ISBN チェック
                if (citation.isbn) {
                    const isbnCheck = validateISBN(citation.isbn);
                    if (!isbnCheck.valid) {
                        issues.push(`ISBN: ${isbnCheck.message}`);
                    } else if (isbnCheck.message === 'valid') {
                        hasValidCitation = true;
                    }
                }
                
                // URL チェック
                if (citation.url) {
                    const urlCheck = validateURL(citation.url);
                    if (!urlCheck.valid) {
                        issues.push(`URL: ${urlCheck.message}`);
                    } else if (urlCheck.message === 'valid') {
                        hasValidCitation = true;
                    }
                }
                
                // 全て空欄チェック
                const allEmpty = (!citation.doi || citation.doi.trim() === '') &&
                               (!citation.pmid || citation.pmid.trim() === '') &&
                               (!citation.isbn || citation.isbn.trim() === '') &&
                               (!citation.url || citation.url.trim() === '');
                
                if (allEmpty) {
                    warnings.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        issue: 'all_citations_empty',
                        message: '全ての引用情報（DOI/PMID/ISBN/URL）が空です'
                    });
                    console.log(`  ⚠️  WARNING: ${basename} (all citations empty)`);
                } else if (issues.length > 0) {
                    warnings.push({
                        file: basename,
                        domain: domain.replace('_units', ''),
                        issue: 'format_error',
                        message: issues.join(', ')
                    });
                    console.log(`  ⚠️  WARNING: ${basename} (format issues: ${issues.join(', ')})`);
                } else {
                    console.log(`  ✅ OK: ${basename}`);
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
    const reportPath = path.join(reportsDir, 'citation_format.md');
    let report = `# Citation Format Report\n\n`;
    report += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- Total Checked: ${totalChecked}\n`;
    report += `- Format Errors: ${warnings.filter(w => w.issue === 'format_error').length}\n`;
    report += `- All Citations Empty: ${warnings.filter(w => w.issue === 'all_citations_empty').length}\n`;
    report += `- Missing Citation Field: ${warnings.filter(w => w.issue === 'missing_citation').length}\n`;
    report += `- Parse Errors: ${warnings.filter(w => w.issue === 'parse_error').length}\n\n`;
    
    if (warnings.filter(w => w.issue === 'format_error').length > 0) {
        report += `## ⚠️ Format Errors\n\n`;
        for (const warning of warnings.filter(w => w.issue === 'format_error')) {
            report += `- **${warning.file}** (${warning.domain}): ${warning.message}\n`;
        }
        report += `\n`;
    }
    
    if (warnings.filter(w => w.issue === 'all_citations_empty').length > 0) {
        report += `## ⚠️ All Citations Empty\n\n`;
        for (const warning of warnings.filter(w => w.issue === 'all_citations_empty')) {
            report += `- **${warning.file}** (${warning.domain}): ${warning.message}\n`;
        }
        report += `\n`;
    }
    
    if (warnings.filter(w => w.issue === 'missing_citation').length > 0) {
        report += `## ⚠️ Missing Citation Field\n\n`;
        for (const warning of warnings.filter(w => w.issue === 'missing_citation')) {
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
    
    report += `## Format Requirements\n\n`;
    report += `- **DOI**: Must start with "10." (e.g., 10.1037/0003-066X.39.2.124)\n`;
    report += `- **PMID**: Must be numeric only (e.g., 17201571)\n`;
    report += `- **ISBN**: Must be valid ISBN-10 or ISBN-13 format\n`;
    report += `- **URL**: Must start with http:// or https://\n\n`;
    
    report += `## Next Steps\n\n`;
    report += `1. Fix format errors in citation fields\n`;
    report += `2. Add at least one valid citation (DOI/PMID/ISBN/URL) to each evidence file\n`;
    report += `3. Verify that citations are accessible and correct\n`;
    
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📊 Citation Format チェック完了:`);
    console.log(`  📄 総チェック: ${totalChecked}`);
    console.log(`  ⚠️  形式エラー: ${warnings.filter(w => w.issue === 'format_error').length}`);
    console.log(`  ⚠️  全引用空欄: ${warnings.filter(w => w.issue === 'all_citations_empty').length}`);
    console.log(`  📝 レポート: ${reportPath}`);
    
    return {
        totalChecked,
        formatErrors: warnings.filter(w => w.issue === 'format_error'),
        allEmpty: warnings.filter(w => w.issue === 'all_citations_empty'),
        missingCitation: warnings.filter(w => w.issue === 'missing_citation'),
        parseErrors: warnings.filter(w => w.issue === 'parse_error')
    };
}

// 実行
if (require.main === module) {
    lintCitationFormat();
}

module.exports = { lintCitationFormat };