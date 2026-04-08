#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const derivedDataPath = process.argv[2] ?? '/tmp/psycle-repair-build3';
const seedSourceDerivedDataPath = process.argv[3] ?? derivedDataPath;

const productsRoot = path.join(derivedDataPath, 'Build/Products/Debug-iphoneos');
const sourceProductsRoot = path.join(
  seedSourceDerivedDataPath,
  'Build/Products/Debug-iphoneos'
);
const sourceIntermediatesRoot = path.join(
  seedSourceDerivedDataPath,
  'Build/Intermediates.noindex/Pods.build/Debug-iphoneos'
);
const supportRoot = path.join(
  '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/ios/Pods/Target Support Files'
);

if (
  (!fs.existsSync(sourceIntermediatesRoot) && !fs.existsSync(sourceProductsRoot)) ||
  !fs.existsSync(supportRoot)
) {
  process.exit(0);
}

const moduleNames = new Set();

if (fs.existsSync(sourceIntermediatesRoot)) {
  for (const buildDirName of fs.readdirSync(sourceIntermediatesRoot)) {
    if (!buildDirName.endsWith('.build')) {
      continue;
    }

    moduleNames.add(buildDirName.replace(/\.build$/, ''));
  }
}

if (fs.existsSync(sourceProductsRoot)) {
  for (const entryName of fs.readdirSync(sourceProductsRoot)) {
    const productDir = path.join(sourceProductsRoot, entryName);
    if (!fs.statSync(productDir).isDirectory()) {
      continue;
    }

    moduleNames.add(entryName);
  }
}

for (const moduleName of moduleNames) {
  const derivedHeaderPath = [
    path.join(
      sourceIntermediatesRoot,
      `${moduleName}.build`,
      'DerivedSources',
      `${moduleName}-Swift.h`
    ),
    path.join(
      sourceProductsRoot,
      moduleName,
      'Swift Compatibility Header',
      `${moduleName}-Swift.h`
    ),
  ].find((candidate) => fs.existsSync(candidate));
  if (!derivedHeaderPath) {
    continue;
  }

  const supportDir = path.join(supportRoot, moduleName);
  if (!fs.existsSync(supportDir)) {
    continue;
  }

  const productDir = path.join(productsRoot, moduleName);
  const compatDir = path.join(productDir, 'Swift Compatibility Header');
  fs.mkdirSync(compatDir, { recursive: true });

  const compatibilityHeaderPath = path.join(compatDir, `${moduleName}-Swift.h`);
  fs.copyFileSync(derivedHeaderPath, compatibilityHeaderPath);

  const modulemapCandidates = [
    path.join(supportDir, `${moduleName}.modulemap`),
    path.join(supportDir, `${moduleName.toLowerCase()}.modulemap`),
  ];
  const modulemapPath = modulemapCandidates.find((candidate) => fs.existsSync(candidate));
  if (modulemapPath) {
    const destinationModulemapPath = path.join(productDir, path.basename(modulemapPath));
    fs.mkdirSync(productDir, { recursive: true });
    fs.copyFileSync(modulemapPath, destinationModulemapPath);
    fs.appendFileSync(
      destinationModulemapPath,
      `\n\nmodule ${moduleName}.Swift {\n  header "${compatibilityHeaderPath}"\n  requires objc\n}\n`
    );
  }

  const umbrellaCandidates = fs
    .readdirSync(supportDir)
    .filter((fileName) => fileName.endsWith('-umbrella.h'));
  if (umbrellaCandidates.length > 0) {
    fs.copyFileSync(
      path.join(supportDir, umbrellaCandidates[0]),
      path.join(productDir, umbrellaCandidates[0])
    );
  }
}
