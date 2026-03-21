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

const getRecipes = async (): Promise<ApiRecipe[]> => {
  const response = await fetch(`${API_BASE_URL}/recipes`);

  if (!response.ok) {
    const fallbackMessage = "Failed to load recipes.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as ApiRecipe[];
};

export const recipeService = {
  getRecipes,
};
