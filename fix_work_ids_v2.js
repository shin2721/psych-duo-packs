const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'psycle-expo/data/lessons/work.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const questions = JSON.parse(rawData);

console.log(`Loaded ${questions.length} questions.`);

questions.forEach((q, i) => {
    const level = Math.floor(i / 15) + 1;
    const index = (i % 15) + 1;
    const newId = `work_l${String(level).padStart(2, '0')}_${String(index).padStart(2, '0')}`;

    // Keep the original ID in a separate field if needed, or just overwrite
    q.source_id = newId;
    q.id = newId; // Update both just in case
});

fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
console.log('Updated IDs in work.json');
