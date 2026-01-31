#!/usr/bin/env node
/**
 * Auto-generate index.ts for all lesson unit directories
 * 
 * Usage: npm run gen:units
 * 
 * Scans data/lessons/*_units for *.ja.json files and generates
 * corresponding index.ts with proper imports and exports.
 */

const fs = require('fs');
const path = require('path');

const LESSONS_DIR = path.join(__dirname, '../data/lessons');

function getUnitDirs() {
    return fs.readdirSync(LESSONS_DIR)
        .filter(name => name.endsWith('_units'))
        .map(name => path.join(LESSONS_DIR, name));
}

function getJsonFiles(unitDir) {
    return fs.readdirSync(unitDir)
        .filter(name => name.endsWith('.ja.json'))
        .sort(); // Ensure consistent order (l01, l02, l03...)
}

function generateIndexTs(unitDir) {
    const jsonFiles = getJsonFiles(unitDir);
    if (jsonFiles.length === 0) {
        console.log(`  Skipping ${path.basename(unitDir)}: no .ja.json files`);
        return;
    }

    const unitName = path.basename(unitDir).replace('_units', '');

    // Generate import statements
    const imports = jsonFiles.map(file => {
        const baseName = file.replace('.ja.json', '_ja');
        return `import ${baseName} from "./${file}";`;
    }).join('\n');

    // Generate spread array
    const spreads = jsonFiles.map(file => {
        const baseName = file.replace('.ja.json', '_ja');
        return `  ...${baseName},`;
    }).join('\n');

    // Generate full file content
    const content = `${imports}

export const ${unitName}Data = [
${spreads}
];

export const ${unitName}Data_ja = [
${spreads}
];
`;

    const indexPath = path.join(unitDir, 'index.ts');
    fs.writeFileSync(indexPath, content, 'utf-8');
    console.log(`  Generated ${path.basename(unitDir)}/index.ts (${jsonFiles.length} files)`);
}

function main() {
    console.log('Generating index.ts for lesson units...\n');

    const unitDirs = getUnitDirs();
    console.log(`Found ${unitDirs.length} unit directories:\n`);

    for (const unitDir of unitDirs) {
        generateIndexTs(unitDir);
    }

    console.log('\nDone! Remember to reload Metro bundler after adding new lesson files.');
    
    // Run validation after index generation
    console.log('\n🔍 Running lesson validation...');
    const { execSync } = require('child_process');
    try {
        execSync('npx ts-node scripts/validate-lessons.ts', { stdio: 'inherit' });
        console.log('✅ Validation completed successfully');
    } catch (error) {
        console.error('❌ Validation failed');
        process.exit(1);
    }
}

main();
