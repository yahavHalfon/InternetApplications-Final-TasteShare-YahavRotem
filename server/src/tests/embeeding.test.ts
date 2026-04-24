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
