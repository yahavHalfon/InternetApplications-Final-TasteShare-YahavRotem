import { API_BASE_URL } from "../config/env";

export type FeedPost = {
  id: string;
  username: string;
  userImageUrl: string;
  content: string;
  imageUrl?: string;
  title?: string;
  createdAtText?: string;
  likesCount?: number;
  commentsCount?: number;
  cookTime?: string;
  difficulty?: "Easy" | "Medium" | "Advanced";
};

const getPosts = async (): Promise<FeedPost[]> => {
  const response = await fetch(`${API_BASE_URL}/posts`);

  if (!response.ok) {
    const fallbackMessage = "Failed to load feed posts.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as FeedPost[];
};

export const postService = {
  getPosts,
};
