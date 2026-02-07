#!/usr/bin/env node
/**
 * lint-en-json-no-ja.js
 *
 * Fails when Japanese characters are found in lesson *.en.json files.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.cwd(), 'data/lessons');
const JA_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

function collectEnJsonFiles(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_translation_cache') continue;
      collectEnJsonFiles(fullPath, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.en.json')) {
      out.push(fullPath);
    }
  }
}

function walk(node, jsonPath, findings) {
  if (typeof node === 'string') {
    if (JA_CHAR_REGEX.test(node)) {
      findings.push({
        path: jsonPath || '$',
        value: node.length > 120 ? `${node.slice(0, 120)}...` : node,
      });
    }
    return;
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walk(node[i], `${jsonPath}[${i}]`, findings);
    }
    return;
  }

  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const nextPath = jsonPath ? `${jsonPath}.${key}` : key;
      walk(value, nextPath, findings);
    }
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`❌ Missing lessons directory: ${ROOT}`);
    process.exit(1);
  }

  const files = [];
  collectEnJsonFiles(ROOT, files);

  if (files.length === 0) {
    console.log('⚠️ No *.en.json files found.');
    process.exit(0);
  }

  const allFindings = [];
  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`❌ Failed to parse JSON: ${path.relative(process.cwd(), file)} (${err.message})`);
      process.exit(1);
    }

    const findings = [];
    walk(parsed, '', findings);
    if (findings.length > 0) {
      allFindings.push({
        file: path.relative(process.cwd(), file),
        findings,
      });
    }
  }

  if (allFindings.length === 0) {
    console.log('✅ No Japanese characters found in *.en.json files');
    process.exit(0);
  }

  console.log(`❌ Japanese characters found in ${allFindings.length} EN file(s):`);
  for (const hit of allFindings) {
    console.log(`\n📄 ${hit.file}`);
    for (const finding of hit.findings.slice(0, 20)) {
      console.log(`  - ${finding.path}: "${finding.value}"`);
    }
    if (hit.findings.length > 20) {
      console.log(`  ... and ${hit.findings.length - 20} more`);
    }
  }

  process.exit(1);
}

main();
