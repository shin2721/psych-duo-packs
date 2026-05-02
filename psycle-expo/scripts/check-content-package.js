#!/usr/bin/env node

const path = require("path");
const { evaluateContentPackageReadiness } = require("./lib/content-package.js");

function main() {
  const [, , lessonPathArg, mode = "promote"] = process.argv;

  if (!lessonPathArg) {
    console.error("Usage: node scripts/check-content-package.js <lessonPath> [audit|promote]");
    process.exit(1);
  }

  const lessonPath = path.isAbsolute(lessonPathArg)
    ? lessonPathArg
    : path.join(process.cwd(), lessonPathArg);

  const result = evaluateContentPackageReadiness(lessonPath, {
    rootDir: process.cwd(),
    mode,
  });

  if (result.errors.length > 0) {
    console.error(`❌ Content package readiness failed: ${lessonPathArg}`);
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(`✅ Content package readiness passed: ${lessonPathArg} (${mode})`);
  for (const warning of result.warnings) {
    console.log(`⚠️  ${warning}`);
  }
}

main();
