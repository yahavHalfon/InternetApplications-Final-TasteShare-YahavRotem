import request from "supertest";
import initApp from "../index";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../model/userModel";
import userController from "../controllers/userController";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: ".env.test" });

let app: Express;

const profileUser = {
    email: "profileuser@example.com",
    password: "password123",
    username: "profileuser",
    name: "Profile User",
};
let profileToken: string;

const createMockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    return res;
};

async function restoreProfileUser() {
    await userModel.deleteMany({ email: profileUser.email });
    await request(app).post("/auth/register").send(profileUser);
    const loginResponse = await request(app).post("/auth/login").send(profileUser);
    profileToken = loginResponse.body.token;
}

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();

    const regResponse = await request(app).post("/auth/register").send(profileUser);
    profileToken = regResponse.body.token;
});

afterAll(async () => {
    await mongoose.connection.close();
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

    test("Get User By ID - Success (Public profile only)", async () => {
        const user = await userModel.findOne({ email: profileUser.email });
        expect(user).not.toBeNull();

        const response = await request(app).get(`/users/${user!._id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.email).toBe(profileUser.email);
        expect(response.body.name).toBe(profileUser.name);
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("avatarUrl");
        // Must NOT expose sensitive fields
        expect(response.body).not.toHaveProperty("password");
        expect(response.body).not.toHaveProperty("refreshTokens");
        expect(response.body).not.toHaveProperty("_id");
    });

    test("Get User By ID - Fail (Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/users/${nonExistentId}`);
        expect(response.statusCode).toBe(404);
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

    test("Get Profile - Fail (User Not Found)", async () => {
        const user = await userModel.findOne({ email: profileUser.email });
        if (user) await userModel.findByIdAndDelete(user._id);

        try {
            const response = await request(app)
                .get("/users/profile")
                .set("Authorization", "Bearer " + profileToken);

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe("Unauthorized: User not found");
        } finally {
            await restoreProfileUser();
        }
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

    test("Update Profile - Fail (User Not Found)", async () => {
        const currentProfileUser = await userModel.findOne({ email: profileUser.email });
        if (currentProfileUser) await userModel.findByIdAndDelete(currentProfileUser._id);

        try {
            const response = await request(app)
                .put("/users/profile")
                .set("Authorization", "Bearer " + profileToken)
                .send({ name: "Missing User" });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe("Unauthorized: User not found");
        } finally {
            await restoreProfileUser();
        }
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

    test("Update Profile Picture - Fail (User Not Found)", async () => {
        const user = await userModel.findOne({ email: profileUser.email });
        if (user) await userModel.findByIdAndDelete(user._id);

        try {
            const response = await request(app)
                .put("/users/profile/picture")
                .set("Authorization", "Bearer " + profileToken)
                .attach("profileImage", Buffer.from("fake-image-data"), "avatar.jpg");

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe("Unauthorized: User not found");
        } finally {
            await restoreProfileUser();
        }
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

    test("UserController - getProfile returns 404 when user is missing", async () => {
        const findByIdSpy = jest.spyOn(userModel, "findById").mockResolvedValue(null as never);
        const req: any = { user: { _id: "missing-user-id" } };
        const res: any = createMockResponse();

        try {
            await userController.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
        } finally {
            findByIdSpy.mockRestore();
        }
    });

    test("UserController - getProfile returns 401 when no user in request", async () => {
        const req: any = { user: undefined };
        const res: any = createMockResponse();

        await userController.getProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("UserController - updateProfile returns 404 when user is missing", async () => {
        const findByIdSpy = jest.spyOn(userModel, "findById").mockResolvedValue(null as never);
        const req: any = { user: { _id: "missing-user-id" }, body: {} };
        const res: any = createMockResponse();

        try {
            await userController.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
        } finally {
            findByIdSpy.mockRestore();
        }
    });

    test("UserController - updateProfile returns 401 when no user in request", async () => {
        const req: any = { user: undefined, body: {} };
        const res: any = createMockResponse();

        await userController.updateProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("UserController - updateProfilePicture returns 404 when user is missing", async () => {
        const findByIdSpy = jest.spyOn(userModel, "findById").mockResolvedValue(null as never);
        const req: any = {
            user: { _id: "missing-user-id" },
            file: { filename: "avatar.jpg" },
            body: {},
        };
        const res: any = createMockResponse();

        try {
            await userController.updateProfilePicture(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
        } finally {
            findByIdSpy.mockRestore();
        }
    });

    test("UserController - updateProfilePicture returns 401 when no user in request", async () => {
        const req: any = { user: undefined, file: { filename: "avatar.jpg" }, body: {} };
        const res: any = createMockResponse();

        await userController.updateProfilePicture(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("UserController - updateProfilePicture returns 400 when no file", async () => {
        const req: any = { user: { _id: "some-user-id" }, body: {} };
        const res: any = createMockResponse();

        await userController.updateProfilePicture(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Profile image is required" });
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
