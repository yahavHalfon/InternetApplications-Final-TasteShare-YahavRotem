import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";

let app: Express;

const testUser = {
    email: "test@auth.com",
    password: "password123"
};

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Auth Routes Tests", () => {

    test("Register User - Success", async () => {
        const response = await request(app).post("/auth/register").send(testUser);
        expect(response.statusCode).toBe(201);
        expect(response.body.token).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
    });

    test("Register User - Fail (User already exists)", async () => {
        const response = await request(app).post("/auth/register").send(testUser);
        expect(response.statusCode).toBe(409);
    });

    test("Register User - Fail (Missing fields)", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "missing@password.com"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Login User - Success", async () => {
        const response = await request(app).post("/auth/login").send(testUser);
        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
    });

    test("Login User - Fail (Invalid password)", async () => {
        const response = await request(app).post("/auth/login").send({
            email: testUser.email,
            password: "wrongpassword"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Login User - Fail (Non-existent user)", async () => {
        const response = await request(app).post("/auth/login").send({
            email: "nonexistent@user.com",
            password: "password123"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Login - Fail (JWT_EXPIRES_IN missing)", async () => {
        const originalExpiresIn = process.env.JWT_EXPIRES_IN;
        process.env.JWT_EXPIRES_IN = "";

        try {
            const response = await request(app).post("/auth/login").send(testUser);
            expect(response.statusCode).toBe(500);
        } finally {
            process.env.JWT_EXPIRES_IN = originalExpiresIn;
        }
    });

    test("Login - Fail (REFRESH_TOKEN_EXPIRES_IN missing)", async () => {
        const originalExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;
        process.env.REFRESH_TOKEN_EXPIRES_IN = "";

        try {
            const response = await request(app).post("/auth/login").send(testUser);
            expect(response.statusCode).toBe(500);
        } finally {
            process.env.REFRESH_TOKEN_EXPIRES_IN = originalExpiresIn;
        }
    });

    let refreshToken: string;

    test("Refresh Token - Setup", async () => {
        const response = await request(app).post("/auth/login").send(testUser);
        expect(response.statusCode).toBe(200);
        refreshToken = response.body.refreshToken;
    });

    test("Refresh Token - Success", async () => {
        const response = await request(app).post("/auth/refresh").send({
            refreshToken: refreshToken
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        refreshToken = response.body.refreshToken;
    });

    test("Refresh Token - Fail (Invalid token)", async () => {
        const response = await request(app).post("/auth/refresh").send({
            refreshToken: "invalid_refresh_token"
        });
        expect(response.statusCode).toBe(401);
    });

    test("Refresh Token - Fail (Missing token)", async () => {
        const response = await request(app).post("/auth/refresh").send({});
        expect(response.statusCode).toBe(400);
    });

    test("Refresh Token - Fail (User Not Found)", async () => {
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const refreshToken = loginRes.body.refreshToken;

        const user = await userModel.findOne({ email: testUser.email });
        if (user) await userModel.findByIdAndDelete(user._id);

        const response = await request(app).post("/auth/refresh").send({ refreshToken });
        expect(response.statusCode).toBe(401);
    });

    test("Refresh Token - Fail (Token Not In List/Reuse)", async () => {
        await request(app).post("/auth/register").send(testUser);
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const refreshToken = loginRes.body.refreshToken;

        const user = await userModel.findOne({ email: testUser.email });
        if (user) {
            user.refreshTokens = [];
            await user.save();
        }

        const response = await request(app).post("/auth/refresh").send({ refreshToken });
        expect(response.statusCode).toBe(401);
    });

    test("Refresh Token - Fail (JWT_SECRET missing)", async () => {
        await request(app).post("/auth/login").send(testUser);
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const refreshToken = loginRes.body.refreshToken;

        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        try {
            const response = await request(app).post("/auth/refresh").send({ refreshToken });
            expect(response.statusCode).toBe(500);
        } finally {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    test("Logout - Success", async () => {
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const accessToken = loginRes.body.token;
        const freshRefreshToken = loginRes.body.refreshToken;

        const logoutRes = await request(app).post("/auth/logout")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                refreshToken: freshRefreshToken
            });
        expect(logoutRes.statusCode).toBe(200);
    });

    test("Logout - Fail (Invalid token)", async () => {
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const accessToken = loginRes.body.token;

        const response = await request(app).post("/auth/logout")
            .set("Authorization", "Bearer " + accessToken)
            .send({
                refreshToken: "invalid_token_format"
            });
        expect(response.statusCode).toBe(401);
    });

    test("Logout - Fail (Missing Refresh Token)", async () => {
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const accessToken = loginRes.body.token;

        const response = await request(app).post("/auth/logout")
            .set("Authorization", "Bearer " + accessToken)
            .send({});
        expect(response.statusCode).toBe(400);
    });

    test("Logout - Fail (User Not Found)", async () => {
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const accessToken = loginRes.body.token;
        const refreshToken = loginRes.body.refreshToken;

        const user = await userModel.findOne({ email: testUser.email });
        if (user) await userModel.findByIdAndDelete(user._id);

        const response = await request(app).post("/auth/logout")
            .set("Authorization", "Bearer " + accessToken)
            .send({ refreshToken });
        expect(response.statusCode).toBe(401);
    });

    test("Logout - Fail (Token Not In List)", async () => {
        await request(app).post("/auth/register").send(testUser);
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const accessToken = loginRes.body.token;
        const refreshToken = loginRes.body.refreshToken;

        const user = await userModel.findOne({ email: testUser.email });
        if (user) {
            user.refreshTokens = [];
            await user.save();
        }

        const response = await request(app).post("/auth/logout")
            .set("Authorization", "Bearer " + accessToken)
            .send({ refreshToken });
        expect(response.statusCode).toBe(401);
    });

    test("Logout - Fail (JWT_SECRET missing)", async () => {
        const loginRes = await request(app).post("/auth/login").send(testUser);
        const accessToken = loginRes.body.token;
        const refreshToken = loginRes.body.refreshToken;

        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        try {
            const response = await request(app).post("/auth/logout")
                .set("Authorization", "Bearer " + accessToken)
                .send({ refreshToken });
            expect(response.statusCode).toBe(500);
        } finally {
            process.env.JWT_SECRET = originalSecret;
        }
    });

    test("Auth Middleware - Fail (No Authorization Header)", async () => {
        const response = await request(app).post("/recipes").send({ title: "t", description: "d" });
        expect(response.statusCode).toBe(401);
    });

    test("Auth Middleware - Fail (Invalid Header Format)", async () => {
        const response = await request(app).post("/recipes")
            .set("Authorization", "Basic invalid")
            .send({ title: "t", description: "d" });
        expect(response.statusCode).toBe(401);
    });

    test("Auth Middleware - Fail (User Deleted)", async () => {
        const tempUser = { email: "deleted@test.com", password: "123" };
        await request(app).post("/auth/register").send(tempUser);
        const loginRes = await request(app).post("/auth/login").send(tempUser);
        const accessToken = loginRes.body.token;

        const user = await userModel.findOne({ email: tempUser.email });
        if (user) await userModel.findByIdAndDelete(user._id);

        const response = await request(app).post("/recipes")
            .set("Authorization", "Bearer " + accessToken)
            .send({ title: "t", description: "d" });

        expect(response.statusCode).toBe(401);
    });

    test("Auth Middleware - Fail (Invalid Token Signature)", async () => {
        const response = await request(app).post("/recipes")
            .set("Authorization", "Bearer invalidtoken123")
            .send({ title: "t", description: "d" });
        expect(response.statusCode).toBe(401);
    });

    test("Auth Middleware - Fail (JWT_SECRET missing)", async () => {
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        try {
            const response = await request(app).post("/recipes")
                .set("Authorization", "Bearer some.valid.token")
                .send({ title: "t", description: "d" });
            expect(response.statusCode).toBe(500);
        } finally {
            process.env.JWT_SECRET = originalSecret;
        }
    });

});
