import { API_BASE_URL } from "../config/env";
import type { RecipeComment } from "../types/comment";

const getRecipeComments = async (recipeId: string): Promise<RecipeComment[]> => {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments`);
  if (!response.ok) {
    const fallbackMessage = "Failed to load comments.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as RecipeComment[];
};

const createRecipeComment = async (recipeId: string, text: string, token: string): Promise<RecipeComment> => {
  const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to create comment.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as RecipeComment;
};

export const commentService = {
  getRecipeComments,
  createRecipeComment,
};
