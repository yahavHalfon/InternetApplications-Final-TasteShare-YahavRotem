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

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const post = async (
  path: string,
  payload: object,
  token?: string,
): Promise<AuthSession> => {
  const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
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
  register: (payload: RegisterPayload) => post("register", payload),
  refreshToken: (refreshToken: string) => post("refresh", { refreshToken }),
  googleSignIn: (credential: string) => post("google", { credential }),
  logout: async (refreshToken: string, token: string) => {
    await post("logout", { refreshToken }, token);
  },
};