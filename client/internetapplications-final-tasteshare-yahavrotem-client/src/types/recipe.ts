export interface User {
  _id: string;
  username: string;
  profileImage?: string;
}

export interface RecipeFeedItem {
  _id: string;
  userID: string;
  content: string;
  image?: string;
  createdAt: string;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  title?: string;
  cookTime?: string;
  difficulty?: "Easy" | "Medium" | "Advanced";
}

export interface RecipeCardProps {
  recipe: RecipeFeedItem;
  user: User;
}
