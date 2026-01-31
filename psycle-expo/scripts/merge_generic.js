const fs = require("fs");

// Get genre from command line argument
const genre = process.argv[2];

if (!genre) {
    console.error("Usage: node merge_generic.js <genre>");
    console.error("Example: node merge_generic.js Mental");
    process.exit(1);
}

// Load existing json
const existingPath = `data/lessons/${genre.toLowerCase()}.json`;
let existingQuestions = [];
if (fs.existsSync(existingPath)) {
    existingQuestions = JSON.parse(fs.readFileSync(existingPath, "utf8"));
} else {
    console.log(`No existing file for ${genre}, creating new.`);
}

// Load newly generated questions
const newQuestions = JSON.parse(fs.readFileSync(`data/lessons/${genre.toLowerCase()}_generated_full.json`, "utf8"));

console.log(`Existing questions: ${existingQuestions.length}`);
console.log(`New questions: ${newQuestions.length}`);

// Create a backup
if (existingQuestions.length > 0) {
    fs.writeFileSync(`data/lessons/${genre.toLowerCase()}_backup.json`, JSON.stringify(existingQuestions, null, 2));
    console.log(`✅ Backup created: ${genre.toLowerCase()}_backup.json`);
}

// Strategy: Replace all questions with new generated ones
// The new questions have proper IDs (mental_l01_q01, etc.) and academic citations
// Old questions will be archived in the backup

// Write new questions to file
fs.writeFileSync(existingPath, JSON.stringify(newQuestions, null, 2));

console.log(`\n✅ Successfully replaced ${genre.toLowerCase()}.json with ${newQuestions.length} new questions`);
if (existingQuestions.length > 0) {
    console.log(`📁 Old questions backed up to: ${genre.toLowerCase()}_backup.json`);
}
