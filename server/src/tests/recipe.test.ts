import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import { Response } from "express";
import userModel from "../model/userModel";
import recipeModel from "../model/recipeModel";
import commentModel from "../model/commentModel";
import embeddingService from "../services/embeddingService";
import recipeService from "../services/recipeService";
import recipeController from "../controllers/recipeController";
import { AuthRequest } from "../middleware/authMiddleware";

let embedCallCount = 0;
jest.spyOn(embeddingService, "embed").mockImplementation(async (text: string) => {
    embedCallCount++;
    const vec = new Array(768).fill(0);
    for (let i = 0; i < text.length; i++) {
        vec[i % 768] += text.charCodeAt(i) / 1000;
    }
    return vec;
});

jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue([]);

let app: Express;
const testUser = {
    email: "test@user.com",
    password: "testpassword",
    username: "testrecipeuser1",
};
const testUser2 = {
    email: "test2@user.com",
    password: "testpassword2",
    username: "testrecipeuser2",
};

let accessToken: string;
let accessToken2: string;
let userId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await recipeModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Recipe Tests", () => {

    test("Auth Setup: Register User 1", async () => {
        const response = await request(app).post("/auth/register").send(testUser);
        expect(response.statusCode).toBe(201);
        accessToken = response.body.token;
        const user = await userModel.findOne({ email: testUser.email });
        userId = user?._id.toString() || "";
    });

    test("Auth Setup: Register User 2", async () => {
        const response = await request(app).post("/auth/register").send(testUser2);
        expect(response.statusCode).toBe(201);
        accessToken2 = response.body.token;
    });


    let recipeId: string;

    const recipePayload = {
        title: "Test Recipe",
        description: "Test recipe description",
        ingredients: JSON.stringify(["1 cup flour"]),
        instructions: JSON.stringify(["Mix ingredients"]),
        cookTime: "25 min",
        servings: "2",
        difficulty: "Easy",
    };

    test("Create Recipe - Success", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", recipePayload.title)
            .field("description", recipePayload.description)
            .field("ingredients", recipePayload.ingredients)
            .field("instructions", recipePayload.instructions)
            .field("cookTime", recipePayload.cookTime)
            .field("servings", recipePayload.servings)
            .field("difficulty", recipePayload.difficulty)
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");
        expect(response.statusCode).toBe(201);
        expect(response.body.userId).toBe(userId);
        recipeId = response.body._id;
    });

    test("Create Recipe - Fail (No Auth)", async () => {
        const response = await request(app)
            .post("/recipes")
            .field("title", recipePayload.title)
            .field("description", recipePayload.description)
            .field("ingredients", recipePayload.ingredients)
            .field("instructions", recipePayload.instructions)
            .field("cookTime", recipePayload.cookTime)
            .field("servings", recipePayload.servings)
            .field("difficulty", recipePayload.difficulty)
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");
        expect(response.statusCode).toBe(401);
    });

    test("Create Recipe - Fail (Validation Error)", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "Only title")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");
        expect(response.statusCode).toBe(400);
    });

    test("Create Recipe - Fail (Image Too Large)", async () => {
        const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1); // 5 MB + 1 byte
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "Big Image Recipe")
            .field("description", "Test description")
            .field("ingredients", JSON.stringify(["ingredient"]))
            .field("instructions", JSON.stringify(["step"]))
            .field("cookTime", "10 min")
            .field("servings", "1")
            .field("difficulty", "Easy")
            .attach("image", oversizedBuffer, "recipe.jpg");
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Image is too large. Max size is 5 MB.");
    });

    test("Create Recipe - Fail (Invalid Image Type)", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "Bad Type Recipe")
            .field("description", "Test description")
            .field("ingredients", JSON.stringify(["ingredient"]))
            .field("instructions", JSON.stringify(["step"]))
            .field("cookTime", "10 min")
            .field("servings", "1")
            .field("difficulty", "Easy")
            .attach("image", Buffer.from("fake-data"), { filename: "recipe.pdf", contentType: "application/pdf" });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toMatch(/only image files/i);
    });

    test("Get All Recipes", async () => {
        const response = await request(app).get("/recipes");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(typeof response.body.page).toBe("number");
        expect(typeof response.body.limit).toBe("number");
        expect(typeof response.body.total).toBe("number");
        expect(typeof response.body.hasMore).toBe("boolean");
    });

    test("Get Recipe By ID - Success", async () => {
        const response = await request(app).get("/recipes/" + recipeId);
        expect(response.statusCode).toBe(200);
    });

    test("Get Recipe By ID - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get("/recipes/" + nonExistentId);
        expect(response.statusCode).toBe(404);
    });

    test("Get Recipe By ID - Fail (Invalid ID Format)", async () => {
        const response = await request(app).get("/recipes/invalid-id-123");
        expect(response.statusCode).toBe(400); // BaseController handles CastError
    });


    test("Update Recipe - Success", async () => {
        const response = await request(app)
            .put("/recipes/" + recipeId)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                title: "Updated Title",
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe("Updated Title");
    });

    test("Update Recipe - Fail (Not Owner)", async () => {
        const response = await request(app)
            .put("/recipes/" + recipeId)
            .set("Authorization", "Bearer " + accessToken2)
            .send({
                title: "Hacked Title",
            });
        expect(response.statusCode).toBe(403);
    });

    test("Update Recipe - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put("/recipes/" + nonExistentId)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                title: "Updated Title",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Update Recipe - Fail (Invalid ID Format)", async () => {
        const response = await request(app)
            .put("/recipes/invalid-id-123")
            .set("Authorization", "Bearer " + accessToken)
            .send({ title: "Updated Title" });
        expect(response.statusCode).toBe(400);
    });


    test("Delete Recipe - Fail (Not Owner)", async () => {
        const response = await request(app)
            .delete("/recipes/" + recipeId)
            .set("Authorization", "Bearer " + accessToken2);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Recipe - Fail (Invalid ID Format)", async () => {
        const response = await request(app)
            .delete("/recipes/invalid-id-123")
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(400);
    });

    test("Delete Recipe - Success", async () => {
        const response = await request(app)
            .delete("/recipes/" + recipeId)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
    });

    test("Delete Recipe - Fail (Not Found)", async () => {
        const response = await request(app)
            .delete("/recipes/" + recipeId)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(404);
    });


});

