import express from "express";
const router = express.Router();
import commentController from "../controllers/commentController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments managing API
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Returns the list of all the comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: The list of the comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get("/", commentController.get.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get the comment by id
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     responses:
 *       200:
 *         description: The comment description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: The comment was not found
 */
router.get("/:id", commentController.getById.bind(commentController));

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - message
 *             properties:
 *               postId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: The comment was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/", authMiddleware, commentController.create.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update the comment by id
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: The comment was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The comment was not found
 */
router.put("/:id", authMiddleware, commentController.put.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Remove the comment by id
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     responses:
 *       200:
 *         description: The comment was deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The comment was not found
 */
router.delete("/:id", authMiddleware, commentController.delete.bind(commentController));

export default router;
