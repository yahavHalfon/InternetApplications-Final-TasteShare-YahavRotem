import express from "express";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments managing API - All comment operations are now handled through /recipes/:id/comments routes
 */

// Note: All comment endpoints have been moved to recipe routes:
// GET  /recipes/:id/comments     - Get recipe comments
// POST /recipes/:id/comments     - Create recipe comment
// Comments can be edited and deleted through /comments/:id endpoints or removed as needed.

export default router;
