#!/usr/bin/env node
/**
 * manifest.json 生成スクリプト
 * 
 * 目的: アプリが「最新レッスン一覧」を外部から取得できるようにする
 * 将来のリモート配信に備えた基盤
 * 
 * 使い方: node scripts/generate_manifest.mjs
 * 出力: data/manifest.json
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const lessonsDir = path.join(rootDir, 'data/lessons');
const outputPath = path.join(rootDir, 'data/manifest.json');

// SHA256ハッシュ生成
function sha256(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

// レッスンファイルを収集
function collectLessons() {
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];
    const lessons = [];

    for (const domain of domains) {
        const domainDir = path.join(lessonsDir, `${domain}_units`);

        if (!fs.existsSync(domainDir)) {
            console.warn(`[WARN] Domain directory not found: ${domainDir}`);
            continue;
        }

        const files = fs.readdirSync(domainDir)
            .filter(f => f.endsWith('.ja.json'))
            .sort();

        for (const file of files) {
            const filePath = path.join(domainDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const stat = fs.statSync(filePath);

            // ファイル名からレベルを抽出 (例: mental_l01.ja.json -> 1)
            const match = file.match(/_l(\d{2})\./);
            const level = match ? parseInt(match[1], 10) : 0;

            // localeを抽出 (例: mental_l01.ja.json -> ja)
            const localeMatch = file.match(/\.([a-z]{2})\.json$/);
            const locale = localeMatch ? localeMatch[1] : 'ja';

            // 問題数をカウント
            let questionCount = 0;
            try {
                const data = JSON.parse(content);
                questionCount = Array.isArray(data) ? data.length : (data.questions?.length || 0);
            } catch (e) {
                console.warn(`[WARN] Failed to parse ${file}`);
            }

            lessons.push({
                id: `${domain}_l${String(level).padStart(2, '0')}`,
                domain,
                level,
                locale,
                file: `psycle-expo/data/lessons/${domain}_units/${file}`,
                sha256: sha256(content),
                bytes: Buffer.byteLength(content, 'utf-8'),
                updated_at: stat.mtime.toISOString(),
                question_count: questionCount
            });
        }
    }

    // ドメイン→レベル順でソート
    lessons.sort((a, b) => {
        if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
        return a.level - b.level;
    });

    return lessons;
}

// カリキュラム情報を収集
function collectCurricula() {
    const curricula = {};
    const domains = ['mental', 'money', 'work', 'health', 'social', 'study'];

    for (const domain of domains) {
        // カリキュラムファイル名のパターンを試す
        const patterns = [
            `curriculum_${domain}.json`,
            `curriculum_${domain.charAt(0).toUpperCase() + domain.slice(1)}.json`
        ];

        for (const pattern of patterns) {
            const filePath = path.join(rootDir, 'data', pattern);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                curricula[domain] = {
                    file: `psycle-expo/data/${pattern}`,
                    sha256: sha256(content),
                    updated_at: fs.statSync(filePath).mtime.toISOString()
                };
                break;
            }
        }
    }

    return curricula;
}

// ソース情報を収集
function collectSources() {
    const sourcesPath = path.join(rootDir, 'data/curated_sources.json');

    if (!fs.existsSync(sourcesPath)) {
        return null;
    }

    const content = fs.readFileSync(sourcesPath, 'utf-8');
    return {
        file: 'psycle-expo/data/curated_sources.json',
        sha256: sha256(content),
        updated_at: fs.statSync(sourcesPath).mtime.toISOString()
    };
}

// メイン処理
function main() {
    console.log('🔧 Generating manifest.json...\n');

    const lessons = collectLessons();
    const curricula = collectCurricula();
    const sources = collectSources();

    // 現在時刻でバージョン生成 (YYYY.MM.DD.HHmm形式 - 同日複数更新でも検知可能)
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const content_version = `${dateStr}.${timeStr}`;

    const manifest = {
        manifest_version: 1,
        content_version,
        min_app_version: "1.0.0",
        generated_at: now.toISOString(),
        lessons,
        curricula,
        sources,
        stats: {
            total_lessons: lessons.length,
            domains: [...new Set(lessons.map(l => l.domain))],
            total_questions: lessons.reduce((sum, l) => sum + l.question_count, 0),
            total_bytes: lessons.reduce((sum, l) => sum + l.bytes, 0)
        }
    };

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    console.log('✅ Manifest generated successfully!\n');
    console.log(`📦 Output: ${outputPath}`);
    console.log(`📊 Stats:`);
    console.log(`   - Content Version: ${content_version}`);
    console.log(`   - Total Lessons: ${manifest.stats.total_lessons}`);
    console.log(`   - Total Questions: ${manifest.stats.total_questions}`);
    console.log(`   - Domains: ${manifest.stats.domains.join(', ')}`);
}

main();
