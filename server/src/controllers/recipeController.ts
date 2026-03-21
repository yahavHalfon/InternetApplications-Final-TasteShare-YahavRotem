import Recipe from "../model/recipeModel";
import type { IRecipe } from "../model/recipeModel";
import BaseController from "./baseController";

import CommentModel from "../model/commentModel";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

class RecipeController extends BaseController<IRecipe> {
    constructor() {
        super(Recipe);
    }

    async get(req: Request, res: Response) {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
        const skip = (page - 1) * limit;

        try {
            const [total, data] = await Promise.all([
                Recipe.countDocuments({}),
                Recipe.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
            ]);

            return res.status(200).json({
                data,
                page,
                limit,
                total,
                hasMore: skip + data.length < total,
            });
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.body.userId = userId;
        return super.create(req, res);
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const recipe = await Recipe.findById(id);
            if (!recipe) {
                res.status(404).json({ error: "Recipe not found" });
                return;
            }

            if (recipe.userId.toString() !== userId) {
                res.status(403).json({ error: "Unauthorized: You can only update your own recipes" });
                return;
            }
            return super.put(req, res);
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const recipe = await Recipe.findById(id);
            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            if (recipe.userId.toString() !== userId) {
                return res.status(403).json({ error: "Unauthorized: You can only delete your own recipes" });
            }

            await CommentModel.deleteMany({ recipeId: id });
            return super.delete(req, res);
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}

export default new RecipeController();
