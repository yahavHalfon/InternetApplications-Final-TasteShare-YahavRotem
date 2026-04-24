# InternetApplications-Final-TasteShare-YahavRotem

## Client Architecture (Defense Notes)

### Top-Level Flow
- `src/main.tsx` sets up providers (`ThemeProvider`, `CssBaseline`, `BrowserRouter`, optional `GoogleOAuthProvider`).
- `src/App.tsx` is the auth/session orchestrator.

### Authenticated vs Unauthenticated UI
- When no session exists, `App` renders `AuthScreen`.
- When session exists, `App` renders `MainLayout`.
- Login/register/google success all navigate to `/feed` explicitly.

### Layout and Routing
- `MainLayout` owns the authenticated shell (`Sidebar` + route outlet region).
- Route metadata is kept in `src/app/routeConfig.ts`.
- Route helper components are in `src/app/routes.tsx`.
- Main screens are route-level lazy loaded to keep the initial bundle smaller.

### Screen Responsibilities
- `FeedScreen`: recipe feed, pagination, user resolution, modal opening.
- `CreatePostScreen`: recipe creation form, image validation/upload, submit.
- `ProfileScreen`: profile load/edit/save, avatar update, user recipe section.
- `RecipeDetailScreen`: full recipe details page by id.
- `AuthScreen`: login/register two-step flow and Google sign-in UI.

### Service Layer
- `authService`: login/register/refresh/logout/google sign-in.
- `recipeService`: feed retrieval, recipe details, like toggle, create recipe.
- `userService`: profile retrieval/update and avatar update.

### Why This Structure Is Defensible
- Clear separation of concerns between orchestration (`App`), layout (`MainLayout`), and feature screens.
- Reusable API interaction isolated in services.
- Route configuration separated from route components for readability and lint/HMR stability.
- Consistent design system through MUI theme tokens.