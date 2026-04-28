# TasteShare

A recipe-sharing social web application where users can create, discover, and interact with recipes. Features AI-powered semantic search using Google Gemini embeddings, social interactions (likes, comments), user profiles, and Google OAuth authentication.

**Authors:** Yahav Halfon & Rotem Sidi

---

## Features

- User registration and login (email/password + Google OAuth)
- Create, edit, and delete recipes with image upload
- AI-powered semantic recipe search (Gemini embeddings with cosine similarity)
- Fallback text-based search when AI search fails
- Like and unlike recipes
- Comment on recipes
- Editable user profiles (name, bio, website, location, avatar)
- Paginated recipe feed
- JWT authentication with refresh token rotation
- Interactive API documentation (Swagger UI)

---

## Tech Stack

### Server
- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose 9
- **Auth:** JWT (jsonwebtoken), bcrypt, Google Auth Library
- **File Uploads:** Multer
- **AI Search:** Google Gemini API (text embeddings)
- **API Docs:** swagger-jsdoc + swagger-ui-express
- **Testing:** Jest 30, ts-jest, Supertest

### Client
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 8
- **UI Library:** Material UI (MUI) 7
- **Routing:** React Router DOM 7
- **HTTP:** Axios
- **Auth:** @react-oauth/google

---

## Project Structure

```
root/
├── server/                          # Express API server
│   ├── src/
│   │   ├── controllers/             # Request handlers (auth, recipe, user, comment)
│   │   ├── middleware/              # Auth middleware, file upload config
│   │   ├── model/                   # Mongoose schemas (User, Recipe, Comment)
│   │   ├── routes/                  # Route definitions with Swagger JSDoc
│   │   ├── services/                # Business logic (embedding, recipe search)
│   │   ├── helpers/                 # Utilities (cosine similarity)
│   │   └── tests/                   # Jest integration + unit tests
│   ├── uploads/                     # Uploaded images (recipes, profiles)
│   ├── .env.example                 # Environment variable template
│   └── package.json
│
└── client/
    └── internetapplications-final-tasteshare-yahavrotem-client/
        ├── src/
        │   ├── components/          # Reusable UI components
        │   ├── pages/               # Page-level components
        │   ├── services/            # API service layer
        │   ├── context/             # Auth context + useAuth hook
        │   └── types/               # TypeScript type definitions
        ├── .env.example             # Environment variable template
        └── package.json
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud project with Gemini API enabled (for AI search)
- Google OAuth 2.0 client credentials (for Google sign-in)

### Server

```bash
cd server
npm install
cp .env.example .env.dev
# Edit .env.dev with your values
npm run dev
```

### Client

```bash
cd client/internetapplications-final-tasteshare-yahavrotem-client
npm install
cp .env.example .env.dev
# Edit .env.dev with your values
npm run dev
```

---

## Environment Variables

### Server (`server/.env.dev`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/tasteshare` |
| `JWT_SECRET` | Secret key for signing JWTs | `your-secret-key` |
| `JWT_EXPIRES_IN` | Access token TTL in seconds | `3600` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL in seconds | `28800` |
| `GEMINI_API_KEY` | Google Gemini API key for AI search | `AIza...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxxx.apps.googleusercontent.com` |

### Client (`client/.../.env.dev`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Server base URL | `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxxx.apps.googleusercontent.com` |

---

## API Endpoints

All endpoints are documented interactively at `/api-docs` when the server is running.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | - | Register new user |
| POST | `/auth/login` | - | Login with email/password |
| POST | `/auth/google` | - | Sign in with Google |
| POST | `/auth/logout` | ✓ | Logout (invalidate refresh token) |
| POST | `/auth/refresh` | - | Refresh access token |
| GET | `/recipes` | - | Get paginated recipe feed |
| GET | `/recipes/me` | ✓ | Get authenticated user's recipes |
| POST | `/recipes/search` | ✓ | AI-powered semantic search |
| GET | `/recipes/:id` | - | Get recipe details |
| POST | `/recipes` | ✓ | Create recipe (with image upload) |
| PUT | `/recipes/:id` | ✓ | Update recipe (owner only) |
| DELETE | `/recipes/:id` | ✓ | Delete recipe (owner only) |
| POST | `/recipes/:id/like` | ✓ | Toggle like on a recipe |
| GET | `/recipes/:id/comments` | - | Get recipe comments |
| POST | `/recipes/:id/comments` | ✓ | Add a comment to a recipe |
| GET | `/users/profile` | ✓ | Get authenticated user's profile |
| PUT | `/users/profile` | ✓ | Update authenticated user's profile |
| PUT | `/users/profile/picture` | ✓ | Upload profile picture |
| GET | `/users/:id` | - | Get public user profile by ID |

---

## AI Search

Semantic search uses Google Gemini to embed recipe text (title + description + ingredients) into 768-dimensional vectors at creation time. At search time, the query is embedded and compared against stored vectors using cosine similarity. Recipes scoring above a similarity threshold (0.55) are returned ranked by score. If the Gemini API is unavailable, search falls back to a MongoDB regex-based text match.

---

## Testing

```bash
cd server
npm test
```

Runs Jest with coverage. Test files cover auth flows, recipe CRUD, likes, comments, user profiles, and search.

---

## Available Scripts

### Server
```bash
npm run dev        # Start development server with nodemon
npm run start      # Build TypeScript and run production server
npm run test       # Run tests with coverage
npm run seed       # Seed database with sample data
npm run lint       # Check for lint errors
npm run lint:fix   # Auto-fix lint errors
```

### Client
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run lint       # Check for lint errors
```
