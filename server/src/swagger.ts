import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Assignment 2 API',
            version: '1.0.0',
            description: 'API for managing Users, Posts, and Comments',
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
                    },
                },
                Post: {
                    type: 'object',
                    required: ['title', 'content', 'sender'],
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        title: { type: 'string', example: 'My First Post' },
                        content: { type: 'string', example: 'This is the content' },
                        sender: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                    },
                },
                Comment: {
                    type: 'object',
                    required: ['postId', 'message', 'sender'],
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
                        postId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        message: { type: 'string', example: 'Great post!' },
                        sender: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
