
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { join } from "path";

// Load .env
config({ path: join(__dirname, "../../../.env") });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No key");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json() as { models?: { name: string; displayName: string }[] };
        console.log("Available Models:");
        (data.models || []).forEach((m) => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
