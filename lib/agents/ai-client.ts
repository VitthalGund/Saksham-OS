// lib/agents/ai-client.ts

export type GemResponse = {
    text: string;
    raw?: any;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function callGemini(prompt: string, maxTokens = 400): Promise<GemResponse> {
    if (!GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing. Returning mock response.");
        return { text: "LLM_DISABLED: Please provide GEMINI_API_KEY" };
    }

    // Use gemini-1.5-flash for speed and cost
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: 0.2,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API Error (${response.status}):`, errorText);
            return { text: `Error: Gemini API returned ${response.status}` };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return { text, raw: data };

    } catch (error) {
        console.error("Failed to call Gemini API:", error);
        return { text: "Error: Failed to call AI service" };
    }
}
