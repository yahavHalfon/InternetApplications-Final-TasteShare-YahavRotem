import express from "express";
import postController from "../controllers/postController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: The Feed posts API
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Returns the list of all feed posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: The list of feed posts
 */
router.get("/", postController.get.bind(postController));

export default router;
