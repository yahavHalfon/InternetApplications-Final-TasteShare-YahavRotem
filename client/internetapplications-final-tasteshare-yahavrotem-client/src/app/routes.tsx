import { lazy } from "react";
import { Navigate, useParams } from "react-router-dom";

const RecipeDetailScreen = lazy(() => import("../pages/RecipeDetailScreen"));

export function RecipeDetailRoute() {
  const params = useParams();
  const recipeId = params.id;

  if (!recipeId) {
    return <Navigate to="/recipes" replace />;
  }

  return <RecipeDetailScreen recipeId={recipeId} />;
}
