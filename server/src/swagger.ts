import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TasteShare API',
            version: '2.0.0',
            description: 'REST API for TasteShare - a recipe sharing social platform with AI-powered semantic search',
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
                PublicUser: {
                    type: 'object',
                    required: ['id', 'email', 'name', 'username', 'avatarUrl', 'bio', 'website', 'location'],
                    properties: {
                        id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        email: { type: 'string', example: 'test@test.com' },
                        name: { type: 'string', example: 'Maria Chen' },
                        username: { type: 'string', example: 'mariachen' },
                        avatarUrl: { type: 'string', example: '/uploads/profiles/avatar.png' },
                        bio: { type: 'string', example: 'Home cook and food photographer.' },
                        website: { type: 'string', example: 'https://tasteshare.co/maria' },
                        location: { type: 'string', example: 'San Francisco, CA' },
                    },
                },
                AuthSession: {
                    type: 'object',
                    required: ['token', 'refreshToken', 'user'],
                    properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/PublicUser' },
                    },
                },
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
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                RecipeListItem: {
                    allOf: [
                        { $ref: '#/components/schemas/Recipe' },
                        {
                            type: 'object',
                            properties: {
                                commentsCount: { type: 'number', example: 7 },
                            },
                        },
                    ],
                },
                RecipeListResponse: {
                    type: 'object',
                    required: ['data', 'page', 'limit', 'total', 'hasMore'],
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/RecipeListItem' },
                        },
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 10 },
                        total: { type: 'number', example: 42 },
                        hasMore: { type: 'boolean', example: true },
                    },
                },
                RecipeDetails: {
                    type: 'object',
                    required: ['id', 'title', 'image', 'description', 'createdAt', 'createdAtLabel', 'badges', 'stats', 'author', 'ingredients', 'instructions', 'likedBy'],
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        image: { type: 'string' },
                        description: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        createdAtLabel: { type: 'string', example: '12 Mar 2026' },
                        badges: {
                            type: 'object',
                            properties: {
                                cookTime: { type: 'string', example: '25 min' },
                                servings: { type: 'number', example: 4 },
                                difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Advanced'] },
                            },
                        },
                        stats: {
                            type: 'object',
                            properties: {
                                likesCount: { type: 'number', example: 16 },
                                commentsCount: { type: 'number', example: 5 },
                            },
                        },
                        author: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                username: { type: 'string' },
                                avatarUrl: { type: 'string' },
                            },
                        },
                        ingredients: { type: 'array', items: { type: 'string' } },
                        instructions: { type: 'array', items: { type: 'string' } },
                        likedBy: { type: 'array', items: { type: 'string' } },
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
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                RecipeCommentResponse: {
                    type: 'object',
                    required: ['id', 'recipeId', 'text', 'createdAt', 'author'],
                    properties: {
                        id: { type: 'string' },
                        recipeId: { type: 'string' },
                        text: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        author: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                avatarUrl: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
