import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";

// --- Google OAuth mock -------------------------------------------------------
// jest.mock factories are hoisted above all declarations, so we cannot reference
// local variables inside them. We create the mock inside the factory and retrieve
// it via the mocked module import.
const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => {
    // `mockVerifyIdToken` is declared above and is accessible because jest
    // transforms this into a `require`-time call where the variable is in scope
    // (it's hoisted as `var` internally).
    const verifyFn = jest.requireActual("google-auth-library");
    // We don't actually need the real library – just need to replace OAuth2Client.
    void verifyFn;
    return {
        OAuth2Client: jest.fn().mockImplementation(() => ({
            verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
        })),
    };
});
// -----------------------------------------------------------------------------

let app: Express;

const testUser = {
    email: "test@auth.com",
    password: "password123",
    username: "testauthuser"
};

beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    app = await initApp();
    await userModel.deleteMany();
});

afterAll(async () => {
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

    test("Register User - Fail (Username already exists)", async () => {
        const firstUser = {
            email: "dupusername1@auth.com",
            password: "password123",
            username: "sameusername",
        };

        const secondUser = {
            email: "dupusername2@auth.com",
            password: "password123",
            username: "sameusername",
        };

        const firstResponse = await request(app).post("/auth/register").send(firstUser);
        expect(firstResponse.statusCode).toBe(201);

        const secondResponse = await request(app).post("/auth/register").send(secondUser);
        expect(secondResponse.statusCode).toBe(409);
        expect(secondResponse.body.error).toBe("Username is already taken");
    });

    test("Register User - Fail (Missing fields)", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "missing@password.com"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Register User - Fail (Invalid email format)", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "not-an-email",
            password: "password123",
            username: "invalidemailuser"
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid email format");
    });

    test("Register User - Fail (Short password)", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "shortpass@auth.com",
            password: "short",
            username: "shortpassuser"
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Password must be at least 8 characters");
    });

    test("Register User - Fail (Empty normalized username)", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "!!!@auth.com",
            password: "password123"
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Username is required");
    });

    test("Register User - Success (Missing username)", async () => {
        const response = await request(app).post("/auth/register").send({
            email: "nousername@auth.com",
            password: "password123"
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.user.username).toBe("nousername");
    });

    test("Register User - Success (Auto-generated unique username)", async () => {
        const firstResponse = await request(app).post("/auth/register").send({
            email: "autouser1@auth.com",
            password: "password123",
            name: "Auto User"
        });

        const secondResponse = await request(app).post("/auth/register").send({
            email: "autouser2@auth.com",
            password: "password123",
            name: "Auto User"
        });

        expect(firstResponse.statusCode).toBe(201);
        expect(secondResponse.statusCode).toBe(201);
        expect(firstResponse.body.user.username).toBe("autouser");
        expect(secondResponse.body.user.username).not.toBe(firstResponse.body.user.username);
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

    test("Login User - Fail (Invalid email format)", async () => {
        const response = await request(app).post("/auth/login").send({
            email: "not-an-email",
            password: "password123"
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid email format");
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

        const oldRefreshToken = refreshToken;
        refreshToken = response.body.refreshToken;

        const reuseResponse = await request(app).post("/auth/refresh").send({
            refreshToken: oldRefreshToken
        });

        expect(reuseResponse.statusCode).toBe(401);
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

        const reuseResponse = await request(app).post("/auth/refresh").send({
            refreshToken: freshRefreshToken
        });

        expect(reuseResponse.statusCode).toBe(401);
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

    test("Update Profile - Fail (Username already exists)", async () => {
        const firstUser = {
            email: "profilefirst@auth.com",
            password: "password123",
            username: "profilefirst",
        };

        const secondUser = {
            email: "profilesecond@auth.com",
            password: "password123",
            username: "profilesecond",
        };

        await request(app).post("/auth/register").send(firstUser);
        await request(app).post("/auth/register").send(secondUser);

        const secondLogin = await request(app).post("/auth/login").send({
            email: secondUser.email,
            password: secondUser.password,
        });

        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + secondLogin.body.token)
            .send({ username: firstUser.username });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe("Username already exists");
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
        const tempUser = { email: "deleted@test.com", password: "password123", username: "deleteduser" };
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

describe("Google Sign-In Tests", () => {

    beforeEach(() => {
        mockVerifyIdToken.mockReset();
    });

    test("Google Sign-In - Success (New user created)", async () => {
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                email: "googleuser@gmail.com",
                name: "Google User",
                picture: "https://lh3.googleusercontent.com/photo.jpg",
            }),
        });

        const response = await request(app).post("/auth/google").send({
            credential: "valid-google-id-token",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        expect(response.body.user.email).toBe("googleuser@gmail.com");
        expect(response.body.user.name).toBe("Google User");
        expect(response.body.user.avatarUrl).toBe("https://lh3.googleusercontent.com/photo.jpg");
    });

    test("Google Sign-In - Success (Existing user logs in)", async () => {
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                email: "googleuser@gmail.com",
                name: "Google User",
                picture: "https://lh3.googleusercontent.com/photo.jpg",
            }),
        });

        const response = await request(app).post("/auth/google").send({
            credential: "valid-google-id-token",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe("googleuser@gmail.com");
    });

    test("Google Sign-In - Fail (Missing credential)", async () => {
        const response = await request(app).post("/auth/google").send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Google credential is required");
    });

    test("Google Sign-In - Fail (Empty credential)", async () => {
        const response = await request(app).post("/auth/google").send({
            credential: "",
        });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Google credential is required");
    });

    test("Google Sign-In - Fail (Invalid credential / verification fails)", async () => {
        mockVerifyIdToken.mockRejectedValue(new Error("Token verification failed"));

        const response = await request(app).post("/auth/google").send({
            credential: "invalid-google-token",
        });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Invalid Google credential");
    });

    test("Google Sign-In - Fail (No email in payload)", async () => {
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                name: "No Email User",
            }),
        });

        const response = await request(app).post("/auth/google").send({
            credential: "valid-but-no-email-token",
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Google account does not expose an email");
    });

    test("Google Sign-In - Fail (GOOGLE_CLIENT_ID not defined)", async () => {
        const originalClientId = process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_ID;

        try {
            const response = await request(app).post("/auth/google").send({
                credential: "some-token",
            });

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe("GOOGLE_CLIENT_ID is not defined");
        } finally {
            process.env.GOOGLE_CLIENT_ID = originalClientId;
        }
    });

    test("Google Sign-In - Success (User created without name uses email prefix)", async () => {
        mockVerifyIdToken.mockResolvedValue({
            getPayload: () => ({
                email: "noname@gmail.com",
            }),
        });

        const response = await request(app).post("/auth/google").send({
            credential: "valid-google-id-token-no-name",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.user.email).toBe("noname@gmail.com");
        expect(response.body.user.name).toBe("noname");
    });
});
