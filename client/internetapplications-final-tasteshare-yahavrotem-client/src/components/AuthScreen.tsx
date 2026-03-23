import type { ChangeEvent, FormEvent, ReactNode, RefObject } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  ArrowBack,
  ArrowForward,
  CameraAlt,
  Check,
  Email,
  Link as LinkIcon,
  Lock,
  LocationOn,
  Person,
  Restaurant,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type AuthMode = "login" | "register";
type RegisterStep = 1 | 2;

type AuthScreenProps = {
  authMode: AuthMode;
  registerStep: RegisterStep;
  showPassword: boolean;
  isSubmitting: boolean;
  isGoogleLoading: boolean;
  googleClientId?: string;
  notification: ReactNode;
  avatarFile: File | null;
  avatarPreviewUrl: string;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  onTogglePassword: () => void;
  onSetAuthMode: (mode: AuthMode) => void;
  onSetRegisterStep: (step: RegisterStep) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onNextRegisterStep: (event: FormEvent<HTMLFormElement>) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGoogleSignInStart: (response: CredentialResponse) => void;
  onGoogleError: () => void;
};

function AuthScreen({
  authMode,
  registerStep,
  showPassword,
  isSubmitting,
  isGoogleLoading,
  googleClientId,
  notification,
  avatarFile,
  avatarPreviewUrl,
  avatarInputRef,
  onTogglePassword,
  onSetAuthMode,
  onSetRegisterStep,
  onLogin,
  onNextRegisterStep,
  onRegister,
  onAvatarChange,
  onGoogleSignInStart,
  onGoogleError,
}: AuthScreenProps) {
  const renderGoogleLogin = () => {
    if (!googleClientId) {
      return (
        <Typography variant="body2" color="warning.main" sx={{ textAlign: "center" }}>
          Google sign-in is not configured.
        </Typography>
      );
    }

    return (
      <Stack spacing={1.5} alignItems="center">
        <GoogleLogin onSuccess={onGoogleSignInStart} onError={onGoogleError} />
        {isGoogleLoading ? (
          <Typography variant="caption" color="text.secondary">
            Signing in with Google...
          </Typography>
        ) : null}
      </Stack>
    );
  };

  const renderStepIndicator = (step: RegisterStep) => (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 3.5 }}>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            ...(step >= 1
              ? {
                  background: "linear-gradient(135deg, #FF6B35, #EF4444)",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(255,107,53,0.3)",
                }
              : { bgcolor: "grey.100", color: "grey.500" }),
          }}
        >
          {step > 1 ? <Check sx={{ fontSize: 14 }} /> : "1"}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 500, color: step >= 1 ? "text.primary" : "grey.400" }}>
          Account
        </Typography>
      </Stack>
      <Box sx={{ width: 32, height: 1, bgcolor: "grey.200" }} />
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            ...(step >= 2
              ? {
                  background: "linear-gradient(135deg, #FF6B35, #EF4444)",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(255,107,53,0.3)",
                }
              : { bgcolor: "grey.100", color: "grey.500" }),
          }}
        >
          2
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 500, color: step >= 2 ? "text.primary" : "grey.400" }}>
          Profile
        </Typography>
      </Stack>
    </Stack>
  );

  const isRegisterStepTwo = authMode === "register" && registerStep === 2;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
      <Box sx={{ width: "100%", maxWidth: isRegisterStepTwo ? 520 : 440 }}>
        {notification}

        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", p: 5 }}>
          <Stack alignItems="center" sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                background: "linear-gradient(135deg, #FF6B35, #EF4444)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 20px rgba(255,107,53,0.3)",
                mb: 2.5,
              }}
            >
              <Restaurant sx={{ color: "common.white", fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, letterSpacing: "-0.02em" }}>
              TasteShare
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {authMode === "login"
                ? "Welcome back, chef!"
                : registerStep === 1
                  ? "Create your account"
                  : "Set up your chef profile"}
            </Typography>
          </Stack>

          {authMode === "login" ? (
            <Box>
              <Box component="form" onSubmit={onLogin}>
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    name="email"
                    placeholder="Email address"
                    type="email"
                    required
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ fontSize: 18, color: "grey.400" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    name="password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    required
                    size="small"
                    slotProps={{
                      htmlInput: { minLength: 8 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ fontSize: 18, color: "grey.400" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" edge="end" onClick={onTogglePassword}>
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ height: 44, fontSize: 14 }} disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="grey.400" sx={{ letterSpacing: 2, textTransform: "uppercase" }}>
                  or
                </Typography>
              </Divider>

              {renderGoogleLogin()}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3.5, textAlign: "center" }}>
                Don&apos;t have an account?{" "}
                <Button
                  size="small"
                  onClick={() => {
                    onSetAuthMode("register");
                    onSetRegisterStep(1);
                  }}
                  sx={{ color: "primary.main", fontSize: 13, p: 0, minWidth: 0 }}
                >
                  Sign Up
                </Button>
              </Typography>
            </Box>
          ) : registerStep === 1 ? (
            <Box>
              {renderStepIndicator(1)}

              <Box component="form" autoComplete="on" onSubmit={onNextRegisterStep}>
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    name="email"
                    autoComplete="email"
                    placeholder="Email address"
                    type="email"
                    required
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ fontSize: 18, color: "grey.400" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    type={showPassword ? "text" : "password"}
                    required
                    size="small"
                    slotProps={{
                      htmlInput: { minLength: 8 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ fontSize: 18, color: "grey.400" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" edge="end" onClick={onTogglePassword}>
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button type="submit" variant="contained" fullWidth sx={{ height: 44, fontSize: 14 }} endIcon={<ArrowForward sx={{ fontSize: 16 }} />}>
                    Continue
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="grey.400" sx={{ letterSpacing: 2, textTransform: "uppercase" }}>
                  or
                </Typography>
              </Divider>

              {renderGoogleLogin()}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3.5, textAlign: "center" }}>
                Already have an account?{" "}
                <Button
                  size="small"
                  onClick={() => {
                    onSetAuthMode("login");
                    onSetRegisterStep(1);
                  }}
                  sx={{ color: "primary.main", fontSize: 13, p: 0, minWidth: 0 }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          ) : (
            <Box>
              {renderStepIndicator(2)}

              <Box component="form" autoComplete="off" onSubmit={onRegister}>
                <Box component="input" type="text" name="fakeUsername" autoComplete="username" tabIndex={-1} aria-hidden="true" sx={{ display: "none" }} />
                <Box component="input" type="password" name="fakePassword" autoComplete="new-password" tabIndex={-1} aria-hidden="true" sx={{ display: "none" }} />
                <Stack spacing={2.5}>
                  <Stack alignItems="center">
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        src={avatarPreviewUrl || undefined}
                        sx={{
                          width: 96,
                          height: 96,
                          bgcolor: "grey.100",
                          border: "4px solid",
                          borderColor: "grey.50",
                          "&:hover": { borderColor: "rgba(255,107,53,0.2)" },
                          transition: "border-color 0.2s",
                        }}
                      >
                        <Person sx={{ fontSize: 32, color: "grey.400" }} />
                      </Avatar>
                      <IconButton
                        size="small"
                        onClick={() => avatarInputRef.current?.click()}
                        sx={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #FF6B35, #EF4444)",
                          border: "3px solid white",
                          boxShadow: 2,
                          color: "common.white",
                          "&:hover": { background: "linear-gradient(135deg, #E55A2B, #DC2626)" },
                        }}
                      >
                        <CameraAlt sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Box component="input" ref={avatarInputRef} name="profileImage" type="file" accept="image/*" onChange={onAvatarChange} sx={{ display: "none" }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
                      {avatarFile ? "Tap to change photo" : "Upload a profile photo"}
                    </Typography>
                  </Stack>

                  <TextField
                    fullWidth
                    name="fullName"
                    autoComplete="off"
                    label="Full Name"
                    placeholder="Your full name"
                    required
                    size="small"
                    slotProps={{
                      htmlInput: {
                        "data-lpignore": "true",
                        "data-1p-ignore": "true",
                      },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ fontSize: 18, color: "grey.400" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    name="username"
                    autoComplete="off"
                    label="Username"
                    placeholder="yourname"
                    size="small"
                    slotProps={{
                      htmlInput: {
                        pattern: "[A-Za-z0-9._]*",
                        "data-lpignore": "true",
                        "data-1p-ignore": "true",
                      },
                      input: {
                        startAdornment: <InputAdornment position="start">@</InputAdornment>,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    name="bio"
                    label="Bio"
                    placeholder="Tell the community about yourself, your cooking style, your favorite cuisines..."
                    multiline
                    rows={3}
                    size="small"
                    slotProps={{ htmlInput: { maxLength: 200 } }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField
                      fullWidth
                      name="location"
                      label="Location"
                      placeholder="City, Country"
                      size="small"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ fontSize: 16, color: "grey.400" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      name="website"
                      label="Website"
                      placeholder="yoursite.com"
                      size="small"
                      slotProps={{
                        htmlInput: { pattern: "https?://.*|[^\\s]+\\.[^\\s]+" },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkIcon sx={{ fontSize: 16, color: "grey.400" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button type="button" fullWidth variant="outlined" onClick={() => onSetRegisterStep(1)} sx={{ height: 44, color: "text.secondary", borderColor: "grey.300" }} startIcon={<ArrowBack sx={{ fontSize: 16 }} />}>
                      Back
                    </Button>
                    <Button type="submit" fullWidth variant="contained" sx={{ height: 44 }} startIcon={<Restaurant sx={{ fontSize: 16 }} />} disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Account"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default AuthScreen;
