const fs = require("fs");

// Load existing mental.json
const existingQuestions = JSON.parse(fs.readFileSync("data/lessons/mental.json", "utf8"));

// Load newly generated questions
const newQuestions = JSON.parse(fs.readFileSync("data/lessons/mental_generated_full.json", "utf8"));

console.log(`Existing questions: ${existingQuestions.length}`);
console.log(`New questions: ${newQuestions.length}`);

// Create a backup
fs.writeFileSync("data/lessons/mental_backup.json", JSON.stringify(existingQuestions, null, 2));
console.log("✅ Backup created: mental_backup.json");

// Strategy: Replace all questions with new generated ones
// The new questions have proper IDs (mental_l01_q01, etc.) and academic citations
// Old questions will be archived in the backup

// Write new questions to mental.json
fs.writeFileSync("data/lessons/mental.json", JSON.stringify(newQuestions, null, 2));

console.log(`\n✅ Successfully replaced mental.json with ${newQuestions.length} new questions`);
console.log(`📁 Old questions backed up to: mental_backup.json`);
