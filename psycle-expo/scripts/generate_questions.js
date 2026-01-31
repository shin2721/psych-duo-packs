const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get genre from command line argument
const genre = process.argv[2];

if (!genre) {
    console.error("Usage: node generate_questions.js <genre>");
    console.error("Example: node generate_questions.js Mental");
    process.exit(1);
}

// Load curriculum
const curriculum = JSON.parse(fs.readFileSync(`data/curriculum_${genre}.json`, "utf8"));
console.log(`Loaded curriculum for ${genre} with ${curriculum.units.length} units`);

async function generateQuestionsForUnit(unit, retryCount = 0) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert psychology educator creating quiz questions for a learning app.

Generate exactly 10 "Platinum Standard" questions for this unit:
**Level ${unit.level}: ${unit.title}**
**Source**: ${unit.source}

Requirements:
1. **Actionable Advice**: Each question MUST include a "💡 Try this" section with practical application (1-2 sentences).
2. **Citation**: Extract the citation (Author, Year) into a separate field.
3. **Question Types**: You MUST use a wide variety of types. Do not just use multiple_choice.
   - "multiple_choice" (Standard 4-option)
   - "swipe_judgment" (Binary choice: Myth/Fact, True/False)
   - "conversation" (Scenario-based dialogue)
   - "fill_blank_tap" (Terminology recall)
   - "sort_order" (Arrange items in sequence)
   - "matching" (Pair terms with definitions)
   - "select_all" (Select multiple correct options)
   - "quick_reflex" (Rapid decision, time limit)
   - "term_card" (Learn a key term with definition)
   - "consequence_scenario" (Predict outcome of an action)
   - "swipe_choice" (Choose between two options by swiping)
   - "micro_input" (Type a short answer/keyword)
   - "multi_select_triggers" (Identify triggers/causes)

4. **Quality**: Questions should test understanding, not just memorization.
5. **Difficulty**: Mix (3 easy, 5 medium, 2 hard).

Output ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questions": [
    {
      "id": "${genre.toLowerCase()}_l${String(unit.level).padStart(2, '0')}_q01",
      "type": "multiple_choice|swipe_judgment|conversation|fill_blank_tap|sort_order|matching|select_all|quick_reflex|term_card|consequence_scenario|swipe_choice|micro_input|multi_select_triggers",
      "question": "Question text",
      
      // Fields depend on type:
      // multiple_choice, quick_reflex, swipe_choice
      "choices": ["A", "B", "C", "D"], 
      "answer_index": 0, 

      // swipe_judgment
      "correct_answer": "True", 

      // sort_order
      "items": ["Step 1", "Step 2", "Step 3"], 
      "correct_order": [0, 1, 2], 

      // matching
      "left_items": ["Term A", "Term B"], 
      "right_items": ["Def A", "Def B"], 
      "correct_pairs": [[0, 0], [1, 1]], 

      // select_all, multi_select_triggers
      "correct_answers": [0, 2], 

      // quick_reflex
      "time_limit": 5000, 

      // term_card
      "term": "Concept Name",
      "term_en": "English Term",
      "definition": "Definition text...",
      "key_points": ["Point 1", "Point 2"],

      // consequence_scenario
      "consequence_type": "positive|negative",

      // micro_input
      "input_answer": "keyword",
      "placeholder": "Type the term...",

      "explanation": "Concise explanation WITHOUT citation.",
      "actionable_advice": "💡 Try this: Practical tip here.",
      "citation": "Author, Year",
      "difficulty": "easy",
      "xp": 10,
      "source_id": "${genre.toLowerCase()}_l${String(unit.level).padStart(2, '0')}_q01"
    }
  ]
}

CRITICAL: 
- IDs must follow pattern: ${genre.toLowerCase()}_l${String(unit.level).padStart(2, '0')}_q01 through ${genre.toLowerCase()}_l${String(unit.level).padStart(2, '0')}_q10
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
    const outputPath = `data/lessons/${genre.toLowerCase()}_generated_full.json`;
    fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
    console.log(`\n📁 Saved to: ${outputPath}`);
}

generateAllQuestions().catch(console.error);
