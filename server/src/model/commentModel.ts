import { Schema, model, Types } from "mongoose";

export interface IComment {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  sender?: Types.ObjectId;
  text: string;
  message?: string;
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "sender",
    },
    text: {
      type: String,
      required: true,
      trim: true,
      alias: "message",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

commentSchema.path("likes").default(() => []);

export default model<IComment>("Comment", commentSchema);
