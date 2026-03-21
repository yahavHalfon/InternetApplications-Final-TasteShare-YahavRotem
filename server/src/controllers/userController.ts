import User from "../model/userModel";
import type { IUser } from "../model/userModel";
import BaseController from "./baseController";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";

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

            if (typeof req.body.name === "string") {
                user.name = req.body.name.trim();
            }
            if (typeof req.body.username === "string") {
                user.username = req.body.username.trim();
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