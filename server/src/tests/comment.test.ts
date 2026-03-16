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
};
const testUser2 = {
    email: "test2@user.com",
    password: "testpassword2",
};

let accessToken: string;
let accessToken2: string;
let userId: string;
let recipeId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await recipeModel.deleteMany();
    await commentModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Comment Tests", () => {

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

    test("Recipe Setup: Create Test Recipe", async () => {
        const response = await request(app)
            .post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                image: "https://example.com/recipe.jpg",
                title: "Test Recipe for Comments",
                description: "This recipe will be used for comment tests",
                ingredients: ["1 cup flour"],
                instructions: ["Mix ingredients"],
                cookTime: "25 min",
                servings: 2,
                difficulty: "Easy",
            });
        expect(response.statusCode).toBe(201);
        recipeId = response.body._id;
    });


    let commentId: string;

    test("Create Comment - Success", async () => {
        const response = await request(app)
            .post("/comments")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                recipeId: recipeId,
                text: "Test Comment",
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.userId).toBe(userId);
        expect(response.body.recipeId).toBe(recipeId);
        commentId = response.body._id;
    });

    test("Create Comment - Fail (No Auth)", async () => {
        const response = await request(app).post("/comments").send({
            recipeId: recipeId,
            text: "Test Comment",
        });
        expect(response.statusCode).toBe(401);
    });

    test("Create Comment - Fail (Recipe Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post("/comments")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                recipeId: nonExistentId,
                text: "Test Comment",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Create Comment - Fail (Invalid Recipe ID)", async () => {
        const response = await request(app)
            .post("/comments")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                recipeId: "invalid-id-123",
                text: "Test Comment",
            });
        // BaseController/CommentController handles CastError -> 400
        expect(response.statusCode).toBe(400);
    });


    test("Get All Comments", async () => {
        const response = await request(app).get("/comments");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("Get Comment By ID - Success", async () => {
        const response = await request(app).get("/comments/" + commentId);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(commentId);
    });

    test("Get Comment By ID - Fail (Invalid ID)", async () => {
        const response = await request(app).get("/comments/invalid-id-123");
        expect(response.statusCode).toBe(400);
    });


    test("Update Comment - Success", async () => {
        const response = await request(app)
            .put("/comments/" + commentId)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                text: "Updated Comment",
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.text).toBe("Updated Comment");
    });

    test("Update Comment - Fail (Not Owner)", async () => {
        const response = await request(app)
            .put("/comments/" + commentId)
            .set("Authorization", "Bearer " + accessToken2)
            .send({
                text: "Hacked Comment",
            });
        expect(response.statusCode).toBe(403);
    });

    test("Update Comment - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put("/comments/" + nonExistentId)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                text: "Updated Comment",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Update Comment - Fail (Invalid ID)", async () => {
        const response = await request(app)
            .put("/comments/invalid-id-123")
            .set("Authorization", "Bearer " + accessToken)
            .send({ text: "Updated" });
        expect(response.statusCode).toBe(400);
    });


    test("Delete Comment - Fail (Not Owner)", async () => {
        const response = await request(app)
            .delete("/comments/" + commentId)
            .set("Authorization", "Bearer " + accessToken2);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Comment - Fail (Invalid ID)", async () => {
        const response = await request(app)
            .delete("/comments/invalid-id-123")
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(400);
    });

    test("Delete Comment - Success", async () => {
        const response = await request(app)
            .delete("/comments/" + commentId)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
    });

    test("Delete Comment - Fail (Not Found)", async () => {
        const response = await request(app)
            .delete("/comments/" + commentId)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(404);
    });
});


