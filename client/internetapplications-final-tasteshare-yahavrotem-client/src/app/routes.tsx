import { lazy } from "react";
import { Navigate, useParams } from "react-router-dom";

const RecipeDetailScreen = lazy(() => import("../pages/RecipeDetailScreen"));

type RecipeDetailRouteProps = {
  token?: string;
  userId?: string;
};

export function RecipeDetailRoute({ token, userId }: RecipeDetailRouteProps) {
  const params = useParams();
  const recipeId = params.id;

  if (!recipeId) {
    return <Navigate to="/recipes" replace />;
  }

  return <RecipeDetailScreen recipeId={recipeId} token={token} userId={userId} />;
}
