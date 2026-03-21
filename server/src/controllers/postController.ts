import { Request, Response } from "express";
import BaseController from "./baseController";
import Post from "../model/postModel";
import type { IPost } from "../model/postModel";

class PostController extends BaseController<IPost> {
  constructor() {
    super(Post);
  }

  async get(_req: Request, res: Response): Promise<Response | void> {
    try {
      const posts = await Post.find().sort({ id: 1 });
      return res.status(200).json(posts);
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

export default new PostController();
