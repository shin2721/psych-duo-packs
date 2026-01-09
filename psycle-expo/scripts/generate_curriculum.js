const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCurriculum(genre) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert curriculum designer for a psychology learning app.
    Create a detailed curriculum for the "${genre}" genre with exactly 100 units (levels).
    
    The curriculum should progress from beginner to advanced topics.
    Each unit must have a specific topic and a primary academic source (book or key paper).

    Output strictly in JSON format WITHOUT any markdown code fences or extra text:
    {
      "units": [
        { "level": 1, "title": "Topic Name", "source": "Author (Year). Title." },
        { "level": 2, "title": "Topic Name", "source": "Author (Year). Title." },
        ...
        { "level": 100, "title": "Topic Name", "source": "Author (Year). Title." }
      ]
    }

    Example progression for Mental genre:
    - Levels 1-10: Stress & Coping (Lazarus)
    - Levels 11-20: Sleep Hygiene (Walker)
    - Levels 21-30: CBT Basics (Beck)
    - ...
    - Levels 91-100: Advanced Positive Psychology (Seligman)
    
    IMPORTANT: Output ONLY the JSON object, no markdown formatting, no explanation.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("Raw response length:", text.length);

    // Remove markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      fs.writeFileSync('debug_response.txt', text);
      throw new Error("No JSON found in response. Saved to debug_response.txt");
    }

    const curriculum = JSON.parse(jsonMatch[0]);

    fs.writeFileSync(`data/curriculum_${genre}.json`, JSON.stringify(curriculum, null, 2));
    console.log(`✅ Generated curriculum for ${genre} with ${curriculum.units.length} units.`);

  } catch (error) {
    console.error("Error generating curriculum:", error.message);
    if (error instanceof SyntaxError) {
      console.error("JSON parse error at position", error.message);
    }
  }
}

// Get genre from command line argument
const genre = process.argv[2];

if (!genre) {
  console.error("Usage: node generate_curriculum.js <genre>");
  console.error("Example: node generate_curriculum.js Mental");
  process.exit(1);
}

generateCurriculum(genre);
