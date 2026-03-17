import { API_BASE_URL } from "../config/env";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  website: string;
  location: string;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

const post = async (
  path: string,
  payload: FormData | Record<string, unknown>,
  token?: string,
): Promise<AuthSession> => {
  const isFormData = payload instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
    method: "POST",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isFormData ? payload : JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackMessage = "Something went wrong. Please try again.";
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || fallbackMessage);
  }

  return (await response.json()) as AuthSession;
};

export const authService = {
  login: (payload: LoginPayload) => post("login", payload),
  register: (payload: FormData) => post("register", payload),
  refreshToken: (refreshToken: string) => post("refresh", { refreshToken }),
  googleSignIn: (credential: string) => post("google", { credential }),
  logout: async (refreshToken: string, token: string) => {
    await post("logout", { refreshToken }, token);
  },
};