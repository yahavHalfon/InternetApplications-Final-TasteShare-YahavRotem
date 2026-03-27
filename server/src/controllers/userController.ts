import User from "../model/userModel";
import type { IUser } from "../model/userModel";
import BaseController from "./baseController";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import slugify from "slugify";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeUsername = (value: string): string =>
    slugify(value, { lower: true, strict: true, trim: true, replacement: "" }).slice(0, 30);

class UserController extends BaseController<IUser> {
    constructor() {
        super(User);
    }

    private toPublicUser(user: InstanceType<typeof User>) {
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            website: user.website,
            location: user.location,
        };
    }

    async getProfile(req: AuthRequest, res: Response): Promise<Response | void> {
        try {
            if (!req.user?._id) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.status(200).json(this.toPublicUser(user));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async updateProfile(req: AuthRequest, res: Response): Promise<Response | void> {
        try {
            if (!req.user?._id) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const nextEmail = typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : undefined;
            const nextUsername = typeof req.body.username === "string"
                ? normalizeUsername(req.body.username)
                : undefined;

            if (nextEmail !== undefined && !emailPattern.test(nextEmail)) {
                return res.status(400).json({ error: "Invalid email format" });
            }

            if (nextUsername !== undefined && !nextUsername) {
                return res.status(400).json({ error: "Username is required" });
            }

            const [existingByEmail, existingByUsername] = await Promise.all([
                nextEmail && nextEmail !== user.email
                    ? User.findOne({ email: nextEmail, _id: { $ne: user._id } }).select("_id").lean()
                    : Promise.resolve(null),
                nextUsername && nextUsername !== user.username
                    ? User.findOne({ username: nextUsername, _id: { $ne: user._id } }).select("_id").lean()
                    : Promise.resolve(null),
            ]);

            if (existingByEmail) {
                return res.status(409).json({ error: "User already exists" });
            }

            if (existingByUsername) {
                return res.status(409).json({ error: "Username already exists" });
            }

            if (typeof req.body.name === "string") {
                user.name = req.body.name.trim();
            }
            if (nextEmail !== undefined) {
                user.email = nextEmail;
            }
            if (nextUsername !== undefined) {
                user.username = nextUsername;
            }
            if (typeof req.body.bio === "string") {
                user.bio = req.body.bio.trim();
            }
            if (typeof req.body.website === "string") {
                user.website = req.body.website.trim();
            }
            if (typeof req.body.location === "string") {
                user.location = req.body.location.trim();
            }

            const updatedUser = await user.save();
            return res.status(200).json(this.toPublicUser(updatedUser));
        } catch (error) {
            const mongoError = error as { code?: number; keyPattern?: Record<string, number> };
            if (mongoError.code === 11000) {
                if (mongoError.keyPattern?.email) {
                    return res.status(409).json({ error: "User already exists" });
                }
                if (mongoError.keyPattern?.username) {
                    return res.status(409).json({ error: "Username already exists" });
                }
                return res.status(409).json({ error: "Duplicate value" });
            }
            return this.handleError(res, error);
        }
    }

    async updateProfilePicture(req: AuthRequest, res: Response): Promise<Response | void> {
        try {
            if (!req.user?._id) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (!req.file) {
                return res.status(400).json({ error: "Profile image is required" });
            }

            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            user.avatarUrl = `/uploads/profiles/${req.file.filename}`;
            const updatedUser = await user.save();
            return res.status(200).json(this.toPublicUser(updatedUser));
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}

export default new UserController();