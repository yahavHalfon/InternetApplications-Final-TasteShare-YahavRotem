import { Response } from "express";
import Comment from "../model/commentModel";
import type { IComment } from "../model/commentModel";
import RecipeModel from "../model/recipeModel";
import User from "../model/userModel";
import BaseController from "./baseController";

import { AuthRequest } from "../middleware/authMiddleware";

type PopulatedComment = {
    _id: unknown;
    recipeId: unknown;
    text: string;
    createdAt: Date;
    userId: {
        _id: unknown;
        name?: string;
        username?: string;
        avatarUrl?: string;
    };
};

const toCommentResponse = (comment: PopulatedComment) => {
    const displayName = comment.userId.name?.trim() || comment.userId.username?.trim() || "Unknown User";

    return {
        id: String(comment._id),
        recipeId: String(comment.recipeId),
        text: comment.text,
        createdAt: comment.createdAt,
        author: {
            id: String(comment.userId._id),
            name: displayName,
            avatarUrl: comment.userId.avatarUrl || "",
        },
    };
};

class CommentController extends BaseController<IComment> {
    constructor() {
        super(Comment);
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }

            if (comment.userId.toString() !== userId) {
                return res.status(403).json({ error: "Unauthorized: You can only delete your own comments" });
            }

            return super.delete(req, res);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        const recipeId = req.body.recipeId;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            const recipe = await RecipeModel.findById(recipeId);
            if (!recipe) {
                res.status(404).json({ error: "Recipe not found" });
                return;
            }

            req.body.userId = userId;
            return super.create(req, res);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const comment = await Comment.findById(id);
            if (!comment) {
                res.status(404).json({ error: "Comment not found" });
                return;
            }

            if (comment.userId.toString() !== userId) {
                res.status(403).json({ error: "Unauthorized: You can only update your own comments" });
                return;
            }
            return super.put(req, res);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async getRecipeComments(req: AuthRequest, res: Response) {
        const recipeId = req.params.id;

        try {
            const recipe = await RecipeModel.findById(recipeId).select("_id").lean();
            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            const comments = await Comment.find({ recipeId })
                .sort({ createdAt: 1 })
                .populate("userId", "name username avatarUrl")
                .lean<PopulatedComment[]>();

            return res.status(200).json(comments.map(toCommentResponse));
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async createRecipeComment(req: AuthRequest, res: Response) {
        const recipeId = req.params.id;
        const userId = req.user?._id;
        const rawText = typeof req.body.text === "string" ? req.body.text : "";
        const text = rawText.trim();

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!text) {
            return res.status(400).json({ error: "Comment text is required" });
        }

        try {
            const [recipe, user] = await Promise.all([
                RecipeModel.findById(recipeId).select("_id").lean(),
                User.findById(userId).select("name username avatarUrl").lean(),
            ]);

            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            if (!user) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const createdComment = await Comment.create({
                recipeId,
                userId,
                text,
            });

            return res.status(201).json(toCommentResponse({
                _id: createdComment._id,
                recipeId: createdComment.recipeId,
                text: createdComment.text,
                createdAt: createdComment.createdAt,
                userId: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                },
            }));
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}

export default new CommentController();