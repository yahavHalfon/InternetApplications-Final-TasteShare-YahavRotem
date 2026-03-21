import { API_BASE_URL } from "../config/env";
import type { UserModel } from "../types/user";

const getUserById = async (userId: string): Promise<UserModel | null> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as UserModel;
};

export const userService = {
  getUserById,
};
