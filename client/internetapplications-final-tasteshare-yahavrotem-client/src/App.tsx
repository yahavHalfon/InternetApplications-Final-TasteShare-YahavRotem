import { useEffect, useState, useRef } from "react";
import type { CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import { Box, Paper, Typography } from "@mui/material";
import { GOOGLE_CLIENT_ID } from "./config/env";
import { authService, type AuthSession } from "./services/authService";
import AuthScreen from "./components/AuthScreen";
import MainLayout from "./components/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";

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

const USER_STORAGE_KEY = "authUser";

const normalizeUsername = (value: string): string =>
  slugify(value, { lower: true, strict: true, trim: true, replacement: "" }).slice(0, 30);

const AppContent = () => {
  const navigate = useNavigate();
  const {
    accessToken,
    refreshToken,
    login,
    logout,
    isAuthenticated,
    validateAndRefreshToken,
  } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [notification, setNotification] = useState<Notification>(null);
  const [registerCredentials, setRegisterCredentials] = useState<RegisterCredentials | null>(null);
  const [userSession, setUserSession] = useState<AuthSession | null>(null);
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

  // Initialize session on app load
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const isValid = await validateAndRefreshToken();
        if (isValid) {
          const storedUser = localStorage.getItem(USER_STORAGE_KEY);
          if (storedUser && accessToken && refreshToken) {
            const parsedUser = JSON.parse(storedUser) as AuthSession["user"];
            setUserSession({
              token: accessToken,
              refreshToken,
              user: parsedUser,
            });
          }
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    void initializeSession();
  }, [accessToken, refreshToken, validateAndRefreshToken]);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
  };

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
      login(authSession.token, authSession.refreshToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authSession.user));
      setUserSession(authSession);
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
      login(authSession.token, authSession.refreshToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authSession.user));
      setUserSession(authSession);
      notify("success", "Your account has been created successfully.");
      navigate("/recipes", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed.";
      if (/username.*(already exists|already taken|is already taken)/i.test(message)) {
        notify("error", "Username is already taken.");
      } else {
        notify("error", message);
      }
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
      login(authSession.token, authSession.refreshToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authSession.user));
      setUserSession(authSession);
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
    if (refreshToken && accessToken) {
      try {
        await authService.logout(refreshToken, accessToken);
      } catch (error) {
        console.error("Logout error", error);
      }
    }

    // Ensure the auth flow always returns to the initial sign-in screen after explicit logout.
    setAuthMode("login");
    setRegisterStep(1);
    setRegisterCredentials(null);
    setAvatarFile(null);
    if (avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl("");
    setShowPassword(false);

    logout();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUserSession(null);
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

  if (isAuthenticated && userSession) {
    return (
      <MainLayout
        session={userSession}
        notification={renderNotification()}
        onLogout={() => void handleLogout()}
        onProfileUpdated={(updatedUser) => {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          setUserSession((prevSession) => {
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

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
