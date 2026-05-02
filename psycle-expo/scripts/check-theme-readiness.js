#!/usr/bin/env node

const { evaluateThemeManifestReadiness } = require("./lib/theme-manifest.js");

function main() {
  const [, , themeId, target = "production"] = process.argv;

  if (!themeId) {
    console.error("Usage: node scripts/check-theme-readiness.js <themeId> [production|staging]");
    process.exit(1);
  }

  const result = evaluateThemeManifestReadiness(themeId, process.cwd(), target);

  if (result.errors.length > 0) {
    console.error(`❌ Theme readiness failed: ${themeId}`);
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(`✅ Theme readiness passed: ${themeId} (${target})`);

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.log(`⚠️  ${warning}`);
    }
  }
}

main();
