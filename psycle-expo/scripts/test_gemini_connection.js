const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testConnection() {
    console.log("Testing Gemini API connection...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No GEMINI_API_KEY found in .env");
        return;
    }
    console.log("API Key found (length: " + apiKey.length + ")");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Reply with 'OK' if you can read this.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ API Response:", text.trim());
    } catch (error) {
        console.error("❌ API Error:", error.message);
        if (error.message.includes("429")) {
            console.error("⚠️ Quota exceeded (429)");
        }
    }
}

testConnection();
