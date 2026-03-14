import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Assignment 2 API',
            version: '1.0.0',
            description: 'API for managing Users, Recipes, and Comments',
            contact: {
                name: 'Yahav & Rotem',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        email: { type: 'string', example: 'test@test.com' },
                        password: { type: 'string', example: 'password123' },
                        refreshTokens: { type: 'array', items: { type: 'string' } },
                        name: { type: 'string', example: 'Maria Chen' },
                        username: { type: 'string', example: 'mariachen' },
                        avatarUrl: { type: 'string', example: 'https://example.com/avatar.png' },
                        bio: { type: 'string', example: 'Home cook and food photographer.' },
                        website: { type: 'string', example: 'tasteshare.co/maria' },
                        location: { type: 'string', example: 'San Francisco, CA' },
                        savedRecipes: { type: 'array', items: { type: 'string' } },
                    },
                },
                Recipe: {
                    type: 'object',
                    required: ['userId', 'image', 'title', 'description', 'ingredients', 'instructions', 'likedBy', 'cookTime', 'servings', 'difficulty'],
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        userId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        image: { type: 'string', example: 'https://example.com/recipe.jpg' },
                        title: { type: 'string', example: 'Creamy Garlic Tuscan Pasta' },
                        description: { type: 'string', example: 'A rich and comforting weeknight pasta.' },
                        ingredients: { type: 'array', items: { type: 'string' } },
                        instructions: { type: 'array', items: { type: 'string' } },
                        likedBy: { type: 'array', items: { type: 'string' } },
                        cookTime: { type: 'string', example: '25 min' },
                        servings: { type: 'number', example: 4 },
                        difficulty: { type: 'string', example: 'Easy' },
                    },
                },
                Comment: {
                    type: 'object',
                    required: ['recipeId', 'userId', 'text'],
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
                        recipeId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        userId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        text: { type: 'string', example: 'Looks delicious!' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
