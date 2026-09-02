#!/usr/bin/env node
/**
 * lint-hardcoded-strings.js
 *
 * app/ と components/ 内のハードコードされた日本語文字列を検出。
 * 既定では warning-only。--fail-on-new でベースラインとの差分のみ fail 可能。
 */

const fs = require('fs');
const path = require('path');

// 検出対象ディレクトリ
const TARGET_DIRS = ['app', 'components'];

// 検出から外すディレクトリ（出荷UIではない dev-only 面）。
// app/debug は __DEV__ 以外では到達不能なデバッグ画面、components/provisional は
// 生の日本語で書く試作（Preserve First 面）。翻訳対象にならないので lint しない。
const EXCLUDE_DIRS = ['app/debug', 'components/provisional'];

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

function parseArgs(argv) {
    const flags = new Set();
    const options = {};
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (!token.startsWith('--')) continue;
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
            options[token] = next;
            i++;
            continue;
        }
        flags.add(token);
    }
    return { flags, options };
}

function collectSourceFiles(rootDir, targetDir) {
    const startDir = path.join(rootDir, targetDir);
    if (!fs.existsSync(startDir)) return [];

    const files = [];
    const stack = [startDir];

    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === '.git') continue;
                const relativeDir = path.relative(rootDir, fullPath).split(path.sep).join('/');
                if (EXCLUDE_DIRS.includes(relativeDir)) continue;
                stack.push(fullPath);
                continue;
            }

            if (!entry.isFile()) continue;
            if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;
            files.push(fullPath);
        }
    }

    return files;
}

function scanFile(cwd, filePath) {
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

            const relPath = path.relative(cwd, filePath);
            warnings.push({
                file: relPath,
                line: index + 1,
                text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                fullLine: line.trim().substring(0, 80),
                key: `${relPath}:${index + 1}:${text}`,
            });
        }
    });

    return warnings;
}

function ensureParentDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadBaseline(filePath) {
    if (!fs.existsSync(filePath)) {
        return { version: 1, generatedAt: null, entries: [] };
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
        return {
            version: parsed.version || 1,
            generatedAt: parsed.generatedAt || null,
            entries: entries.filter((x) => typeof x === 'string'),
        };
    } catch (error) {
        console.warn(`⚠️  Failed to parse baseline file: ${filePath}`);
        return { version: 1, generatedAt: null, entries: [] };
    }
}

function saveBaseline(filePath, warnings) {
    const uniqueKeys = [...new Set(warnings.map((w) => w.key))].sort();
    const payload = {
        version: 1,
        generatedAt: new Date().toISOString(),
        total: uniqueKeys.length,
        entries: uniqueKeys,
    };
    ensureParentDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + '\n');
}

function writeMarkdownReport(cwd, warnings, newWarnings) {
    const reportPath = path.join(cwd, 'docs/_reports/hardcoded_strings.md');
    ensureParentDir(reportPath);

    const grouped = {};
    for (const warning of warnings) {
        if (!grouped[warning.file]) grouped[warning.file] = [];
        grouped[warning.file].push(warning);
    }

    const newKeys = new Set(newWarnings.map((w) => w.key));
    const reportLines = [
        '# ハードコード文字列レポート',
        '',
        `生成日時: ${new Date().toISOString()}`,
        '',
        `## 検出数: ${warnings.length}件`,
        `## ベースライン差分: ${newWarnings.length}件`,
        '',
    ];

    for (const [file, fileWarnings] of Object.entries(grouped)) {
        reportLines.push(`### ${file}`);
        reportLines.push('');
        reportLines.push('| 行 | テキスト | 差分 |');
        reportLines.push('|----|----------|------|');
        for (const w of fileWarnings) {
            const delta = newKeys.has(w.key) ? 'NEW' : '-';
            reportLines.push(`| ${w.line} | \`${w.text.replace(/\|/g, '\\|')}\` | ${delta} |`);
        }
        reportLines.push('');
    }

    fs.writeFileSync(reportPath, reportLines.join('\n'));
    console.log(`📝 レポート生成: ${path.relative(cwd, reportPath)}`);
}

function printGroupedSummary(warnings) {
    const grouped = {};
    for (const warning of warnings) {
        if (!grouped[warning.file]) grouped[warning.file] = [];
        grouped[warning.file].push(warning);
    }

    for (const [file, fileWarnings] of Object.entries(grouped)) {
        console.log(`📄 ${file}`);
        for (const w of fileWarnings) {
            console.log(`   L${w.line}: "${w.text}"`);
        }
        console.log('');
    }
}

function main() {
    const { flags, options } = parseArgs(process.argv.slice(2));
    const failOnNew = flags.has('--fail-on-new');
    const updateBaseline = flags.has('--update-baseline');
    const cwd = process.cwd();
    const baselinePath = path.resolve(
        cwd,
        options['--baseline'] || 'scripts/hardcoded-strings-baseline.json'
    );

    console.log('🔍 ハードコード文字列検出開始...\n');

    let allWarnings = [];

    TARGET_DIRS.forEach(dir => {
        const files = collectSourceFiles(cwd, dir);

        files.forEach(file => {
            const warnings = scanFile(cwd, file);
            allWarnings = allWarnings.concat(warnings);
        });
    });

    const baseline = loadBaseline(baselinePath);
    const baselineSet = new Set(baseline.entries);
    const newWarnings = allWarnings.filter((w) => !baselineSet.has(w.key));

    if (updateBaseline) {
        saveBaseline(baselinePath, allWarnings);
        console.log(`✅ ベースライン更新: ${path.relative(cwd, baselinePath)} (${allWarnings.length} entries)`);
    }

    writeMarkdownReport(cwd, allWarnings, newWarnings);

    if (allWarnings.length === 0) {
        console.log('✅ ハードコードされた日本語文字列は検出されませんでした\n');
        process.exit(0);
    }

    console.log(`⚠️  ${allWarnings.length}件のハードコード文字列を検出`);
    console.log(`📈 ベースラインとの差分: ${newWarnings.length}件\n`);
    printGroupedSummary(allWarnings);

    if (failOnNew && newWarnings.length > 0) {
        console.log('❌ 新規ハードコード文字列が追加されました。');
        process.exit(1);
    }

    process.exit(0);
}

main();
