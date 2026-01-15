const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function upgradeQuestionBatch(questions, genre, retryCount = 0) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are upgrading educational content to "Platinum Standard" for a psychology learning app.

**Input**: ${questions.length} existing questions from the "${genre}" genre.
**Task**: Enhance each question with:
1. **Actionable Advice**: Add a "💡 Try this:" section to the explanation with practical application (1-2 sentences).
2. **Citation**: Extract the citation from the explanation (e.g., "(Author, Year)") into a separate "citation" field. Remove it from the explanation text.
3. **Question Type Diversity**: 
   - Keep most as "multiple_choice"
   - Convert ~10% to "swipe_judgment" if the question is binary (True/False, Myth/Fact)
   - Convert ~5% to "conversation" if it's scenario-based
   - Convert ~5% to "fill_blank_tap" if it tests terminology
4. **Keep**: id, question, choices (if applicable), answer_index, difficulty, xp, source_id

**Output Format**: Return ONLY valid JSON (no markdown, no extra text):
{
  "questions": [
    {
      "id": "original_id",
      "type": "multiple_choice|swipe_judgment|conversation|fill_blank_tap",
      "question": "Original question text",
      "choices": ["A", "B", "C", "D"], // Only for multiple_choice
      "answer_index": 0, // Only for multiple_choice
      "correct_answer": "True", // Only for swipe_judgment
      "explanation": "Concise explanation WITHOUT citation.",
      "actionable_advice": "💡 Try this: Practical tip here.",
      "citation": "Author, Year",
      "difficulty": "easy|medium|hard",
      "xp": 10,
      "source_id": "original_source_id"
    }
  ]
}

**Input Questions**:
${JSON.stringify(questions, null, 2)}

CRITICAL:
- Preserve all original IDs exactly
- Ensure explanations are concise (2-3 sentences max)
- Make actionable advice practical and specific
- Output ONLY the JSON object
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Remove markdown code fences if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        const data = JSON.parse(jsonMatch[0]);

        if (!data.questions || data.questions.length !== questions.length) {
            throw new Error(`Expected ${questions.length} questions, got ${data.questions?.length || 0}`);
        }

        return data.questions;

    } catch (error) {
        console.error(`Error upgrading batch:`, error.message);

        // Retry once if it's a parsing error
        if (retryCount < 1) {
            console.log(`Retrying batch...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return upgradeQuestionBatch(questions, genre, retryCount + 1);
        }

        return null;
    }
}

async function upgradeGenre(genreName) {
    const inputPath = `data/lessons/${genreName}.json`;
    const outputPath = `data/lessons/${genreName}_platinum.json`;

    console.log(`\n=== Upgrading ${genreName.toUpperCase()} ===`);

    // Load existing questions
    const existingQuestions = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    console.log(`Loaded ${existingQuestions.length} questions`);

    const upgradedQuestions = [];
    let successCount = 0;
    let failCount = 0;

    // Resume logic: Load existing progress if file exists
    if (fs.existsSync(outputPath)) {
        try {
            const existingData = fs.readFileSync(outputPath, "utf8");
            const parsed = JSON.parse(existingData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                upgradedQuestions.push(...parsed);
                console.log(`🔄 Resuming from ${upgradedQuestions.length} already processed questions.`);
                successCount = upgradedQuestions.length; // Approximate count
            }
        } catch (e) {
            console.log("⚠️ Could not read existing output file, starting fresh.");
        }
    }

    // Process in batches of 10 to respect rate limits
    const batchSize = 10;
    const startIndex = upgradedQuestions.length;

    for (let i = startIndex; i < existingQuestions.length; i += batchSize) {
        const batch = existingQuestions.slice(i, i + batchSize);

        console.log(`\nProcessing questions ${i + 1}-${Math.min(i + batchSize, existingQuestions.length)}...`);

        const upgradedBatch = await upgradeQuestionBatch(batch, genreName);

        if (upgradedBatch) {
            upgradedQuestions.push(...upgradedBatch);
            successCount += upgradedBatch.length;
            console.log(`✅ Upgraded ${upgradedBatch.length} questions`);
        } else {
            // Keep original questions if upgrade fails
            upgradedQuestions.push(...batch);
            failCount += batch.length;
            console.log(`❌ Failed, keeping original ${batch.length} questions`);
        }

        // Incremental Save
        fs.writeFileSync(outputPath, JSON.stringify(upgradedQuestions, null, 2));
        console.log(`💾 Progress saved (${upgradedQuestions.length}/${existingQuestions.length})`);

        // Wait between batches to respect rate limits (10 RPM for Gemini)
        if (i + batchSize < existingQuestions.length) {
            console.log("Waiting 6 seconds before next batch...");
            await new Promise(resolve => setTimeout(resolve, 6000));
        }
    }

    console.log(`\n=== ${genreName.toUpperCase()} Upgrade Complete ===`);
    console.log(`✅ Total questions: ${upgradedQuestions.length}`);
    console.log(`\n📁 Saved to: ${outputPath}`);
}

async function main() {
    const genre = process.argv[2];

    if (!genre) {
        console.error("Usage: node upgrade_content.js <genre>");
        console.error("Example: node upgrade_content.js money");
        process.exit(1);
    }

    await upgradeGenre(genre);
}

main().catch(console.error);
