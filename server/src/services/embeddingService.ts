const GEMINI_EMBEDDING_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent";

interface GeminiEmbeddingResponse {
    embedding: {
        values: number[];
    };
}

class EmbeddingService {
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
