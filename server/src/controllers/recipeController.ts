import Recipe from "../model/recipeModel";
import type { IRecipe } from "../model/recipeModel";
import { Types } from "mongoose";
import BaseController from "./baseController";

import CommentModel from "../model/commentModel";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    if (typeof value !== "string") {
        return [];
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
            return parsed
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean);
        }
    } catch {
        return trimmed
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

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

        if (!req.file) {
            return res.status(400).json({ error: "Recipe image is required" });
        }

        const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
        const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
        const ingredients = parseStringArray(req.body.ingredients);
        const instructions = parseStringArray(req.body.instructions);
        const cookTime = typeof req.body.cookTime === "string" ? req.body.cookTime.trim() : "";
        const servings = typeof req.body.servings === "string"
            ? Number.parseInt(req.body.servings, 10)
            : req.body.servings;
        const difficulty = req.body.difficulty;

        if (!title || !description || !cookTime) {
            return res.status(400).json({ error: "Title, description and cook time are required" });
        }

        if (!ingredients.length) {
            return res.status(400).json({ error: "At least one ingredient is required" });
        }

        if (!instructions.length) {
            return res.status(400).json({ error: "At least one instruction is required" });
        }

        if (!Number.isInteger(servings) || servings < 1) {
            return res.status(400).json({ error: "Servings must be at least 1" });
        }

        if (!["Easy", "Medium", "Advanced"].includes(difficulty)) {
            return res.status(400).json({ error: "Invalid difficulty" });
        }

        req.body = {
            userId,
            image: `/uploads/recipes/${req.file.filename}`,
            title,
            description,
            ingredients,
            instructions,
            cookTime,
            servings,
            difficulty,
            likedBy: [],
        };

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

    async toggleLike(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            const recipe = await Recipe.findById(id);
            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            const userObjectId = new Types.ObjectId(userId);
            const isLiked = recipe.likedBy.some((id) => id.toString() === userId);

            if (isLiked) {
                recipe.likedBy = recipe.likedBy.filter((id) => id.toString() !== userId);
            } else {
                recipe.likedBy.push(userObjectId);
            }

            await recipe.save();
            return res.status(200).json(recipe);
        } catch (error) {
            return this.handleError(res, error);
        }
    }
}

export default new RecipeController();
