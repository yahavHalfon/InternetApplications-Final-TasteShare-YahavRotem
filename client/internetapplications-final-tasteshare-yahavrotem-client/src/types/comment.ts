export type RecipeComment = {
  id: string;
  recipeId: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
};
