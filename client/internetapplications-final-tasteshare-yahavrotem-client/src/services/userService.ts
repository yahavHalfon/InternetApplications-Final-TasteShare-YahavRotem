import { API_BASE_URL } from "../config/env";

export type ApiUser = {
  id?: string;
  email?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  location?: string;
};

const getUserById = async (userId: string): Promise<ApiUser | null> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ApiUser;
};

type UpdateProfilePayload = {
  name: string;
  username: string;
  bio: string;
  website: string;
  location: string;
};

const getProfile = async (token: string): Promise<ApiUser> => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to load profile.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as ApiUser;
};

const updateProfile = async (payload: UpdateProfilePayload, token: string): Promise<ApiUser> => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to update profile.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as ApiUser;
};

const updateProfilePicture = async (profileImage: File, token: string): Promise<ApiUser> => {
  const formData = new FormData();
  formData.append("profileImage", profileImage);

  const response = await fetch(`${API_BASE_URL}/users/profile/picture`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to update profile picture.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as ApiUser;
};

export const userService = {
  getUserById,
  getProfile,
  updateProfile,
  updateProfilePicture,
};
