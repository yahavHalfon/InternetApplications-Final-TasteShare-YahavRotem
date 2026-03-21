import { API_BASE_URL } from "../config/env";

export type ApiUser = {
  name?: string;
  avatarUrl?: string;
};

const getUserById = async (userId: string): Promise<ApiUser | null> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ApiUser;
};

export const userService = {
  getUserById,
};
