import express from "express";
import authMiddleware from "../middleware/authMiddleware";
const router = express.Router();
import recipeController from "../controllers/recipeController";

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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 */
router.get("/", recipeController.get.bind(recipeController));

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
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: The recipe was not found
 */
router.get("/:id", recipeController.getById.bind(recipeController));

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
router.post("/", authMiddleware, recipeController.create.bind(recipeController));

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

export default router;
