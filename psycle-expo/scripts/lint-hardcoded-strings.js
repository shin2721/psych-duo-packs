#!/usr/bin/env node
/**
 * lint-hardcoded-strings.js
 *
 * app/ と components/ 内のハードコードされた日本語文字列を検出
 * CI warning用（fail しない）
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 検出対象ディレクトリ
const TARGET_DIRS = ['app', 'components'];

// 除外パターン（false positive を減らす）
const EXCLUDE_PATTERNS = [
    /^\s*\/\//,           // コメント行
    /^\s*\*/,             // JSDoc
    /console\.(log|warn|error)/, // console出力
    /testID=/,            // testID
    /import\s/,           // import文
    /require\(/,          // require文
    /StyleSheet\.create/, // StyleSheet定義
    /^export\s/,          // export文
    /Analytics\.track/,   // Analytics
];

// 日本語文字を含む文字列を検出する正規表現
const JAPANESE_REGEX = /["'`]([^"'`]*[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF][^"'`]*)["'`]/g;

// 許可リスト（既知のハードコードで許容するもの）
const ALLOWLIST = [
    'Psycle',             // ブランド名
    '質問',               // フォールバック（lessons.ts内）
    '答えを入力',         // プレースホルダー
    'レッスン',           // フォールバック
];

function isExcluded(line) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(line));
}

function isAllowlisted(text) {
    return ALLOWLIST.some(allowed => text.includes(allowed));
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const warnings = [];

    lines.forEach((line, index) => {
        // 除外パターンチェック
        if (isExcluded(line)) return;

        // 日本語文字列を検出
        let match;
        while ((match = JAPANESE_REGEX.exec(line)) !== null) {
            const text = match[1];

            // 許可リストチェック
            if (isAllowlisted(text)) continue;

            // i18n.t() 内なら OK
            if (line.includes('i18n.t(')) continue;

            warnings.push({
                file: filePath,
                line: index + 1,
                text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                fullLine: line.trim().substring(0, 80),
            });
        }
    });

    return warnings;
}

function main() {
    console.log('🔍 ハードコード文字列検出開始...\n');

    const cwd = process.cwd();
    let allWarnings = [];

    TARGET_DIRS.forEach(dir => {
        const pattern = path.join(cwd, dir, '**/*.{tsx,ts,jsx,js}');
        const files = glob.sync(pattern, { ignore: ['**/node_modules/**'] });

        files.forEach(file => {
            const warnings = scanFile(file);
            allWarnings = allWarnings.concat(warnings);
        });
    });

    // 結果出力
    if (allWarnings.length === 0) {
        console.log('✅ ハードコードされた日本語文字列は検出されませんでした\n');
        process.exit(0);
    }

    console.log(`⚠️  ${allWarnings.length}件のハードコード文字列を検出:\n`);

    // ファイル別にグループ化
    const grouped = {};
    allWarnings.forEach(w => {
        const relPath = path.relative(cwd, w.file);
        if (!grouped[relPath]) grouped[relPath] = [];
        grouped[relPath].push(w);
    });

    Object.entries(grouped).forEach(([file, warnings]) => {
        console.log(`📄 ${file}`);
        warnings.forEach(w => {
            console.log(`   L${w.line}: "${w.text}"`);
        });
        console.log('');
    });

    // Markdown レポート生成
    const reportPath = path.join(cwd, 'docs/_reports/hardcoded_strings.md');
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportLines = [
        '# ハードコード文字列レポート',
        '',
        `生成日時: ${new Date().toISOString()}`,
        '',
        `## 検出数: ${allWarnings.length}件`,
        '',
    ];

    Object.entries(grouped).forEach(([file, warnings]) => {
        reportLines.push(`### ${file}`);
        reportLines.push('');
        reportLines.push('| 行 | テキスト |');
        reportLines.push('|----|----------|');
        warnings.forEach(w => {
            reportLines.push(`| ${w.line} | \`${w.text.replace(/\|/g, '\\|')}\` |`);
        });
        reportLines.push('');
    });

    fs.writeFileSync(reportPath, reportLines.join('\n'));
    console.log(`📝 レポート生成: ${path.relative(cwd, reportPath)}`);

    // CI用: warning として終了（exit 0）
    // fail させたい場合は exit 1 に変更
    process.exit(0);
}

main();
