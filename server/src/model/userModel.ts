import { Schema, model, Types } from "mongoose";

export interface IUser {
    email: string;
    password: string;
    refreshTokens: string[];
    username: string;
    avatarUrl: string;
    bio: string;
    website: string;
    location: string;
    savedPosts: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
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
        username: {
            type: String,
            default: "",
            trim: true,
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
        savedPosts: [
            {
                type: Schema.Types.ObjectId,
                ref: "Post",
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.path("savedPosts").default(() => []);

export default model<IUser>("User", userSchema);