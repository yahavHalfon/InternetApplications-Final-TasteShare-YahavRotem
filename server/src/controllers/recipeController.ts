import Recipe from "../model/recipeModel";
import type { IRecipe } from "../model/recipeModel";
import { Types } from "mongoose";
import BaseController from "./baseController";

import CommentModel from "../model/commentModel";
import User from "../model/userModel";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import embeddingService from "../services/embeddingService";
import recipeService from "../services/recipeService";

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

const formatCreatedAt = (value: Date): string => {
    const now = Date.now();
    const createdAtMs = new Date(value).getTime();
    const diffMs = Math.max(0, now - createdAtMs);
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (diffMs < minuteMs) {
        return "Just now";
    }
    if (diffMs < hourMs) {
        return `${Math.floor(diffMs / minuteMs)}m ago`;
    }
    if (diffMs < dayMs) {
        return `${Math.floor(diffMs / hourMs)}h ago`;
    }
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
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
            const [total, recipes] = await Promise.all([
                Recipe.countDocuments({}),
                Recipe.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
            ]);

            // Fetch comment counts for each recipe
            const data = await Promise.all(
                recipes.map(async (recipe) => {
                    const commentsCount = await CommentModel.countDocuments({ recipeId: recipe._id });
                    return {
                        ...recipe.toObject(),
                        commentsCount,
                    };
                })
            );

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

    async getById(req: Request, res: Response) {
        try {
            const recipe = await Recipe.findById(req.params.id).lean();
            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            const [author, commentsCount] = await Promise.all([
                User.findById(recipe.userId).select("name username avatarUrl").lean(),
                CommentModel.countDocuments({ recipeId: recipe._id }),
            ]);

            const authorName = author?.name?.trim() || author?.username?.trim() || "Unknown User";

            return res.status(200).json({
                id: String(recipe._id),
                title: recipe.title,
                image: recipe.image,
                description: recipe.description,
                createdAt: recipe.createdAt,
                createdAtLabel: formatCreatedAt(recipe.createdAt),
                badges: {
                    cookTime: recipe.cookTime,
                    servings: recipe.servings,
                    difficulty: recipe.difficulty,
                },
                stats: {
                    likesCount: recipe.likedBy.length,
                    commentsCount,
                },
                author: {
                    id: author ? String(author._id) : "",
                    name: authorName,
                    username: author?.username?.trim() || "",
                    avatarUrl: author?.avatarUrl ?? "",
                },
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                likedBy: recipe.likedBy.map((id) => String(id)),
            });
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async getMyRecipes(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            const data = await Recipe.find({ userId }).sort({ createdAt: -1 });
            return res.status(200).json({ data });
        } catch (error) {
            return this.handleError(res, error);
        }
    }

    async searchRecipes(req: AuthRequest, res: Response): Promise<Response | void> {
        const { query } = req.body;

        if (query === undefined || query === null) {
            return res.status(400).json({ error: "Query is required" });
        }

        if (typeof query !== "string") {
            return res.status(400).json({ error: "Query must be a string" });
        }

        const trimmedQuery = query.trim();
        if (trimmedQuery === "") {
            return res.status(400).json({ error: "Query cannot be empty" });
        }

        if (trimmedQuery.length > 500) {
            return res.status(400).json({ error: "Query is too long" });
        }

        try {
            let recipes;
            try {
                recipes = await recipeService.searchRecipes(trimmedQuery);
            } catch (searchError) {
                console.warn("Semantic search failed, falling back to simple search:", searchError);
                recipes = await recipeService.simpleRecipeSearch(trimmedQuery);
            }

            return res.status(200).json({
                data: recipes,
                query: trimmedQuery,
            });
        } catch (error) {
            console.error("[RecipeController.searchRecipes] Error:", error);
            return res.status(500).json({ error: "Internal server error" });
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

        const textToEmbed = `${title} ${description} ${ingredients.join(" ")} ${cookTime} ${difficulty}`;
        let embedding: number[];
        try {
            embedding = await embeddingService.embed(textToEmbed);
        } catch (err) {
            console.error("Embedding failed:", err);
            return res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
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
            embedding,
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

            const title = req.body.title ?? recipe.title;
            const description = req.body.description ?? recipe.description;
            const ingredients = req.body.ingredients ?? recipe.ingredients;
            const cookTime = req.body.cookTime ?? recipe.cookTime;
            const difficulty = req.body.difficulty ?? recipe.difficulty;

            const textToEmbed = `${title} ${description} ${ingredients.join(" ")} ${cookTime} ${difficulty}`;
            let embedding: number[];
            try {
                embedding = await embeddingService.embed(textToEmbed);
            } catch (err) {
                console.error("Embedding failed:", err);
                return res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
            }

            req.body.embedding = embedding;
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
