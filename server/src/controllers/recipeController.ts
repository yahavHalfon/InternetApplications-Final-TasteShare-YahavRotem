import Post from "../model/postModel";
import baseController from "./baseController";

import CommentModel from "../model/commentModel";
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";

class PostController extends baseController {
    constructor() {
        super(Post);
    }

    async create(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            return;
        }
        req.body.sender = userId;
        super.create(req, res);
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const post = await Post.findById(id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            if (post.sender !== userId) {
                res.status(403).json({ error: "Unauthorized: You can only update your own posts" });
                return;
            }
            super.put(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }
            if (post.sender !== userId) {
                return res.status(403).json({ error: "Unauthorized: You can only delete your own posts" });
            }
            await CommentModel.deleteMany({ postId: id });
            return super.delete(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new PostController();