describe("Recipe Search Integration Tests", () => {
    const createSearchRecipe = (title: string, description: string, ingredients: string[]) =>
        request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", title)
            .field("description", description)
            .field("ingredients", JSON.stringify(ingredients))
            .field("instructions", JSON.stringify(["Step 1", "Step 2"]))
            .field("cookTime", "30 min")
            .field("servings", "2")
            .field("difficulty", "Easy")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");

    beforeAll(async () => {
        await createSearchRecipe(
            "Vegetarian Pasta Primavera",
            "A light and fresh pasta dish with seasonal vegetables",
            ["pasta", "tomatoes", "zucchini", "olive oil"]
        );

        await createSearchRecipe(
            "Classic Beef Burger",
            "A juicy homemade beef burger with all the toppings",
            ["beef patty", "bun", "cheese", "lettuce", "tomato"]
        );

        await createSearchRecipe(
            "Chocolate Lava Cake",
            "Warm chocolate dessert with a gooey molten center",
            ["dark chocolate", "butter", "eggs", "flour", "sugar"]
        );
    });

    test("Search - Fail (No Auth)", async () => {
        const response = await request(app).post("/recipes/search").send({ query: "pasta" });
        expect(response.statusCode).toBe(401);
    });

    test("Search - Fail (Invalid token)", async () => {
        const response = await request(app)
            .post("/recipes/search")
            .set("Authorization", "Bearer invalidtoken")
            .send({ query: "pasta" });
        expect(response.statusCode).toBe(401);
    });

    test("Search - Fail (Missing query)", async () => {
        const response = await request(app)
            .post("/recipes/search")
            .set("Authorization", "Bearer " + accessToken)
            .send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBeDefined();
    });

    test("Search - Fail (Empty query)", async () => {
        const response = await request(app)
            .post("/recipes/search")
            .set("Authorization", "Bearer " + accessToken)
            .send({ query: "" });
        expect(response.statusCode).toBe(400);
    });

    test("Search - Success (returns results)", async () => {
        const response = await request(app)
            .post("/recipes/search")
            .set("Authorization", "Bearer " + accessToken)
            .send({ query: "pasta" });
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("Search - Success (response shape)", async () => {
        const response = await request(app)
            .post("/recipes/search")
            .set("Authorization", "Bearer " + accessToken)
            .send({ query: "chocolate dessert" });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("data");
        expect(response.body).toHaveProperty("query", "chocolate dessert");
    });

    test("Search - Success (embeddingService.embed was called)", async () => {
        const countBefore = embedCallCount;
        await request(app)
            .post("/recipes/search")
            .set("Authorization", "Bearer " + accessToken)
            .send({ query: "quick dinner" });
        expect(embedCallCount).toBeGreaterThan(countBefore);
    });
});

describe("Recipe Search Controller Unit Tests", () => {
    const mockRecipes = [
        { _id: "1", title: "Vegetarian Pasta", description: "Tasty pasta", commentsCount: 0 },
    ];

    function makeReqRes(body: object) {
        const req = { body } as AuthRequest;
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { status, json } as unknown as Response;
        return { req, res, json, status };
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("Search - Fail (Missing query)", async () => {
        const { req, res, status, json } = makeReqRes({});
        await recipeController.searchRecipes(req, res);
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "Query is required" });
    });

    test("Search - Fail (Empty string query)", async () => {
        const { req, res, status, json } = makeReqRes({ query: "   " });
        await recipeController.searchRecipes(req, res);
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "Query cannot be empty" });
    });

    test("Search - Fail (Query too long)", async () => {
        const { req, res, status, json } = makeReqRes({ query: "a".repeat(501) });
        await recipeController.searchRecipes(req, res);
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "Query is too long" });
    });

    test("Search - Success", async () => {
        const searchRecipesSpy = jest.spyOn(recipeService, "searchRecipes").mockResolvedValue(mockRecipes as any);
        jest.spyOn(recipeService, "simpleRecipeSearch").mockResolvedValue(mockRecipes as any);
        jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue([]);

        const { req, res, status, json } = makeReqRes({ query: "vegetarian pasta with tomatoes" });
        await recipeController.searchRecipes(req, res);

        expect(searchRecipesSpy).toHaveBeenCalledWith("vegetarian pasta with tomatoes");
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            data: mockRecipes,
            query: "vegetarian pasta with tomatoes",
            aiSuggestions: [],
        });
    });

    test("Search - generateAi: false skips RAG", async () => {
        jest.spyOn(recipeService, "searchRecipes").mockResolvedValue(mockRecipes as any);
        const generateRecipesSpy = jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue([]);

        const { req, res, status, json } = makeReqRes({ query: "pasta", generateAi: false });
        await recipeController.searchRecipes(req, res);

        expect(generateRecipesSpy).not.toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ aiSuggestions: [] })
        );
    });

    test("Search - generateAi: true calls RAG with recipes", async () => {
        const fakeAi = [{ title: "AI Recipe", description: "d", ingredients: [], instructions: [], cookTime: "10m", servings: 2, difficulty: "Easy" as const }];
        jest.spyOn(recipeService, "searchRecipes").mockResolvedValue(mockRecipes as any);
        const generateRecipesSpy = jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue(fakeAi);

        const { req, res, status, json } = makeReqRes({ query: "pasta", generateAi: true });
        await recipeController.searchRecipes(req, res);

        expect(generateRecipesSpy).toHaveBeenCalledWith("pasta", mockRecipes);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ aiSuggestions: fakeAi })
        );
    });

    test("Search - omitted generateAi defaults to AI enabled", async () => {
        jest.spyOn(recipeService, "searchRecipes").mockResolvedValue(mockRecipes as any);
        const generateRecipesSpy = jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue([]);

        const { req, res } = makeReqRes({ query: "pasta" });
        await recipeController.searchRecipes(req, res);

        expect(generateRecipesSpy).toHaveBeenCalled();
    });

    test("Search - generateAi: true with empty recipes still calls RAG", async () => {
        jest.spyOn(recipeService, "searchRecipes").mockResolvedValue([]);
        jest.spyOn(recipeService, "simpleRecipeSearch").mockResolvedValue([]);
        const generateRecipesSpy = jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue([]);

        const { req, res, status } = makeReqRes({ query: "xkcd12345gibberish", generateAi: true });
        await recipeController.searchRecipes(req, res);

        expect(generateRecipesSpy).toHaveBeenCalledWith("xkcd12345gibberish", []);
        expect(status).toHaveBeenCalledWith(200);
    });

    test("Search - Fail (generateAi non-boolean)", async () => {
        const { req, res, status, json } = makeReqRes({ query: "pasta", generateAi: "yes" });
        await recipeController.searchRecipes(req, res);
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "generateAi must be a boolean" });
    });

    test("Search - Fallback to simpleRecipeSearch when searchRecipes throws", async () => {
        jest.spyOn(recipeService, "searchRecipes").mockRejectedValue(new Error("Embedding error"));
        const simpleRecipeSearchSpy = jest.spyOn(recipeService, "simpleRecipeSearch").mockResolvedValue(mockRecipes as any);
        jest.spyOn(embeddingService, "generateRecipes").mockResolvedValue([]);

        const { req, res, status, json } = makeReqRes({ query: "pasta" });
        await recipeController.searchRecipes(req, res);

        expect(simpleRecipeSearchSpy).toHaveBeenCalledWith("pasta");
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ data: mockRecipes, query: "pasta" })
        );
    });
});

