import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChefHat,
  Eye,
  EyeOff,
  Link2,
  Lock,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { GOOGLE_CLIENT_ID } from "./config/env";
import { authService, type AuthSession } from "./services/authService";
import Feed from "./pages/Feed";
import "./App.css";

type AuthMode = "login" | "register";
type RegisterStep = 1 | 2;

type Notification = {
  type: "success" | "error";
  message: string;
} | null;

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeUsername = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
};

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [notification, setNotification] = useState<Notification>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

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
      if (avatarPreviewUrl) {
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

  const validateCredentials = (): boolean => {
    if (!emailPattern.test(email.trim().toLowerCase())) {
      notify("error", "Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      notify("error", "Password must be at least 8 characters.");
      return false;
    }
    return true;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCredentials()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const authSession = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      saveSession(authSession);
      notify("success", "You are now logged in.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextRegisterStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCredentials()) {
      return;
    }
    setRegisterStep(2);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCredentials()) {
      return;
    }
    if (!name.trim()) {
      notify("error", "Please provide your full name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);
      formData.append("name", name.trim());
      formData.append("username", normalizeUsername(username || name));
      formData.append("bio", bio.trim());
      formData.append("location", location.trim());
      formData.append("website", website.trim());
      if (avatarFile) {
        formData.append("profileImage", avatarFile);
      }

      const authSession = await authService.register(formData);
      saveSession(authSession);
      notify("success", "Your account has been created successfully.");
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

    if (avatarPreviewUrl) {
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

  const renderGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      return <p className="google-config-warning">Google sign-in is not configured.</p>;
    }

    return (
      <>
        <div className="google-login-wrap">
          <GoogleLogin
            onSuccess={(response: CredentialResponse) => {
              setIsGoogleLoading(true);
              void handleGoogleSuccess(response);
            }}
            onError={handleGoogleError}
          />
        </div>
        {isGoogleLoading ? <p className="google-loading">Signing in with Google...</p> : null}
      </>
    );
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

  if (isInitializing) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-loading">Restoring your session...</div>
      </div>
    );
  }

  if (session) {
    return <Feed onLogout={handleLogout} />;
  }

  const isRegisterStepTwo = authMode === "register" && registerStep === 2;

  return (
    <div className="auth-page">
      {notification ? (
        <div className={`notification notification-${notification.type}`}>{notification.message}</div>
      ) : null}

      <div className={`auth-card ${isRegisterStepTwo ? "auth-card-wide" : ""}`}>
        <div className="brand-block">
          <div className="brand-icon">
            <ChefHat size={28} color="#ffffff" />
          </div>
          <h1 className="brand-title">TasteShare</h1>
          <p className="brand-subtitle">
            {authMode === "login"
              ? "Welcome back, chef!"
              : registerStep === 1
                ? "Create your account"
                : "Set up your chef profile"}
          </p>
        </div>

        {authMode === "login" ? (
          <div>
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                />
              </div>

              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input auth-input-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <button type="submit" className="btn-gradient" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="auth-divider">
              <div />
              <span>or</span>
              <div />
            </div>

            {renderGoogleLogin()}

            <div className="switch-mode">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setAuthMode("register");
                  setRegisterStep(1);
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : registerStep === 1 ? (
          <div>
            <div className="step-indicator">
              <div className="step-group">
                <div className="step-circle step-circle-active">1</div>
                <span className="step-label step-label-active">Account</span>
              </div>
              <div className="step-line" />
              <div className="step-group">
                <div className="step-circle">2</div>
                <span className="step-label">Profile</span>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleNextRegisterStep}>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input auth-input-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <button type="submit" className="btn-gradient">
                Continue
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-divider">
              <div />
              <span>or</span>
              <div />
            </div>

            {renderGoogleLogin()}

            <div className="switch-mode">
              <span>Already have an account? </span>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setAuthMode("login");
                  setRegisterStep(1);
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="step-indicator">
              <div className="step-group">
                <div className="step-circle step-circle-active">
                  <Check size={14} />
                </div>
                <span className="step-label step-label-active">Account</span>
              </div>
              <div className="step-line" />
              <div className="step-group">
                <div className="step-circle step-circle-active">2</div>
                <span className="step-label step-label-active">Profile</span>
              </div>
            </div>

            <form className="profile-form" onSubmit={handleRegister}>
              <div className="avatar-block">
                <label htmlFor="profileImage" className="avatar-button">
                  <div className="avatar-preview">
                    {avatarPreviewUrl ? <img src={avatarPreviewUrl} alt="Avatar" /> : <User size={32} color="#c4c4c4" />}
                  </div>
                  <div className="avatar-camera">
                    <Camera size={14} color="#ffffff" />
                  </div>
                </label>
                <input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
                <p>{avatarFile ? "Tap to change photo" : "Upload a profile photo"}</p>
              </div>

              <div>
                <label>Full Name</label>
                <div className="input-with-icon">
                  <User size={17} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (!username) {
                        setUsername(normalizeUsername(event.target.value));
                      }
                    }}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label>Username</label>
                <div className="input-with-icon input-with-prefix">
                  <span className="prefix">@</span>
                  <input
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                    className="auth-input auth-input-username"
                  />
                </div>
              </div>

              <div>
                <label>Bio</label>
                <div className="bio-wrap">
                  <textarea
                    placeholder="Tell the community about yourself, your cooking style, your favorite cuisines..."
                    rows={3}
                    maxLength={200}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                  <span>{bio.length}/200</span>
                </div>
              </div>

              <div className="grid-two">
                <div>
                  <label>Location</label>
                  <div className="input-with-icon input-small-icon">
                    <MapPin size={15} className="input-icon" />
                    <input
                      type="text"
                      placeholder="City, Country"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="auth-input"
                    />
                  </div>
                </div>
                <div>
                  <label>Website</label>
                  <div className="input-with-icon input-small-icon">
                    <Link2 size={15} className="input-icon" />
                    <input
                      type="text"
                      placeholder="yoursite.com"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>

              <div className="action-row">
                <button type="button" className="btn-secondary" onClick={() => setRegisterStep(1)}>
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button type="submit" className="btn-gradient" disabled={isSubmitting}>
                  <ChefHat size={16} />
                  {isSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
