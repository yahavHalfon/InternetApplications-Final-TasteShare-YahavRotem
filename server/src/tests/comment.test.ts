import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";
import recipeModel from "../model/recipeModel";
import commentModel from "../model/commentModel";

let app: Express;
const testUser = {
    email: "test@user.com",
    password: "testpassword",
    username: "testuserone",
};

let accessToken: string;
let recipeId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await recipeModel.deleteMany();
    await commentModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Comment Tests", () => {

    test("Auth Setup: Register User 1", async () => {
        const response = await request(app).post("/auth/register").send(testUser);
        expect(response.statusCode).toBe(201);
        accessToken = response.body.token;
    });

    test("Recipe Setup: Create Test Recipe", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "Test Recipe for Comments")
            .field("description", "This recipe will be used for comment tests")
            .field("ingredients", JSON.stringify(["1 cup flour"]))
            .field("instructions", JSON.stringify(["Mix ingredients"]))
            .field("cookTime", "25 min")
            .field("servings", "2")
            .field("difficulty", "Easy")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");
        expect(response.statusCode).toBe(201);
        recipeId = response.body._id;
    });


    test("Create Recipe Comment (Recipe Route) - Success", async () => {
        const response = await request(app)
            .post(`/recipes/${recipeId}/comments`)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                text: "Comment through recipe route",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.recipeId).toBe(recipeId);
        expect(response.body.text).toBe("Comment through recipe route");
        expect(response.body.author).toBeDefined();
        expect(typeof response.body.author.name).toBe("string");
        expect(typeof response.body.createdAt).toBe("string");
    });

    test("Create Recipe Comment (Recipe Route) - Fail (No Auth)", async () => {
        const response = await request(app)
            .post(`/recipes/${recipeId}/comments`)
            .send({
                text: "No auth",
            });

        expect(response.statusCode).toBe(401);
    });

    test("Create Recipe Comment (Recipe Route) - Fail (Missing text)", async () => {
        const response = await request(app)
            .post(`/recipes/${recipeId}/comments`)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                text: "   ",
            });

        expect(response.statusCode).toBe(400);
    });

    test("Get Recipe Comments (Recipe Route) - Success", async () => {
        const response = await request(app).get(`/recipes/${recipeId}/comments`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].author).toBeDefined();
        expect(typeof response.body[0].author.name).toBe("string");
        expect(typeof response.body[0].createdAt).toBe("string");
    });

    test("Get Recipe Comments (Recipe Route) - Fail (Recipe not found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/recipes/${nonExistentId}/comments`);

        expect(response.statusCode).toBe(404);
    });

    test("Create Recipe Comment (Recipe Route) - Fail (Recipe not found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post(`/recipes/${nonExistentId}/comments`)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                text: "Should fail",
            });

        expect(response.statusCode).toBe(404);
    });

    test("Get Recipe Comments - Empty list for new recipe", async () => {
        // Create a fresh recipe with no comments
        const createResponse = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .field("title", "Empty Comments Recipe")
            .field("description", "No comments here yet")
            .field("ingredients", JSON.stringify(["item"]))
            .field("instructions", JSON.stringify(["step"]))
            .field("cookTime", "5 min")
            .field("servings", "1")
            .field("difficulty", "Easy")
            .attach("image", Buffer.from("fake-image-data"), "recipe.jpg");
        const emptyRecipeId = createResponse.body._id;

        const response = await request(app).get(`/recipes/${emptyRecipeId}/comments`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    test("Get Recipe Comments - Fail (Invalid Recipe ID Format)", async () => {
        const response = await request(app).get("/recipes/invalid-id-format/comments");
        expect(response.statusCode).toBe(400);
    });

    test("Multiple Comments on Same Recipe", async () => {
        await request(app)
            .post(`/recipes/${recipeId}/comments`)
            .set("Authorization", "Bearer " + accessToken)
            .send({ text: "Second comment" });
        await request(app)
            .post(`/recipes/${recipeId}/comments`)
            .set("Authorization", "Bearer " + accessToken)
            .send({ text: "Third comment" });

        const response = await request(app).get(`/recipes/${recipeId}/comments`);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    test("Comment Author Info Is Populated", async () => {
        const response = await request(app).get(`/recipes/${recipeId}/comments`);
        expect(response.statusCode).toBe(200);
        expect(response.body[0].author).toBeDefined();
        expect(typeof response.body[0].author.name).toBe("string");
        expect(response.body[0].author).toHaveProperty("avatarUrl");
    });

    test("Create Comment With Long Text - Success", async () => {
        const longText = "A".repeat(500);
        const response = await request(app)
            .post(`/recipes/${recipeId}/comments`)
            .set("Authorization", "Bearer " + accessToken)
            .send({ text: longText });
        expect(response.statusCode).toBe(201);
        expect(response.body.text).toBe(longText);
    });
});


