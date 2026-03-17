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
- **Content** : `{ "token": "...", "refreshToken": "..." }`

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
- **Content** : `{ "token": "...", "refreshToken": "..." }`

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
- **Content** : `{ "token": "...", "refreshToken": "..." }`

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

### Posts

#### Get all posts

**URL** : `/post`
**Method** : `GET`
**Curl Example** :
```bash
curl http://localhost:3000/post
```

#### Get posts by sender

**URL** : `/post?sender=<SENDER_ID>`
**Method** : `GET`

**Curl Example** :
```bash
curl "http://localhost:3000/post?sender=<SENDER_ID>"
```

#### Get a post by ID

**URL** : `/post/:id`
**Method** : `GET`

**Curl Example** :
```bash
curl http://localhost:3000/post/<POST_ID>
```

#### Create a new post

**URL** : `/post`
**Method** : `POST`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "title": "My Post Title",
    "content": "Content of the post"
}
```
**Curl Example** :
```bash
curl -X POST http://localhost:3000/post \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "title": "My First Post",
    "content": "This is the content of my first post."
}'
```

#### Update a post

**URL** : `/post/:id`
**Method** : `PUT`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "title": "Updated Title",
    "content": "Updated Content"
}
```

**Curl Example** :
```bash
curl -X PUT http://localhost:3000/post/<POST_ID> \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "title": "Updated Title",
    "content": "Updated Content"
}'
```

#### Delete a post

**URL** : `/post/:id`
**Method** : `DELETE`
**Headers** : `Authorization: Bearer <token>`

**Curl Example** :
```bash
curl -X DELETE http://localhost:3000/post/<POST_ID> \
-H "Authorization: Bearer <token>"
```

### Comments

#### Get all comments

**URL** : `/comments`
**Method** : `GET`

**Curl Example** :
```bash
curl http://localhost:3000/comments
```

#### Get comments by post

**URL** : `/comments?postId=<POST_ID>`
**Method** : `GET`

**Curl Example** :
```bash
curl "http://localhost:3000/comments?postId=<POST_ID>"
```

#### Get a comment by ID

**URL** : `/comments/:id`
**Method** : `GET`

**Curl Example** :
```bash
curl http://localhost:3000/comments/<COMMENT_ID>
```

#### Create a new comment

**URL** : `/comments`
**Method** : `POST`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "postId": "PostID",
    "message": "Comment content"
}
```

**Curl Example** :
```bash
curl -X POST http://localhost:3000/comments \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "postId": "<POST_ID>",
    "message": "Comment content"
}'
```

#### Update a comment

**URL** : `/comments/:id`
**Method** : `PUT`
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
    "message": "Updated Comment Content"
}
```

**Curl Example** :
```bash
curl -X PUT http://localhost:3000/comments/<COMMENT_ID> \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
    "message": "Updated Comment Content"
}'
```

#### Delete a comment

**URL** : `/comments/:id`
**Method** : `DELETE`
**Headers** : `Authorization: Bearer <token>`

**Curl Example** :
```bash
curl -X DELETE http://localhost:3000/comments/<COMMENT_ID> \
-H "Authorization: Bearer <token>"
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
