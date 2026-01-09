const fs = require('fs');

const MENTAL_PATH = '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons/mental.json';
const GENERATED_PATH = '/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/data/lessons/mental_generated_1_5.json';

try {
    const mentalData = JSON.parse(fs.readFileSync(MENTAL_PATH, 'utf8'));
    const generatedData = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf8'));

    // Merge: Add new questions to the existing array
    // We filter out duplicates based on ID just in case
    const existingIds = new Set(mentalData.map(q => q.id));
    const newQuestions = generatedData.filter(q => !existingIds.has(q.id));

    const mergedData = [...mentalData, ...newQuestions];

    fs.writeFileSync(MENTAL_PATH, JSON.stringify(mergedData, null, 2));
    console.log(`Successfully merged ${newQuestions.length} new questions into mental.json`);
    console.log(`Total questions: ${mergedData.length}`);

} catch (error) {
    console.error('Error merging files:', error);
}
