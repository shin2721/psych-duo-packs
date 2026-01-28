#!/usr/bin/env node

/**
 * Staging Empty Check
 * stagingディレクトリが空であることを確認（CI/zip作成前の安全チェック）
 */

const fs = require('fs');
const path = require('path');

const STAGING_ROOT = 'data/lessons/_staging';
const DOMAINS = ['mental', 'money', 'work', 'health', 'social', 'study'];

function checkStagingEmpty() {
    console.log('🔍 Staging Empty チェック開始...');
    
    let hasFiles = false;
    const foundFiles = [];
    
    // stagingディレクトリが存在しない場合はOK
    if (!fs.existsSync(STAGING_ROOT)) {
        console.log('✅ staging ディレクトリが存在しません（OK）');
        return { isEmpty: true, foundFiles: [] };
    }
    
    // 各ドメインをチェック
    for (const domain of DOMAINS) {
        const domainDir = path.join(STAGING_ROOT, `${domain}_units`);
        
        if (!fs.existsSync(domainDir)) {
            continue;
        }
        
        const files = fs.readdirSync(domainDir);
        const relevantFiles = files.filter(f => 
            f.endsWith('.ja.json') || f.endsWith('.evidence.json')
        );
        
        if (relevantFiles.length > 0) {
            hasFiles = true;
            for (const file of relevantFiles) {
                foundFiles.push(path.join(domainDir, file));
            }
        }
    }
    
    if (hasFiles) {
        console.log('⚠️  WARNING: staging に残骸ファイルが見つかりました:');
        for (const file of foundFiles) {
            console.log(`  - ${file}`);
        }
        console.log('');
        console.log('💡 推奨アクション:');
        console.log('  1. 意図的な staging ファイルの場合: そのまま継続');
        console.log('  2. 残骸ファイルの場合: 以下で削除');
        console.log('     rm -f data/lessons/_staging/*_units/*.json');
        console.log('  3. 個別削除の場合: 上記リストから選択して削除');
        console.log('');
        
        return { isEmpty: false, foundFiles };
    } else {
        console.log('✅ staging ディレクトリは空です');
        return { isEmpty: true, foundFiles: [] };
    }
}

/**
 * スタンドアロン実行
 */
function main() {
    const result = checkStagingEmpty();
    
    // 環境変数でCI動作を制御
    const failOnStaging = process.env.FAIL_ON_STAGING === '1';
    
    // 終了コード設定
    if (result.isEmpty) {
        console.log('🎯 staging チェック完了: 問題なし');
        process.exit(0);
    } else {
        if (failOnStaging) {
            console.log('🎯 staging チェック完了: 残骸ファイルあり（CI FAIL）');
            process.exit(1);
        } else {
            console.log('🎯 staging チェック完了: 残骸ファイルあり（WARNING）');
            process.exit(0);
        }
    }
}

// 実行
if (require.main === module) {
    main();
}

module.exports = { checkStagingEmpty };