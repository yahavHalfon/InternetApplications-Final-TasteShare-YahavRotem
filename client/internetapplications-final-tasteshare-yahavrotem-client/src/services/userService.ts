import { API_BASE_URL } from "../config/env";

export type ApiUserPreview = {
  _id: string;
  username: string;
};

const getUserById = async (userId: string): Promise<ApiUserPreview | null> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<ApiUserPreview>;
  if (!data || typeof data._id !== "string") {
    return null;
  }

  return {
    _id: data._id,
    username: typeof data.username === "string" ? data.username : "",
  };
};

export const userService = {
  getUserById,
};
