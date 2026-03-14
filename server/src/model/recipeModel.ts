import { Schema, model, Types } from "mongoose";

export type RecipeDifficulty = "Easy" | "Medium" | "Advanced";

export interface IPost {
    userId: Types.ObjectId;
    sender?: Types.ObjectId;
    image: string;
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    cookTime: string;
    servings: number;
    difficulty: RecipeDifficulty;
    likes: Types.ObjectId[];
    comments: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            alias: "sender",
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
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
    },
    {
        timestamps: true,
    }
);

postSchema.path("likes").default(() => []);
postSchema.path("comments").default(() => []);

export default model<IPost>("Post", postSchema);
