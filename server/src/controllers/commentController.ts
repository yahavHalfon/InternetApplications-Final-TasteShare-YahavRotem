import { Response } from "express";
import Comment from "../model/commentModel";
import PostModel from "../model/postModel";
import baseController from "./baseController";

import { AuthRequest } from "../middleware/authMiddleware";

class CommentController extends baseController {
    constructor() {
        super(Comment);
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }
            if (comment.sender !== userId) {
                return res.status(403).json({ error: "Unauthorized: You can only delete your own comments" });
            }
            return super.delete(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        const postId = req.body.postId;
        req.body.sender = req.user?._id;
        try {
            const post = await PostModel.findById(postId);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            super.create(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const comment = await Comment.findById(id);
            if (!comment) {
                res.status(404).json({ error: "Comment not found" });
                return;
            }
            if (comment.sender !== userId) {
                res.status(403).json({ error: "Unauthorized: You can only update your own comments" });
                return;
            }
            super.put(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }


}

export default new CommentController();