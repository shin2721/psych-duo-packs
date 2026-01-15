const fs = require('fs');
const path = require('path');

const autoFiles = [
    'data/lessons/health_units/health_auto_l01.ja.json',
    'data/lessons/health_units/health_auto_l02.ja.json',
    'data/lessons/mental_units/mental_auto_l01.ja.json',
    'data/lessons/mental_units/mental_auto_l02.ja.json',
    'data/lessons/money_units/money_auto_l01.ja.json',
    'data/lessons/money_units/money_auto_l02.ja.json',
    'data/lessons/social_units/social_auto_l01.ja.json',
    'data/lessons/social_units/social_auto_l02.ja.json',
    'data/lessons/study_units/study_auto_l01.ja.json',
    'data/lessons/study_units/study_auto_l02.ja.json',
    'data/lessons/work_units/work_auto_l01.ja.json',
    'data/lessons/work_units/work_auto_l02.ja.json'
];

let totalRemoved = 0;

for (const file of autoFiles) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    let removedInFile = 0;

    for (const q of content) {
        if (q.evidence_grade) {
            const hasClaimType = q.expanded_details?.claim_type;
            const hasEvidenceType = q.expanded_details?.evidence_type;

            if (!hasClaimType && !hasEvidenceType) {
                delete q.evidence_grade;
                if (q.evidence_text) delete q.evidence_text;
                removedInFile++;
            }
        }
    }

    if (removedInFile > 0) {
        fs.writeFileSync(file, JSON.stringify(content, null, 4));
        console.log(path.basename(file) + ': removed ' + removedInFile + ' evidence_grade(s)');
        totalRemoved += removedInFile;
    }
}

console.log('\nTotal: ' + totalRemoved + ' evidence_grade fields removed from auto files');
