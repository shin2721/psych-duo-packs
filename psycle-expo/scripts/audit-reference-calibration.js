const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES_PATH = path.join(ROOT, "docs", "REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md");

const MIN_TOTAL = 50;
const MIN_REJECTION = 8;
const MIN_DLAB_INTERNAL_PALEO = 50;

const doc = fs.readFileSync(SAMPLES_PATH, "utf8");

const calibrationRows = [...doc.matchAll(/^\| (dlab_|paleo_)/gm)].length;
const dlabInternalPaleoRows = [...doc.matchAll(/^\| dlab_paleo_/gm)].length;
const rejectionRows = [...doc.matchAll(/^\| reject_[^|]* \| (D-Lab|Paleo) \|/gm)].length;
const totalRows = calibrationRows + rejectionRows;

const errors = [];

if (!doc.includes("50+ Sample Standard")) {
  errors.push("REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md must define the 50+ Sample Standard.");
}

if (!doc.includes("50-Sample Synthesis") || !doc.includes("Resulting Psycle Lesson Algorithm V2")) {
  errors.push("REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md must turn 50+ samples into an explicit lesson algorithm synthesis.");
}

if (!doc.includes("calibrated_v1_candidate")) {
  errors.push("REFERENCE_LEARNING_EXPERIENCE_SAMPLES.md must mark sub-50 calibration as calibrated_v1_candidate.");
}

if (totalRows < MIN_TOTAL) {
  errors.push(`Reference calibration needs at least ${MIN_TOTAL} inspected samples; found ${totalRows}.`);
}

if (rejectionRows < MIN_REJECTION) {
  errors.push(`Reference calibration needs at least ${MIN_REJECTION} rejection/weak-source samples; found ${rejectionRows}.`);
}

if (dlabInternalPaleoRows < MIN_DLAB_INTERNAL_PALEO) {
  errors.push(
    `D-Lab-internal Paleo calibration needs at least ${MIN_DLAB_INTERNAL_PALEO} body-inspected samples; found ${dlabInternalPaleoRows}.`,
  );
}

console.log("Reference calibration audit");
console.log("===========================");
console.log(`calibration samples: ${calibrationRows}`);
console.log(`D-Lab-internal Paleo samples: ${dlabInternalPaleoRows}`);
console.log(`rejection samples: ${rejectionRows}`);
console.log(`total samples: ${totalRows}`);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log("reference calibration: OK");
