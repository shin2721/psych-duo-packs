/**
 * Base Linter Infrastructure
 * 共通のリンター基盤とレポート生成
 */

const fs = require('fs');
const path = require('path');

/**
 * 基本リンター結果構造
 */
class LintResult {
    constructor(file, domain, severity, issue, message, recommendations = [], metadata = {}) {
        this.file = file;
        this.domain = domain;
        this.severity = severity; // 'WARNING' | 'FAIL'
        this.issue = issue;
        this.message = message;
        this.recommendations = recommendations;
        this.metadata = metadata;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * 基本リンタークラス
 */
class BaseLinter {
    constructor(name, reportPath) {
        this.name = name;
        this.reportPath = reportPath;
        this.results = [];
    }

    /**
     * 警告を追加
     */
    addWarning(file, domain, issue, message, recommendations = [], metadata = {}) {
        const result = new LintResult(file, domain, 'WARNING', issue, message, recommendations, metadata);
        this.results.push(result);
        return result;
    }

    /**
     * エラーを追加（FAIL）
     */
    addError(file, domain, issue, message, recommendations = [], metadata = {}) {
        const result = new LintResult(file, domain, 'FAIL', issue, message, recommendations, metadata);
        this.results.push(result);
        return result;
    }

    /**
     * 結果をクリア
     */
    clearResults() {
        this.results = [];
    }

    /**
     * 警告数を取得
     */
    getWarningCount() {
        return this.results.filter(r => r.severity === 'WARNING').length;
    }

    /**
     * エラー数を取得
     */
    getErrorCount() {
        return this.results.filter(r => r.severity === 'FAIL').length;
    }

    /**
     * ドメイン別統計を取得
     */
    getStatsByDomain() {
        const stats = {};
        
        for (const result of this.results) {
            if (!stats[result.domain]) {
                stats[result.domain] = { warnings: 0, errors: 0 };
            }
            
            if (result.severity === 'WARNING') {
                stats[result.domain].warnings++;
            } else if (result.severity === 'FAIL') {
                stats[result.domain].errors++;
            }
        }
        
        return stats;
    }

    /**
     * Markdownレポートを生成
     */
    generateReport(additionalSections = {}) {
        const reportDir = path.dirname(this.reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const warningCount = this.getWarningCount();
        const errorCount = this.getErrorCount();
        const totalIssues = warningCount + errorCount;
        const stats = this.getStatsByDomain();

        let markdown = `# ${this.name} Report

> Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Value |
|--------|-------|
| Total Issues | ${totalIssues} |
| Warnings | ${warningCount} |
| Errors | ${errorCount} |

`;

        // ドメイン別統計
        if (Object.keys(stats).length > 0) {
            markdown += `## Issues by Domain

| Domain | Warnings | Errors | Total |
|--------|----------|--------|-------|
`;
            for (const [domain, domainStats] of Object.entries(stats)) {
                const total = domainStats.warnings + domainStats.errors;
                markdown += `| ${domain} | ${domainStats.warnings} | ${domainStats.errors} | ${total} |\n`;
            }
            markdown += '\n';
        }

        // 追加セクション
        for (const [sectionTitle, sectionContent] of Object.entries(additionalSections)) {
            markdown += `## ${sectionTitle}\n\n${sectionContent}\n\n`;
        }

        // 詳細結果
        markdown += `## Issue Details\n\n`;

        if (totalIssues === 0) {
            markdown += `✅ No issues found.\n`;
        } else {
            // エラーを先に表示
            const errors = this.results.filter(r => r.severity === 'FAIL');
            const warnings = this.results.filter(r => r.severity === 'WARNING');

            if (errors.length > 0) {
                markdown += `### ❌ Errors (${errors.length})\n\n`;
                for (const error of errors) {
                    markdown += this.formatIssue(error);
                }
            }

            if (warnings.length > 0) {
                markdown += `### ⚠️ Warnings (${warnings.length})\n\n`;
                for (const warning of warnings) {
                    markdown += this.formatIssue(warning);
                }
            }
        }

        // 推奨アクション
        markdown += this.generateRecommendedActions();

        fs.writeFileSync(this.reportPath, markdown);
        console.log(`  📝 レポート生成: ${this.reportPath}`);
        
        return markdown;
    }

    /**
     * 個別問題をフォーマット
     */
    formatIssue(result) {
        let markdown = `#### ${result.file}\n\n`;
        markdown += `**Domain:** ${result.domain}  \n`;
        markdown += `**Issue:** ${result.issue}  \n`;
        markdown += `**Message:** ${result.message}  \n`;

        if (result.recommendations.length > 0) {
            markdown += `**Recommendations:**\n`;
            for (const rec of result.recommendations) {
                markdown += `- ${rec}\n`;
            }
        }

        if (Object.keys(result.metadata).length > 0) {
            markdown += `**Details:**\n`;
            for (const [key, value] of Object.entries(result.metadata)) {
                markdown += `- ${key}: ${value}\n`;
            }
        }

        markdown += `\n---\n\n`;
        return markdown;
    }

    /**
     * 推奨アクションセクションを生成（サブクラスでオーバーライド）
     */
    generateRecommendedActions() {
        return `## Recommended Actions

1. Review each issue above
2. Apply the recommended fixes
3. Re-run this linter to verify fixes
4. Run full content preflight check

## Next Steps

\`\`\`bash
# Re-run this specific linter
node ${path.relative('.', __filename)}

# Run full preflight check
npm run content:preflight
\`\`\`
`;
    }

    /**
     * コンソール出力
     */
    printSummary() {
        const warningCount = this.getWarningCount();
        const errorCount = this.getErrorCount();
        const stats = this.getStatsByDomain();

        console.log(`\n📊 ${this.name} 完了:`);
        console.log(`  ⚠️  警告: ${warningCount}`);
        console.log(`  ❌ エラー: ${errorCount}`);
        
        if (Object.keys(stats).length > 0) {
            console.log(`  📁 ドメイン別:`);
            for (const [domain, domainStats] of Object.entries(stats)) {
                const total = domainStats.warnings + domainStats.errors;
                if (total > 0) {
                    console.log(`    ${domain}: ${domainStats.warnings}W + ${domainStats.errors}E = ${total}`);
                }
            }
        }
        
        console.log(`  📝 レポート: ${this.reportPath}`);
    }
}

/**
 * 設定管理
 */
class LinterConfig {
    constructor(configPath = null) {
        this.config = this.loadConfig(configPath);
    }

    loadConfig(configPath) {
        const defaultConfig = {
            citation_linter: {
                min_citations: 2,
                warning_level: 'WARNING',
                preferred_diversity: true,
                valid_fields: ['doi', 'pmid', 'isbn', 'url']
            },
            book_source_linter: {
                warning_level: 'WARNING',
                check_primary_position: true,
                gold_inflation_integration: true
            },
            safety_display_linter: {
                warning_level: 'WARNING',
                bronze_language_check: true,
                required_phrases: ['可能性がある', '報告されている', 'かもしれない'],
                prohibited_phrases: ['絶対', '必ず', '確実', '治る']
            }
        };

        if (configPath && fs.existsSync(configPath)) {
            try {
                const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                return { ...defaultConfig, ...userConfig };
            } catch (error) {
                console.warn(`設定ファイル読み込みエラー: ${error.message}, デフォルト設定を使用`);
                return defaultConfig;
            }
        }

        return defaultConfig;
    }

    get(section, key, defaultValue = null) {
        return this.config[section]?.[key] ?? defaultValue;
    }
}

module.exports = {
    LintResult,
    BaseLinter,
    LinterConfig
};