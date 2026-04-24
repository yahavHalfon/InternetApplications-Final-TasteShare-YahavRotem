import { Schema, model, Types } from "mongoose";

export interface IUser {
    email: string;
    password: string;
    refreshTokens: string[];
    name: string;
    username: string;
    avatarUrl: string;
    bio: string;
    website: string;
    location: string;
    savedRecipes: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        refreshTokens: {
            type: [String],
            default: [],
        },
        name: {
            type: String,
            default: "",
            trim: true,
        },
        username: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },
        avatarUrl: {
            type: String,
            default: "",
            trim: true,
        },
        bio: {
            type: String,
            default: "",
            trim: true,
        },
        website: {
            type: String,
            default: "",
            trim: true,
        },
        location: {
            type: String,
            default: "",
            trim: true,
        },
        savedRecipes: [
            {
                type: Schema.Types.ObjectId,
                ref: "Recipe",
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.path("savedRecipes").default(() => []);

userSchema.index({ email: 1 }, { unique: true });

userSchema.index({ username: 1 }, { unique: true });

export default model<IUser>("User", userSchema);