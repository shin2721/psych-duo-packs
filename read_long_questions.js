const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'psycle-expo/data/lessons/work.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const questions = JSON.parse(rawData);

questions.forEach((q, index) => {
    const stem = q.stem || q.question || "";
    if (stem.length > 100) {
        console.log(`--- Index ${index} ---`);
        console.log(`Type: ${q.type}`);
        console.log(`Stem: ${stem}`);
        console.log(`Choices: ${JSON.stringify(q.choices)}`);
        console.log('-------------------');
    }
});
