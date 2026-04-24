# Internet Applications Assignment 2

This is a backend project using Node.js, Express, TypeScript, and MongoDB.

## Prerequisites

- Node.js
- Docker (for running MongoDB)

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Ensure you have a `.env.dev` file in the root directory with the following content:

```properties
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tasteshare
JWT_SECRET=replace_with_your_jwt_secret
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=28800
```

## Running the Application

1. Start the MongoDB container:
   ```bash
   docker-compose up -d
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`.

## API Documentation

Swagger API documentation is available at `http://localhost:3000/api-docs`.

## API Reference

### Authentication

#### Register

**URL** : `/auth/register`
**Method** : `POST`
**Body** :
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```
**Success Response** :
- **Code** : `201 CREATED`
- **Content** : `{ "token": "...", "refreshToken": "...", "user": { ... } }`

**Curl Example** :
```bash
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{
    "email": "user@example.com",
    "password": "password123"
}'
```

#### Login

**URL** : `/auth/login`
**Method** : `POST`
**Body** :
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```
**Success Response** :
- **Code** : `200 OK`
- **Content** : `{ "token": "...", "refreshToken": "...", "user": { ... } }`

**Curl Example** :
```bash
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{
    "email": "user@example.com",
    "password": "password123"
}'
```

#### Refresh Token

**URL** : `/auth/refresh`
**Method** : `POST`
**Body** :
```json
{
    "refreshToken": "..."
}
```
**Success Response** :
- **Code** : `200 OK`
- **Content** : `{ "token": "...", "refreshToken": "...", "user": { ... } }`

**Curl Example** :
```bash
curl -X POST http://localhost:3000/auth/refresh \
-H "Content-Type: application/json" \
-d '{
    "refreshToken": "<REFRESH_TOKEN>"
}'
```

#### Logout

**URL** : `/auth/logout`
**Method** : `POST`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "refreshToken": "..."
}
```
**Success Response** :
- **Code** : `200 OK`

**Curl Example** :
```bash
curl -X POST http://localhost:3000/auth/logout \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "refreshToken": "<REFRESH_TOKEN>"
}'
```

### Recipes

#### Get all recipes

**URL** : `/recipes`
**Method** : `GET`
**Response Shape** :
```json
{
    "data": [
        {
            "_id": "...",
            "userId": "...",
            "image": "/uploads/recipes/file.jpg",
            "title": "...",
            "description": "...",
            "ingredients": ["..."],
            "instructions": ["..."],
            "likedBy": ["..."],
            "cookTime": "25 min",
            "servings": 4,
            "difficulty": "Easy",
            "commentsCount": 3,
            "createdAt": "...",
            "updatedAt": "..."
        }
    ],
    "page": 1,
    "limit": 10,
    "total": 30,
    "hasMore": true
}
```
**Curl Example** :
```bash
curl http://localhost:3000/recipes
```

#### Get recipes

**URL** : `/recipes`
**Method** : `GET`

**Curl Example** :
```bash
curl "http://localhost:3000/recipes"
```

#### Get a recipe by ID

**URL** : `/recipes/:id`
**Method** : `GET`
**Response Shape** :
```json
{
    "id": "...",
    "title": "...",
    "image": "/uploads/recipes/file.jpg",
    "description": "...",
    "createdAt": "...",
    "createdAtLabel": "12 Mar 2026",
    "badges": {
        "cookTime": "25 min",
        "servings": 4,
        "difficulty": "Easy"
    },
    "stats": {
        "likesCount": 10,
        "commentsCount": 4
    },
    "author": {
        "id": "...",
        "name": "...",
        "username": "...",
        "avatarUrl": "..."
    },
    "ingredients": ["..."],
    "instructions": ["..."],
    "likedBy": ["..."]
}
```

**Curl Example** :
```bash
curl http://localhost:3000/recipes/<RECIPE_ID>
```

#### Create a new recipe

**URL** : `/recipes`
**Method** : `POST`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "title": "My Recipe Title",
    "description": "Recipe description",
    "image": "https://example.com/recipe.jpg",
    "ingredients": ["1 cup flour"],
    "instructions": ["Mix ingredients"],
    "cookTime": "25 min",
    "servings": 2,
    "difficulty": "Easy"
}
```
**Curl Example** :
```bash
curl -X POST http://localhost:3000/recipes \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "title": "My First Recipe",
    "description": "This is the description of my first recipe.",
    "image": "https://example.com/recipe.jpg",
    "ingredients": ["1 cup flour"],
    "instructions": ["Mix ingredients"],
    "cookTime": "25 min",
    "servings": 2,
    "difficulty": "Easy"
}'
```

#### Update a recipe

**URL** : `/recipes/:id`
**Method** : `PUT`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "title": "Updated Title",
    "description": "Updated Description"
}
```

**Curl Example** :
```bash
curl -X PUT http://localhost:3000/recipes/<RECIPE_ID> \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "title": "Updated Title",
    "description": "Updated Description"
}'
```

#### Delete a recipe

**URL** : `/recipes/:id`
**Method** : `DELETE`
**Headers** : `Authorization: Bearer <token>`

**Curl Example** :
```bash
curl -X DELETE http://localhost:3000/recipes/<RECIPE_ID> \
-H "Authorization: Bearer <token>"
```

### Comments

#### Get recipe comments

**URL** : `/recipes/:id/comments`
**Method** : `GET`

**Curl Example** :
```bash
curl http://localhost:3000/recipes/<RECIPE_ID>/comments
```

#### Create recipe comment

**URL** : `/recipes/:id/comments`
**Method** : `POST`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "text": "Looks delicious!"
}
```

**Curl Example** :
```bash
curl -X POST http://localhost:3000/recipes/<RECIPE_ID>/comments \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "text": "Looks delicious!"
}'
```

## Data Models

### AuthSession

```json
{
    "token": "...",
    "refreshToken": "...",
    "user": {
        "id": "...",
        "email": "user@example.com",
        "name": "Maria Chen",
        "username": "mariachen",
        "avatarUrl": "/uploads/profiles/file.jpg",
        "bio": "...",
        "website": "https://...",
        "location": "Tel Aviv"
    }
}
```

### Recipe Model

```json
{
    "_id": "...",
    "userId": "...",
    "image": "/uploads/recipes/file.jpg",
    "title": "...",
    "description": "...",
    "ingredients": ["..."],
    "instructions": ["..."],
    "likedBy": ["..."],
    "cookTime": "25 min",
    "servings": 4,
    "difficulty": "Easy",
    "createdAt": "...",
    "updatedAt": "..."
}
```

### Comment Model

```json
{
    "_id": "...",
    "recipeId": "...",
    "userId": "...",
    "text": "Looks delicious!",
    "createdAt": "...",
    "updatedAt": "..."
}
```

### Users

#### Get all users

**URL** : `/users`
**Method** : `GET`

**Curl Example** :
```bash
curl http://localhost:3000/users
```

#### Get a user by ID

**URL** : `/users/:id`
**Method** : `GET`

**Curl Example** :
```bash
curl http://localhost:3000/users/<USER_ID>
```

#### Delete a user

**URL** : `/users/:id`
**Method** : `DELETE`

**Curl Example** :
```bash
curl -X DELETE http://localhost:3000/users/<USER_ID>
```
