#!/usr/bin/env node

/**
 * Release Zip Creator
 * リリース用zipを生成し、.env*ファイルを確実に除外
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_ZIP = process.env.HOME + '/Desktop/psycle-expo.zip';

function createReleaseZip() {
    console.log('🚀 リリース用zip生成開始...');
    
    // 既存zipがあれば削除
    if (fs.existsSync(OUTPUT_ZIP)) {
        fs.unlinkSync(OUTPUT_ZIP);
        console.log('🗑️  既存zipを削除');
    }
    
    // zipコマンドで除外指定（.envファイルを確実に除外）
    console.log('📦 zipコマンドで生成中（.env除外）...');
    
    const excludePatterns = [
        '*.env*',
        '.env*',
        '.expo-dev.pid',
        'node_modules/*',
        'scripts/content-generator/node_modules/*',
        'ios/Pods/*',
        'ios/build/*',
        '.git/*',
        '.expo/*',
        'android/build/*',
        'docs/_reports/*',
        'scripts/content-generator/.env*'
    ];
    
    const excludeArgs = excludePatterns.map(pattern => `-x "${pattern}"`).join(' ');
    execSync(`zip -r ${OUTPUT_ZIP} . ${excludeArgs}`, {
        stdio: 'inherit'
    });
    console.log(`✅ zip生成完了: ${OUTPUT_ZIP}`);
    
    return OUTPUT_ZIP;
}

function checkZipContents(zipFile) {
    console.log('🔍 zip内容検査開始...');
    
    try {
        // zipの内容一覧を取得
        const contents = execSync(`unzip -l ${zipFile}`, { encoding: 'utf8' });
        
        // 危険ファイルの検出
        const dangerousFiles = [];
        
        // .envファイルの検出
        const envFiles = contents.split('\n').filter(line => 
            line.includes('.env') && !line.includes('example')
        );
        dangerousFiles.push(...envFiles);
        
        // .expo-dev.pidの検出
        const pidFiles = contents.split('\n').filter(line => 
            line.includes('.expo-dev.pid')
        );
        dangerousFiles.push(...pidFiles);
        
        if (dangerousFiles.length > 0) {
            console.log('❌ FAIL: zip内に危険ファイルが検出されました:');
            dangerousFiles.forEach(file => console.log(`  - ${file.trim()}`));
            console.log('');
            console.log('🚨 セキュリティリスク: 機密情報が含まれている可能性があります');
            process.exit(1);
        } else {
            console.log('✅ PASS: 危険ファイル（.env*, .expo-dev.pid）は含まれていません');
        }
        
        // 基本的なファイル存在確認
        const requiredFiles = [
            'package.json',
            'app.json',
            'App.js'
        ];
        
        let missingFiles = [];
        for (const file of requiredFiles) {
            if (!contents.includes(file)) {
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length > 0) {
            console.log('⚠️  WARNING: 必要なファイルが見つかりません:');
            missingFiles.forEach(file => console.log(`  - ${file}`));
        } else {
            console.log('✅ 必要なファイルが含まれています');
        }
        
        console.log('🎯 zip検査完了: 問題なし');
        
    } catch (error) {
        console.error('❌ zip検査失敗:', error.message);
        process.exit(1);
    }
}

function main() {
    const zipFile = createReleaseZip();
    checkZipContents(zipFile);
    
    console.log('');
    console.log('🎉 リリース用zip作成完了!');
    console.log(`📁 ファイル: ${zipFile}`);
    console.log('🔒 危険ファイル（.env*, .expo-dev.pid）は除外されています');
}

if (require.main === module) {
    main();
}

module.exports = { createReleaseZip, checkZipContents };