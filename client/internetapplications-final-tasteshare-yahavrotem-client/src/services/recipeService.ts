import { API_BASE_URL } from "../config/env";

export type ApiRecipe = {
  _id: string;
  userId: string;
  image: string;
  title: string;
  description: string;
  ingredients?: string[];
  instructions?: string[];
  likedBy?: string[];
  commentsCount?: number;
  cookTime: string;
  servings?: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  createdAt: string;
};

export type ApiRecipeDetails = {
  id: string;
  title: string;
  image: string;
  description: string;
  createdAt: string;
  createdAtLabel: string;
  badges: {
    cookTime: string;
    servings: number;
    difficulty: "Easy" | "Medium" | "Advanced";
  };
  stats: {
    likesCount: number;
    commentsCount: number;
  };
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
  ingredients: string[];
  instructions: string[];
  likedBy: string[];
};

export type PaginatedRecipesResponse = {
  data: ApiRecipe[];
  hasMore: boolean;
};

export type UserRecipesResponse = {
  data: ApiRecipe[];
};

export type SearchRecipesResponse = {
  data: (ApiRecipe & { commentsCount?: number })[];
  query: string;
};

export type CreateRecipePayload = {
  image: File;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Advanced";
};

export type UpdateRecipePayload = {
  image?: File;
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  cookTime?: string;
  servings?: number;
  difficulty?: "Easy" | "Medium" | "Advanced";
};

const getRecipes = async (page: number, limit: number): Promise<PaginatedRecipesResponse> => {
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

const createRecipe = async (payload: CreateRecipePayload, token: string): Promise<ApiRecipe> => {
  const formData = new FormData();
  formData.append("image", payload.image);
  formData.append("title", payload.title.trim());
  formData.append("description", payload.description.trim());
  formData.append("ingredients", JSON.stringify(payload.ingredients));
  formData.append("instructions", JSON.stringify(payload.instructions));
  formData.append("cookTime", payload.cookTime.trim());
  formData.append("servings", String(payload.servings));
  formData.append("difficulty", payload.difficulty);

  const response = await fetch(`${API_BASE_URL}/recipes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to create recipe.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as ApiRecipe;
};

const searchRecipes = async (query: string, token: string): Promise<SearchRecipesResponse> => {
  const response = await fetch(`${API_BASE_URL}/recipes/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const fallbackMessage = "Search failed. Please try again.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as SearchRecipesResponse;
};

export const recipeService = {
  getRecipes,
  getRecipeById: async (recipeId: string): Promise<ApiRecipeDetails> => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`);
    if (!response.ok) {
      const fallbackMessage = "Failed to load recipe details.";
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || fallbackMessage);
    }

    return (await response.json()) as ApiRecipeDetails;
  },

  getMyRecipes: async (token: string): Promise<UserRecipesResponse> => {
    const response = await fetch(`${API_BASE_URL}/recipes/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const fallbackMessage = "Failed to load your recipes.";
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || fallbackMessage);
    }

    return (await response.json()) as UserRecipesResponse;
  },
  searchRecipes,
  createRecipe,
  updateRecipe: async (recipeId: string, payload: UpdateRecipePayload, token: string): Promise<ApiRecipe> => {
    const formData = new FormData();
    if (payload.image) formData.append("image", payload.image);
    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.ingredients !== undefined) formData.append("ingredients", JSON.stringify(payload.ingredients));
    if (payload.instructions !== undefined) formData.append("instructions", JSON.stringify(payload.instructions));
    if (payload.cookTime !== undefined) formData.append("cookTime", payload.cookTime);
    if (payload.servings !== undefined) formData.append("servings", String(payload.servings));
    if (payload.difficulty !== undefined) formData.append("difficulty", payload.difficulty);

    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const fallbackMessage = "Failed to update recipe.";
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || fallbackMessage);
    }

    return (await response.json()) as ApiRecipe;
  },
  deleteRecipe: async (recipeId: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const fallbackMessage = "Failed to delete recipe.";
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || fallbackMessage);
    }
  },
  toggleLike: async (recipeId: string, token: string): Promise<ApiRecipe> => {
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const fallbackMessage = "Failed to toggle like.";
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || fallbackMessage);
    }

    return (await response.json()) as ApiRecipe;
  },
};
