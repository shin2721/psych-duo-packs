const fs = require('fs');
const path = require('path');

const GENRES = ['mental', 'work', 'social', 'health', 'study', 'money'];

function splitGenre(genre, suffix = '_platinum.json') {
    const inputFile = path.join(__dirname, `../data/lessons/${genre}${suffix}`);
    if (!fs.existsSync(inputFile)) {
        console.log(`Skipping ${genre} (file not found: ${inputFile})`);
        return;
    }

    const outputDir = path.join(__dirname, `../data/lessons/${genre}_units`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Reading ${inputFile}...`);
    const questions = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    // Group by Lesson ID (e.g. "mental_l01")
    const units = {};

    questions.forEach(q => {
        // ID format: genre_lXX_qXX
        // Extract genre_lXX
        const parts = q.id.split('_');
        if (parts.length < 2) return;

        const unitId = `${parts[0]}_${parts[1]}`; // e.g. mental_l01

        if (!units[unitId]) {
            units[unitId] = [];
        }
        units[unitId].push(q);
    });

    const unitKeys = Object.keys(units).sort();
    console.log(`Found ${unitKeys.length} units in ${genre}. Writing files...`);

    // Write individual unit files
    unitKeys.forEach(unitKey => {
        const unitFile = path.join(outputDir, `${unitKey}.json`);
        fs.writeFileSync(unitFile, JSON.stringify(units[unitKey], null, 2));
    });

    // Generate index.ts for easy importing
    const indexContent = unitKeys.map(key => `import ${key} from "./${key}.json";`).join('\n') +
        `\n\nexport const ${genre}Data = [\n` +
        unitKeys.map(key => `  ...${key},`).join('\n') +
        `\n];\n`;

    fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
    console.log(`✅ ${genre} split complete.`);
}

// Split available platinum files
splitGenre('mental', '_platinum.json');
splitGenre('work', '_platinum.json'); // Partial
splitGenre('health', '_platinum.json');
splitGenre('social', '_platinum.json'); // Might check generated file
splitGenre('study', '_platinum.json');
splitGenre('money', '_platinum.json');
