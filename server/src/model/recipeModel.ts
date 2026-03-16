import { Schema, model, Types } from "mongoose";

export type RecipeDifficulty = "Easy" | "Medium" | "Advanced";

export interface IRecipe {
    userId: Types.ObjectId;
    image: string;
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    likedBy: Types.ObjectId[];
    cookTime: string;
    servings: number;
    difficulty: RecipeDifficulty;
    createdAt: Date;
    updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        image: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        ingredients: [
            {
                type: String,
                required: true,
                trim: true,
            },
        ],
        instructions: [
            {
                type: String,
                required: true,
                trim: true,
            },
        ],
        likedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        cookTime: {
            type: String,
            required: true,
            trim: true,
        },
        servings: {
            type: Number,
            required: true,
            min: 1,
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Advanced"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

recipeSchema.path("likedBy").default(() => []);

export default model<IRecipe>("Recipe", recipeSchema);
