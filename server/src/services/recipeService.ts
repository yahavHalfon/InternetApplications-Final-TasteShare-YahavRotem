import Recipe from "../model/recipeModel";
import CommentModel from "../model/commentModel";
import embeddingService from "./embeddingService";
import { cosineSimilarity } from "../helpers/vectorMath";

const TOP_K_RESULTS = 10;
const SIMILARITY_THRESHOLD = 0.55;

class RecipeService {
    async searchRecipes(queryText: string) {
        const queryEmbedding = await embeddingService.embed(queryText);

        const recipes = await Recipe.find().select("+embedding").lean();

        const scored = recipes.map((recipe) => ({
            ...recipe,
            score: cosineSimilarity(queryEmbedding, recipe.embedding),
        }));

        const filtered = scored.filter((r) => r.score >= SIMILARITY_THRESHOLD);
        filtered.sort((a, b) => b.score - a.score);
        const top = filtered.slice(0, TOP_K_RESULTS);

        const results = await Promise.all(
            top.map(async (recipe) => {
                const commentsCount = await CommentModel.countDocuments({ recipeId: recipe._id });
                const { embedding: _embedding, score: _score, ...rest } = recipe;
                return { ...rest, commentsCount };
            })
        );

        return results;
    }

    async simpleRecipeSearch(query: string) {
        try {
            const recipes = await Recipe.find({
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                ],
            })
                .sort({ createdAt: -1 })
                .limit(TOP_K_RESULTS)
                .lean();

            const results = await Promise.all(
                recipes.map(async (recipe) => {
                    const commentsCount = await CommentModel.countDocuments({ recipeId: recipe._id });
                    return { ...recipe, commentsCount };
                })
            );

            return results;
        } catch (error) {
            console.error("Simple search error:", error);
            return [];
        }
    }
}

export default new RecipeService();