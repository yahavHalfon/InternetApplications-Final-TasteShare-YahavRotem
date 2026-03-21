import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";
import recipeModel from "../model/recipeModel";

let app: Express;
const testUser = {
    email: "test@user.com",
    password: "testpassword",
};
const testUser2 = {
    email: "test2@user.com",
    password: "testpassword2",
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
        image: "https://example.com/recipe.jpg",
        title: "Test Recipe",
        description: "Test recipe description",
        ingredients: ["1 cup flour"],
        instructions: ["Mix ingredients"],
        cookTime: "25 min",
        servings: 2,
        difficulty: "Easy",
    };

    test("Create Recipe - Success", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .send(recipePayload);
        expect(response.statusCode).toBe(201);
        expect(response.body.userId).toBe(userId);
        recipeId = response.body._id;
    });

    test("Create Recipe - Fail (No Auth)", async () => {
        const response = await request(app).post("/recipes").send(recipePayload);
        expect(response.statusCode).toBe(401);
    });

    test("Create Recipe - Fail (Validation Error)", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                // Missing required recipe fields
            });
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
