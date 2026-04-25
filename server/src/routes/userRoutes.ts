import express from "express";
const router = express.Router();
import userController from "../controllers/userController";
import authenticate from "../middleware/authMiddleware";
import { uploadProfileImage } from "../middleware/upload";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users managing API
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns the list of all the users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of the users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", userController.get.bind(userController));

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get the authenticated user's own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 */
router.get("/profile", authenticate, userController.getProfile.bind(userController));

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria Chen
 *               email:
 *                 type: string
 *                 example: maria@example.com
 *               username:
 *                 type: string
 *                 example: mariachen
 *               bio:
 *                 type: string
 *                 example: Home cook and food photographer.
 *               website:
 *                 type: string
 *                 example: https://mariachen.com
 *               location:
 *                 type: string
 *                 example: San Francisco, CA
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Invalid email format or empty username
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       409:
 *         description: Email or username already taken
 */
router.put("/profile", authenticate, userController.updateProfile.bind(userController));

/**
 * @swagger
 * /users/profile/picture:
 *   put:
 *     summary: Update the authenticated user's profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profileImage
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: The profile image file to upload
 *     responses:
 *       200:
 *         description: Updated user profile with new avatar URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Profile image is required
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 */
router.put(
	"/profile/picture",
	authenticate,
	uploadProfileImage.single("profileImage"),
	userController.updateProfilePicture.bind(userController)
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get the user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: The user was not found
 */
router.get("/:id", userController.getById.bind(userController));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove the user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user was deleted
 *       404:
 *         description: The user was not found
 */
router.delete("/:id", userController.delete.bind(userController));

export default router;