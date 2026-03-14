import { Response } from "express";
import Comment from "../model/commentModel";
import type { IComment } from "../model/commentModel";
import RecipeModel from "../model/recipeModel";
import BaseController from "./baseController";

import { AuthRequest } from "../middleware/authMiddleware";

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
}

export default new CommentController();