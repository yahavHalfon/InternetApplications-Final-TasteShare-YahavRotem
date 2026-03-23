import { useCallback, useEffect, useRef, useState } from "react";
import type { CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import { Box, Paper, Typography } from "@mui/material";
import { GOOGLE_CLIENT_ID } from "./config/env";
import { authService, type AuthSession } from "./services/authService";
import AuthScreen from "./components/AuthScreen";
import MainLayout from "./components/MainLayout";

type AuthMode = "login" | "register";
type RegisterStep = 1 | 2;

type Notification = {
  type: "success" | "error";
  message: string;
} | null;

type RegisterCredentials = {
  email: string;
  password: string;
};

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

const normalizeUsername = (value: string): string =>
  slugify(value, { lower: true, strict: true, trim: true, replacement: "" }).slice(0, 30);

const App = () => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [notification, setNotification] = useState<Notification>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const [registerCredentials, setRegisterCredentials] = useState<RegisterCredentials | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!notification) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notification]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
  };

  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }, []);

  const saveSession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, nextSession.token);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextSession.refreshToken);
  }, []);

  const validateAndRefreshToken = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doValidate = async (): Promise<boolean> => {
      const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

      if (!currentRefreshToken) {
        return false;
      }

      try {
        const refreshedSession = await authService.refreshToken(currentRefreshToken);
        saveSession(refreshedSession);
        return true;
      } catch {
        clearSession();
        return false;
      }
    };

    refreshPromiseRef.current = doValidate().finally(() => {
      refreshPromiseRef.current = null;
    });

    return refreshPromiseRef.current;
  }, [clearSession, saveSession]);

  useEffect(() => {
    const restoreSession = async () => {
      const isValid = await validateAndRefreshToken();
      if (!isValid) {
        clearSession();
      }
      setIsInitializing(false);
    };

    void restoreSession();
  }, [clearSession, validateAndRefreshToken]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    try {
      const authSession = await authService.login({
        email,
        password,
      });
      saveSession(authSession);
      notify("success", "You are now logged in.");
      navigate("/recipes", { replace: true });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextRegisterStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    setRegisterCredentials({ email, password });
    setRegisterStep(2);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!registerCredentials) {
      notify("error", "Please complete account details first.");
      setRegisterStep(1);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("fullName") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();

    setIsSubmitting(true);
    try {
      const registerFormData = new FormData();
      registerFormData.append("email", registerCredentials.email);
      registerFormData.append("password", registerCredentials.password);
      registerFormData.append("name", name);
      registerFormData.append("username", normalizeUsername(username || name));
      registerFormData.append("bio", bio);
      registerFormData.append("location", location);
      registerFormData.append("website", website);
      if (avatarFile) {
        registerFormData.append("profileImage", avatarFile);
      }

      const authSession = await authService.register(registerFormData);
      saveSession(authSession);
      notify("success", "Your account has been created successfully.");
      navigate("/recipes", { replace: true });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      notify("error", "Google sign-in did not return a credential.");
      setIsGoogleLoading(false);
      return;
    }

    try {
      const authSession = await authService.googleSignIn(credential);
      saveSession(authSession);
      notify("success", "Google sign-in completed successfully.");
      navigate("/recipes", { replace: true });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setIsGoogleLoading(false);
    notify("error", "Google sign-in failed.");
  };

  const handleLogout = async () => {
    if (session) {
      try {
        await authService.logout(session.refreshToken, session.token);
      } catch (error) {
        console.error("Logout error", error);
      }
    }
    clearSession();
    notify("success", "You have been logged out.");
  };

  const renderNotification = () => {
    if (!notification) {
      return null;
    }

    return (
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.25,
          borderRadius: 2,
          mb: 2,
          border: "1px solid",
          borderColor: notification.type === "success" ? "success.light" : "error.light",
          bgcolor: notification.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          color: notification.type === "success" ? "success.dark" : "error.main",
        }}
      >
        <Typography variant="body2">{notification.message}</Typography>
      </Paper>
    );
  };

  if (isInitializing) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", px: 4, py: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Restoring your session...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (session) {
    return (
      <MainLayout
        session={session}
        notification={renderNotification()}
        onLogout={() => void handleLogout()}
        onProfileUpdated={(updatedUser) => {
          setSession((prevSession) => {
            if (!prevSession) {
              return prevSession;
            }
            return {
              ...prevSession,
              user: updatedUser,
            };
          });
        }}
      />
    );
  }

  return (
    <AuthScreen
      authMode={authMode}
      registerStep={registerStep}
      showPassword={showPassword}
      isSubmitting={isSubmitting}
      isGoogleLoading={isGoogleLoading}
      googleClientId={GOOGLE_CLIENT_ID}
      notification={renderNotification()}
      avatarFile={avatarFile}
      avatarPreviewUrl={avatarPreviewUrl}
      avatarInputRef={avatarInputRef}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onSetAuthMode={(mode) => {
        setAuthMode(mode);
        setRegisterCredentials(null);
      }}
      onSetRegisterStep={(step) => setRegisterStep(step)}
      onLogin={handleLogin}
      onNextRegisterStep={handleNextRegisterStep}
      onRegister={handleRegister}
      onAvatarChange={handleAvatarChange}
      onGoogleSignInStart={(response) => {
        setIsGoogleLoading(true);
        void handleGoogleSuccess(response);
      }}
      onGoogleError={handleGoogleError}
    />
  );
};

export default App;
