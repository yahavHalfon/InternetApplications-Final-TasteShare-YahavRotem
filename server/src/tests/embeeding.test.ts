import embeddingService from "../services/embeddingService";

const originalFetch = global.fetch;
const originalEnv = process.env.GEMINI_API_KEY;

beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-api-key";
});

afterEach(() => {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalEnv;
});

describe("EmbeddingService - generateRecipes", () => {
    const fakeRecipes = [
        { title: "AI Recipe", description: "Desc", cookTime: "10m", difficulty: "Easy" },
    ];
    const aiResponse = [
        { title: "New Recipe", description: "d", ingredients: ["x"], instructions: ["y"], cookTime: "5m", servings: 2, difficulty: "Easy" },
    ];

    function mockFetchForGenerate(responseData: object) {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify(responseData) }] } }],
            }),
        });
    }

    test("generateRecipes - with context uses inspiration prompt", async () => {
        mockFetchForGenerate(aiResponse);
        await embeddingService.generateRecipes("pasta", fakeRecipes);
        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        const text: string = body.contents[0].parts[0].text;
        expect(text).toContain("Here are some existing recipes");
        expect(text).not.toContain("No existing recipes are available");
    });

    test("generateRecipes - empty context uses query-only prompt", async () => {
        mockFetchForGenerate(aiResponse);
        await embeddingService.generateRecipes("pasta", []);
        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        const text: string = body.contents[0].parts[0].text;
        expect(text).toContain("No existing recipes are available");
        expect(text).not.toContain("Here are some existing recipes");
    });

    test("generateRecipes - throws on API error", async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Service Unavailable" });
        await expect(embeddingService.generateRecipes("pasta", [])).rejects.toThrow(
            "Gemini generate API error: 503 Service Unavailable"
        );
    });

    test("generateRecipes - throws when GEMINI_API_KEY is missing", async () => {
        delete process.env.GEMINI_API_KEY;
        await expect(embeddingService.generateRecipes("pasta", [])).rejects.toThrow(
            "GEMINI_API_KEY is not configured"
        );
    });
});

describe("EmbeddingService", () => {

    test("embed - returns number array on success", async () => {
        const fakeValues = [0.1, 0.2, 0.3];

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ embedding: { values: fakeValues } }),
        });

        const result = await embeddingService.embed("test text");

        expect(result).toEqual(fakeValues);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("embed - throws on API error", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
        });

        await expect(embeddingService.embed("test text")).rejects.toThrow(
            "Gemini embedding API error: 500 Internal Server Error"
        );
    });

    test("embed - throws when GEMINI_API_KEY is missing", async () => {
        delete process.env.GEMINI_API_KEY;

        await expect(embeddingService.embed("test text")).rejects.toThrow(
            "GEMINI_API_KEY is not configured"
        );
    });

});
