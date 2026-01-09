const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load curriculum
const curriculum = JSON.parse(fs.readFileSync("data/curriculum_Mental.json", "utf8"));

async function generateQuestionsForUnit(unit, retryCount = 0) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert psychology educator creating quiz questions for a learning app.

Generate exactly 10 high-quality multiple-choice questions for this unit:
**Level ${unit.level}: ${unit.title}**
**Source**: ${unit.source}

Requirements:
1. Each question must have 4 answer choices
2. Questions should test understanding, not just memorization
3. Include a detailed explanation (2-3 sentences) that cites the academic source
4. Use APA format for citations in explanations
5. Mix difficulty levels (3 easy, 5 medium, 2 hard)

Output ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "id": "mental_l${String(unit.level).padStart(2, '0')}_q01",
      "type": "multiple_choice",
      "question": "Question text here?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "answer_index": 0,
      "explanation": "Explanation with citation (Author, Year).",
      "difficulty": "easy",
      "xp": 10,
      "source_id": "mental_l${String(unit.level).padStart(2, '0')}_q01"
    }
  ]
}

CRITICAL: 
- IDs must follow pattern: mental_l${String(unit.level).padStart(2, '0')}_q01 through mental_l${String(unit.level).padStart(2, '0')}_q10
- Output ONLY the JSON object, nothing else
- Ensure all 10 questions are included
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

        if (!data.questions || data.questions.length !== 10) {
            throw new Error(`Expected 10 questions, got ${data.questions?.length || 0}`);
        }

        return data.questions;

    } catch (error) {
        console.error(`Error generating questions for unit ${unit.level}:`, error.message);

        // Retry once if it's a parsing error
        if (retryCount < 1) {
            console.log(`Retrying unit ${unit.level}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return generateQuestionsForUnit(unit, retryCount + 1);
        }

        return null;
    }
}

async function generateAllQuestions() {
    console.log(`Starting generation for ${curriculum.units.length} units...`);

    const allQuestions = [];
    let successCount = 0;
    let failCount = 0;

    // Process in batches to respect rate limits (10 RPM)
    const batchSize = 5;

    for (let i = 0; i < curriculum.units.length; i += batchSize) {
        const batch = curriculum.units.slice(i, i + batchSize);

        console.log(`\nProcessing units ${i + 1}-${Math.min(i + batchSize, curriculum.units.length)}...`);

        const batchPromises = batch.map(unit => generateQuestionsForUnit(unit));
        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((questions, idx) => {
            if (questions) {
                allQuestions.push(...questions);
                successCount++;
                console.log(`✅ Unit ${batch[idx].level}: ${questions.length} questions`);
            } else {
                failCount++;
                console.log(`❌ Unit ${batch[idx].level}: Failed`);
            }
        });

        // Wait between batches to respect rate limits
        if (i + batchSize < curriculum.units.length) {
            console.log("Waiting 12 seconds before next batch...");
            await new Promise(resolve => setTimeout(resolve, 12000));
        }
    }

    console.log(`\n=== Generation Complete ===`);
    console.log(`✅ Success: ${successCount} units (${allQuestions.length} questions)`);
    console.log(`❌ Failed: ${failCount} units`);

    // Save to file
    const outputPath = "data/lessons/mental_generated_full.json";
    fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
    console.log(`\n📁 Saved to: ${outputPath}`);
}

generateAllQuestions().catch(console.error);
