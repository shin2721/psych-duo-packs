
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { join } from "path";

// Load .env
config({ path: join(__dirname, "../../../.env") });

async function test() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Key exists:", !!key);
    if (!key) return;

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        console.log("Testing gemini-1.5-flash...");
        const result = await model.generateContent("Hello, are you working?");
        console.log("Response:", result.response.text());
    } catch (e: any) {
        console.error("Error with gemini-1.5-flash:", e.message);
    }
}

test();
