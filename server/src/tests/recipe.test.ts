import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import { Response } from "express";
import userModel from "../model/userModel";
import recipeModel from "../model/recipeModel";
import embeddingService from "../services/embeddingService";
import recipeService from "../services/recipeService";
import recipeController from "../controllers/recipeController";
import { AuthRequest } from "../middleware/authMiddleware";

// Mock embedding calls so tests are deterministic and do not call external APIs.
let embedCallCount = 0;
jest.spyOn(embeddingService, "embed").mockImplementation(async (text: string) => {
    embedCallCount++;
    const vec = new Array(768).fill(0);
    for (let i = 0; i < text.length; i++) {
        vec[i % 768] += text.charCodeAt(i) / 1000;
    }
    return vec;
});

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
    await mongoose.connection.dropDatabase();
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

        const { req, res, status, json } = makeReqRes({ query: "vegetarian pasta with tomatoes" });
        await recipeController.searchRecipes(req, res);

        expect(searchRecipesSpy).toHaveBeenCalledWith("vegetarian pasta with tomatoes");
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            data: mockRecipes,
            query: "vegetarian pasta with tomatoes",
        });
    });

    test("Search - Fallback to simpleRecipeSearch when searchRecipes throws", async () => {
        jest.spyOn(recipeService, "searchRecipes").mockRejectedValue(new Error("Embedding error"));
        const simpleRecipeSearchSpy = jest.spyOn(recipeService, "simpleRecipeSearch").mockResolvedValue(mockRecipes as any);

        const { req, res, status, json } = makeReqRes({ query: "pasta" });
        await recipeController.searchRecipes(req, res);

        expect(simpleRecipeSearchSpy).toHaveBeenCalledWith("pasta");
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ data: mockRecipes, query: "pasta" })
        );
    });
});
