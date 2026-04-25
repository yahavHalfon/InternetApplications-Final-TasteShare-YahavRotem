import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: ".env.test" });

let app: Express;
const testUser = {
    email: "testuser@example.com",
    password: "password123",
};

let userId: string;

const profileUser = {
    email: "profileuser@example.com",
    password: "password123",
    username: "profileuser",
    name: "Profile User",
};
let profileToken: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    const user = await userModel.create(testUser);
    userId = user._id.toString();

    const regResponse = await request(app).post("/auth/register").send(profileUser);
    profileToken = regResponse.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("User Routes Tests", () => {
    test("Get All Users", async () => {
        const response = await request(app).get("/users");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].email).toBe(testUser.email);
    });

    test("Get User By ID - Success", async () => {
        const response = await request(app).get(`/users/${userId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(testUser.email);
        expect(response.body._id).toBe(userId);
    });

    test("Get User By ID - Fail (Invalid ID)", async () => {
        const response = await request(app).get("/users/invalid-id-format");
        expect(response.statusCode).toBe(400);
    });

    test("Get User By ID - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/users/${nonExistentId}`);
        expect(response.statusCode).toBe(404);
    });

    test("Delete User - Fail (Invalid ID)", async () => {
        const response = await request(app).delete("/users/invalid-id-format");
        expect(response.statusCode).toBe(400);
    });

    test("Delete User - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).delete(`/users/${nonExistentId}`);
        expect(response.statusCode).toBe(404);
    });

    test("Delete User - Success", async () => {
        const response = await request(app).delete(`/users/${userId}`);
        expect(response.statusCode).toBe(200);

        const check = await userModel.findById(userId);
        expect(check).toBeNull();
    });
});

describe("User Profile Tests", () => {
    test("Get Profile - Success", async () => {
        const response = await request(app)
            .get("/users/profile")
            .set("Authorization", "Bearer " + profileToken);
        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(profileUser.email);
        expect(response.body.username).toBe(profileUser.username);
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("avatarUrl");
        expect(response.body).not.toHaveProperty("password");
    });

    test("Get Profile - Fail (No Auth)", async () => {
        const response = await request(app).get("/users/profile");
        expect(response.statusCode).toBe(401);
    });

    test("Get Profile - Fail (Invalid Token)", async () => {
        const response = await request(app)
            .get("/users/profile")
            .set("Authorization", "Bearer invalidtoken");
        expect(response.statusCode).toBe(401);
    });

    test("Update Profile Name - Success", async () => {
        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + profileToken)
            .send({ name: "Updated Name" });
        expect(response.statusCode).toBe(200);
        expect(response.body.name).toBe("Updated Name");
    });

    test("Update Profile Bio, Website, Location - Success", async () => {
        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + profileToken)
            .send({ bio: "Food lover", website: "https://food.example.com", location: "Tel Aviv, IL" });
        expect(response.statusCode).toBe(200);
        expect(response.body.bio).toBe("Food lover");
        expect(response.body.website).toBe("https://food.example.com");
        expect(response.body.location).toBe("Tel Aviv, IL");
    });

    test("Update Profile Username - Success", async () => {
        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + profileToken)
            .send({ username: "newusername" });
        expect(response.statusCode).toBe(200);
        expect(response.body.username).toBe("newusername");
    });

    test("Update Profile - Fail (Invalid Email Format)", async () => {
        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + profileToken)
            .send({ email: "notanemail" });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid email format");
    });

    test("Update Profile - Fail (Empty Username After Normalization)", async () => {
        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + profileToken)
            .send({ username: "!!!" });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Username is required");
    });

    test("Update Profile - Fail (Duplicate Email)", async () => {
        // Register a second user and try to take their email
        const secondUser = { email: "second@example.com", password: "password123", username: "seconduser" };
        await request(app).post("/auth/register").send(secondUser);

        const response = await request(app)
            .put("/users/profile")
            .set("Authorization", "Bearer " + profileToken)
            .send({ email: "second@example.com" });
        expect(response.statusCode).toBe(409);
    });

    test("Update Profile - Fail (No Auth)", async () => {
        const response = await request(app)
            .put("/users/profile")
            .send({ name: "Hacker" });
        expect(response.statusCode).toBe(401);
    });

    test("Update Profile Picture - Success", async () => {
        const response = await request(app)
            .put("/users/profile/picture")
            .set("Authorization", "Bearer " + profileToken)
            .attach("profileImage", Buffer.from("fake-image-data"), "avatar.jpg");
        expect(response.statusCode).toBe(200);
        expect(response.body.avatarUrl).toMatch(/\/uploads\/profiles\//);
    });

    test("Update Profile Picture - Fail (No File)", async () => {
        const response = await request(app)
            .put("/users/profile/picture")
            .set("Authorization", "Bearer " + profileToken);
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Profile image is required");
    });

    test("Update Profile Picture - Fail (No Auth)", async () => {
        const response = await request(app)
            .put("/users/profile/picture")
            .attach("profileImage", Buffer.from("fake-image-data"), "avatar.jpg");
        expect(response.statusCode).toBe(401);
    });

    test("Update Profile Picture - Fail (Image Too Large)", async () => {
        const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1); // 5 MB + 1 byte
        const response = await request(app)
            .put("/users/profile/picture")
            .set("Authorization", "Bearer " + profileToken)
            .attach("profileImage", oversizedBuffer, "avatar.jpg");
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Image is too large. Max size is 5 MB.");
    });

    test("Update Profile Picture - Fail (Invalid Image Type)", async () => {
        const response = await request(app)
            .put("/users/profile/picture")
            .set("Authorization", "Bearer " + profileToken)
            .attach("profileImage", Buffer.from("fake-data"), { filename: "avatar.pdf", contentType: "application/pdf" });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toMatch(/only image files/i);
    });

    afterAll(() => {
        // Clean up any uploaded test profile images
        const uploadsDir = path.join(process.cwd(), "uploads", "profiles");
        if (fs.existsSync(uploadsDir)) {
            fs.readdirSync(uploadsDir).forEach((file) => {
                fs.unlinkSync(path.join(uploadsDir, file));
            });
        }
    });
});
