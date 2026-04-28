const GEMINI_EMBEDDING_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent";

const GEMINI_GENERATE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent";

export interface AiGeneratedRecipe {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    cookTime: string;
    servings: number;
    difficulty: "Easy" | "Medium" | "Advanced";
}

interface GeminiEmbeddingResponse {
    embedding: {
        values: number[];
    };
}

interface GeminiGenerateResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

class EmbeddingService {
    async generateRecipes(query: string, contextRecipes: object[]): Promise<AiGeneratedRecipe[]> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        const formattedRecipes = contextRecipes
            .map((r) => {
                const recipe = r as { title?: string; description?: string; cookTime?: string; difficulty?: string };
                return `- ${recipe.title}: ${recipe.description} (${recipe.cookTime}, ${recipe.difficulty})`;
            })
            .join("\n");

        const recipeStructure = JSON.stringify(
            [
                {
                    title: "string",
                    description: "string",
                    ingredients: ["string"],
                    instructions: ["string"],
                    cookTime: "string",
                    servings: "number",
                    difficulty: "Easy | Medium | Advanced",
                },
            ],
            null,
            2
        );

        const contextSection =
            contextRecipes.length > 0
                ? `Here are some existing recipes from our database related to that search:\n${formattedRecipes}\nBased on the user's search and taking inspiration from the provided recipes, generate exactly 2 brand new, unique recipes.`
                : `No existing recipes are available for inspiration — generate exactly 2 brand new, unique recipes based on the user query alone.`;

        const prompt = `You are a world-class chef. The user searched for "${query}".
${contextSection}
You must respond ONLY in valid JSON using the following structure:
${recipeStructure}`;

        const url = `${GEMINI_GENERATE_URL}?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini generate API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as GeminiGenerateResponse;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        return JSON.parse(jsonText) as AiGeneratedRecipe[];
    }

    async embed(text: string): Promise<number[]> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        const url = `${GEMINI_EMBEDDING_URL}?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: { parts: [{ text }] },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini embedding API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as GeminiEmbeddingResponse;
        return data.embedding.values;
    }
}

export default new EmbeddingService();
