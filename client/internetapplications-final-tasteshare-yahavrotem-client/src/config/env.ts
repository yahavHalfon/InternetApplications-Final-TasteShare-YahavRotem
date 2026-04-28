const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";
const defaultApiBaseUrl = import.meta.env.DEV ? "http://localhost:3000" : runtimeOrigin;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const API_BASE_URL = (configuredApiBaseUrl || defaultApiBaseUrl).replace(/\/$/, "");