describe("Recipe Like/Unlike Tests", () => {
    let likeRecipeId: string;

    const createLikeRecipe = () =>
        request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "Like Test Recipe")
            .field("description", "Recipe for testing like/unlike")
            .field("ingredients", JSON.stringify(["ingredient"]))
            .field("instructions", JSON.stringify(["step"]))
            .field("cookTime", "10 min")
            .field("servings", "1")
            .field("difficulty", "Easy")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");

    beforeAll(async () => {
        const response = await createLikeRecipe();
        likeRecipeId = response.body._id;
    });

    test("Like Recipe - Success", async () => {
        const response = await request(app)
            .post(`/recipes/${likeRecipeId}/like`)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.likedBy)).toBe(true);
        expect(response.body.likedBy).toContain(userId);
    });

    test("Unlike Recipe (toggle) - Success", async () => {
        const response = await request(app)
            .post(`/recipes/${likeRecipeId}/like`)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.likedBy).not.toContain(userId);
    });

    test("Like by different user - Success", async () => {
        const response = await request(app)
            .post(`/recipes/${likeRecipeId}/like`)
            .set("Authorization", "Bearer " + accessToken2);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.likedBy)).toBe(true);
    });

    test("Multiple users can like same recipe", async () => {
        await request(app)
            .post(`/recipes/${likeRecipeId}/like`)
            .set("Authorization", "Bearer " + accessToken);
        const response = await request(app).get(`/recipes/${likeRecipeId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.likedBy.length).toBeGreaterThanOrEqual(2);
    });

    test("Like Recipe - Fail (No Auth)", async () => {
        const response = await request(app).post(`/recipes/${likeRecipeId}/like`);
        expect(response.statusCode).toBe(401);
    });

    test("Like Recipe - Fail (Invalid Token)", async () => {
        const response = await request(app)
            .post(`/recipes/${likeRecipeId}/like`)
            .set("Authorization", "Bearer invalidtoken");
        expect(response.statusCode).toBe(401);
    });

    test("Like Recipe - Fail (Invalid ID Format)", async () => {
        const response = await request(app)
            .post("/recipes/invalid-id-123/like")
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(400);
    });

    test("Like Recipe - Fail (Recipe Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post(`/recipes/${nonExistentId}/like`)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(404);
    });
});

describe("Get My Recipes Tests", () => {
    beforeAll(async () => {
        // Create a recipe owned by user1 for this suite
        await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "My Recipe 1")
            .field("description", "First personal recipe")
            .field("ingredients", JSON.stringify(["ingredient"]))
            .field("instructions", JSON.stringify(["step"]))
            .field("cookTime", "15 min")
            .field("servings", "2")
            .field("difficulty", "Easy")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");

        await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "My Recipe 2")
            .field("description", "Second personal recipe")
            .field("ingredients", JSON.stringify(["ingredient"]))
            .field("instructions", JSON.stringify(["step"]))
            .field("cookTime", "20 min")
            .field("servings", "4")
            .field("difficulty", "Medium")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");
    });

    test("Get My Recipes - Success (returns only user's recipes)", async () => {
        const response = await request(app)
            .get("/recipes/me")
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        response.body.data.forEach((recipe: { userId: string }) => {
            expect(recipe.userId).toBe(userId);
        });
    });

    test("Get My Recipes - Success (empty for user with no recipes)", async () => {
        // Register a brand new user with no recipes
        const newUser = { email: "norecipes@example.com", password: "password123", username: "norecipesuser" };
        const regResponse = await request(app).post("/auth/register").send(newUser);
        const newToken = regResponse.body.token;

        const response = await request(app)
            .get("/recipes/me")
            .set("Authorization", "Bearer " + newToken);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(0);
    });

    test("Get My Recipes - Success (sorted by createdAt desc)", async () => {
        const response = await request(app)
            .get("/recipes/me")
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
        const recipes = response.body.data;
        for (let i = 0; i < recipes.length - 1; i++) {
            expect(new Date(recipes[i].createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(recipes[i + 1].createdAt).getTime()
            );
        }
    });

    test("Get My Recipes - Fail (No Auth)", async () => {
        const response = await request(app).get("/recipes/me");
        expect(response.statusCode).toBe(401);
    });

    test("Get My Recipes - Fail (Invalid Token)", async () => {
        const response = await request(app)
            .get("/recipes/me")
            .set("Authorization", "Bearer invalidtoken");
        expect(response.statusCode).toBe(401);
    });
});

describe("Recipe Service Tests", () => {
    const DIMS = 768;
    const vecA: number[] = new Array(DIMS).fill(0);
    vecA[0] = 1;
    const vecB: number[] = new Array(DIMS).fill(0);
    vecB[1] = 1;
    const vecC: number[] = new Array(DIMS).fill(0);
    vecC[0] = 0.6;
    vecC[1] = 0.8;

    const baseRecipe = () => ({
        userId: new mongoose.Types.ObjectId(userId),
        title: "Service Test Recipe",
        description: "A recipe used in service layer tests",
        ingredients: ["ingredient"],
        instructions: ["step"],
        cookTime: "10 min",
        servings: 1,
        difficulty: "Easy" as const,
        image: "/uploads/recipes/test.jpg",
        likedBy: [] as mongoose.Types.ObjectId[],
        embedding: [...vecA],
    });

    beforeEach(async () => {
        await recipeModel.deleteMany();
        await commentModel.deleteMany();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("searchRecipes", () => {
        test("returns recipe above similarity threshold (score 1.0)", async () => {
            await recipeModel.create(baseRecipe());
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results.length).toBe(1);
            expect(results[0].title).toBe("Service Test Recipe");
        });

        test("filters out recipe below similarity threshold (score 0)", async () => {
            await recipeModel.create(baseRecipe());
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecB]);

            const results = await recipeService.searchRecipes("query");

            expect(results.length).toBe(0);
        });

        test("zero-vector embedding produces similarity 0 (filtered out)", async () => {
            const zeroVec = new Array(DIMS).fill(0);
            await recipeModel.create({ ...baseRecipe(), embedding: zeroVec });
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results.length).toBe(0);
        });

        test("results sorted by score descending", async () => {
            await recipeModel.create({ ...baseRecipe(), title: "Recipe A", embedding: [...vecA] });
            await recipeModel.create({ ...baseRecipe(), title: "Recipe B", embedding: [...vecC] });
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results.length).toBe(2);
            expect(results[0].title).toBe("Recipe A");
            expect(results[1].title).toBe("Recipe B");
        });

        test("strips embedding field from results", async () => {
            await recipeModel.create(baseRecipe());
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results.length).toBe(1);
            expect(results[0]).not.toHaveProperty("embedding");
        });

        test("commentsCount is 0 when recipe has no comments", async () => {
            await recipeModel.create(baseRecipe());
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results[0].commentsCount).toBe(0);
        });

        test("commentsCount reflects actual comment count", async () => {
            const recipe = await recipeModel.create(baseRecipe());
            await commentModel.create({ recipeId: recipe._id, userId: recipe.userId, text: "Great!" });
            await commentModel.create({ recipeId: recipe._id, userId: recipe.userId, text: "Delicious!" });
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results[0].commentsCount).toBe(2);
        });

        test("limits results to 10 when more than 10 recipes match", async () => {
            await Promise.all(
                Array.from({ length: 12 }, (_, i) =>
                    recipeModel.create({ ...baseRecipe(), title: `Recipe ${i}` })
                )
            );
            jest.spyOn(embeddingService, "embed").mockResolvedValueOnce([...vecA]);

            const results = await recipeService.searchRecipes("query");

            expect(results.length).toBe(10);
        });
    });

    describe("simpleRecipeSearch", () => {
        test("matches by title (case-insensitive)", async () => {
            await recipeModel.create({ ...baseRecipe(), title: "Spaghetti Carbonara" });

            const results = await recipeService.simpleRecipeSearch("spaghetti");

            expect(results.length).toBe(1);
            expect(results[0].title).toBe("Spaghetti Carbonara");
        });

        test("matches by description (case-insensitive)", async () => {
            await recipeModel.create({ ...baseRecipe(), description: "Rich chocolate ganache filling" });

            const results = await recipeService.simpleRecipeSearch("chocolate");

            expect(results.length).toBe(1);
            expect(results[0].description).toBe("Rich chocolate ganache filling");
        });

        test("returns empty array when no recipes match", async () => {
            await recipeModel.create(baseRecipe());

            const results = await recipeService.simpleRecipeSearch("xyznomatchqwerty99999");

            expect(results).toEqual([]);
        });

        test("commentsCount reflects actual comment count", async () => {
            const recipe = await recipeModel.create({ ...baseRecipe(), title: "Unique Comment Recipe" });
            await commentModel.create({ recipeId: recipe._id, userId: recipe.userId, text: "Nice!" });

            const results = await recipeService.simpleRecipeSearch("Unique Comment Recipe");

            expect(results.length).toBe(1);
            expect(results[0].commentsCount).toBe(1);
        });

        test("limits results to 10 when more than 10 recipes match", async () => {
            await Promise.all(
                Array.from({ length: 12 }, (_, i) =>
                    recipeModel.create({ ...baseRecipe(), title: `Limittest Recipe ${i}` })
                )
            );

            const results = await recipeService.simpleRecipeSearch("Limittest");

            expect(results.length).toBe(10);
        });
    });
});
