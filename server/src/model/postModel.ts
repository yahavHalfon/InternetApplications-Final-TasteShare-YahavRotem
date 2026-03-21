import { Schema, model } from "mongoose";

export type PostDifficulty = "Easy" | "Medium" | "Advanced";

export interface IPost {
  id: string;
  username: string;
  userImageUrl: string;
  content: string;
  imageUrl?: string;
  title?: string;
  createdAtText?: string;
  likesCount?: number;
  commentsCount?: number;
  cookTime?: string;
  difficulty?: PostDifficulty;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    userImageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    createdAtText: {
      type: String,
      trim: true,
    },
    likesCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    commentsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    cookTime: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Advanced"],
    },
  },
  {
    timestamps: true,
  }
);

export default model<IPost>("Post", postSchema);