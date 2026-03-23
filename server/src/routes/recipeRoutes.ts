import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import { uploadRecipeImage } from "../middleware/upload";
const router = express.Router();
import recipeController from "../controllers/recipeController";
import commentController from "../controllers/commentController";

/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: The Recipes managing API
 */

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Returns the list of all recipes
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: The list of recipes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeListResponse'
 */
router.get("/", recipeController.get.bind(recipeController));

/**
 * @swagger
 * /recipes/me:
 *   get:
 *     summary: Returns recipes created by the authenticated user
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, recipeController.getMyRecipes.bind(recipeController));

/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get the recipe by id
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipe id
 *     responses:
 *       200:
 *         description: The recipe description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeDetails'
 *       404:
 *         description: The recipe was not found
 */
router.get("/:id", recipeController.getById.bind(recipeController));

/**
 * @swagger
 * /recipes/{id}/comments:
 *   get:
 *     summary: Get recipe comments formatted for direct UI rendering
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipe id
 *     responses:
 *       200:
 *         description: The recipe comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecipeCommentResponse'
 *       404:
 *         description: Recipe not found
 */
router.get("/:id/comments", commentController.getRecipeComments.bind(commentController));

/**
 * @swagger
 * /recipes/{id}/comments:
 *   post:
 *     summary: Create a new comment for recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipe id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipeCommentResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 */
router.post("/:id/comments", authMiddleware, commentController.createRecipeComment.bind(commentController));

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - title
 *               - description
 *               - ingredients
 *               - instructions
 *               - cookTime
 *               - servings
 *               - difficulty
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *               cookTime:
 *                 type: string
 *               servings:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Advanced]
 *     responses:
 *       201:
 *         description: The recipe was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
router.post("/", authMiddleware, uploadRecipeImage.single("image"), recipeController.create.bind(recipeController));

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update the recipe by id
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipe id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *               cookTime:
 *                 type: string
 *               servings:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Advanced]
 *     responses:
 *       200:
 *         description: The recipe was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The recipe was not found
 */
router.put("/:id", authMiddleware, recipeController.put.bind(recipeController));

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Remove the recipe by id
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipe id
 *     responses:
 *       200:
 *         description: The recipe was deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The recipe was not found
 */
router.delete("/:id", authMiddleware, recipeController.delete.bind(recipeController));

/**
 * @swagger
 * /recipes/{id}/like:
 *   post:
 *     summary: Toggle like on a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The recipe id
 *     responses:
 *       200:
 *         description: The recipe with updated likes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: The recipe was not found
 */
router.post("/:id/like", authMiddleware, recipeController.toggleLike.bind(recipeController));

export default router;
