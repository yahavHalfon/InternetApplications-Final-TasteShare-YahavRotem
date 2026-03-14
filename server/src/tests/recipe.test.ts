import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";
import postModel from "../model/postModel";

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
    await postModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Post Tests", () => {

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


    let postId: string;

    test("Create Post - Success", async () => {
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                title: "Test Post",
                content: "Test Content",
                sender: "Test Sender",
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.sender).toBe(userId);
        postId = response.body._id;
    });

    test("Create Post - Fail (No Auth)", async () => {
        const response = await request(app).post("/post").send({
            title: "Test Post",
            content: "Test Content",
        });
        expect(response.statusCode).toBe(401);
    });

    test("Create Post - Fail (Validation Error)", async () => {
        const response = await request(app)
            .post("/post")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                // Missing title and content
            });
        expect(response.statusCode).toBe(400);
    });


    test("Get All Posts", async () => {
        const response = await request(app).get("/post");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("Get Post By ID - Success", async () => {
        const response = await request(app).get("/post/" + postId);
        expect(response.statusCode).toBe(200);
    });

    test("Get Post By ID - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get("/post/" + nonExistentId);
        expect(response.statusCode).toBe(404);
    });

    test("Get Post By ID - Fail (Invalid ID Format)", async () => {
        const response = await request(app).get("/post/invalid-id-123");
        expect(response.statusCode).toBe(400); // BaseController handles CastError
    });


    test("Update Post - Success", async () => {
        const response = await request(app)
            .put("/post/" + postId)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                title: "Updated Title",
                content: "Updated Content",
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe("Updated Title");
    });

    test("Update Post - Fail (Not Owner)", async () => {
        const response = await request(app)
            .put("/post/" + postId)
            .set("Authorization", "Bearer " + accessToken2)
            .send({
                title: "Hacked Title",
                content: "Hacked Content",
            });
        expect(response.statusCode).toBe(403);
    });

    test("Update Post - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put("/post/" + nonExistentId)
            .set("Authorization", "Bearer " + accessToken)
            .send({
                title: "Updated Title",
            });
        expect(response.statusCode).toBe(404);
    });

    test("Update Post - Fail (Invalid ID Format)", async () => {
        const response = await request(app)
            .put("/post/invalid-id-123")
            .set("Authorization", "Bearer " + accessToken)
            .send({ title: "Updated Title" });
        expect(response.statusCode).toBe(400);
    });


    test("Delete Post - Fail (Not Owner)", async () => {
        const response = await request(app)
            .delete("/post/" + postId)
            .set("Authorization", "Bearer " + accessToken2);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Post - Fail (Invalid ID Format)", async () => {
        const response = await request(app)
            .delete("/post/invalid-id-123")
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(400);
    });

    test("Delete Post - Success", async () => {
        const response = await request(app)
            .delete("/post/" + postId)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(200);
    });

    test("Delete Post - Fail (Not Found)", async () => {
        const response = await request(app)
            .delete("/post/" + postId)
            .set("Authorization", "Bearer " + accessToken);
        expect(response.statusCode).toBe(404);
    });


});
