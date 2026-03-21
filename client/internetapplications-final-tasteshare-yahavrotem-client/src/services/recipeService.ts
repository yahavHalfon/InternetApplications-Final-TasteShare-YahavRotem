import { API_BASE_URL } from "../config/env";

export type ApiRecipe = {
  _id: string;
  userId: string;
  image: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  likedBy?: string[];
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  createdAt: string;
  updatedAt: string;
};

export type PaginatedRecipesResponse = {
  data: ApiRecipe[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export const getRecipes = async (page: number, limit: number): Promise<PaginatedRecipesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/recipes?${params.toString()}`);

  if (!response.ok) {
    const fallbackMessage = "Failed to load recipes.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as PaginatedRecipesResponse;
};

export const recipeService = {
  getRecipes,
};
