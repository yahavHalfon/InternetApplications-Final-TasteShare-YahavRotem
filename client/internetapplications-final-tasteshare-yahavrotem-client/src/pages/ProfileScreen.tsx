import { useEffect, useRef, useState } from "react";
import {
  CameraAlt,
  Link as LinkIcon,
  LocationOn,
  Restaurant,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { API_BASE_URL } from "../config/env";
import { userService, type ApiUser } from "../services/userService";
import type { AuthUser } from "../services/authService";
import MyRecipesSection from "../components/MyRecipesSection";

type ProfileScreenProps = {
  token: string;
  initialUser: AuthUser;
  onProfileUpdated: (user: AuthUser) => void;
};

type ProfileForm = {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
};

const toApiAssetUrl = (assetPath?: string): string => {
  if (!assetPath) {
    return "";
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

const toExternalUrl = (value?: string): string => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const mapApiUserToAuthUser = (apiUser: ApiUser, fallback: AuthUser): AuthUser => ({
  id: apiUser.id ?? fallback.id,
  email: apiUser.email ?? fallback.email,
  name: apiUser.name ?? fallback.name,
  username: apiUser.username ?? fallback.username,
  avatarUrl: apiUser.avatarUrl ?? fallback.avatarUrl,
  bio: apiUser.bio ?? fallback.bio,
  website: apiUser.website ?? fallback.website,
  location: apiUser.location ?? fallback.location,
});

const ProfileScreen = ({ token, initialUser, onProfileUpdated }: ProfileScreenProps) => {
  const [profile, setProfile] = useState<AuthUser>(initialUser);
  const [form, setForm] = useState<ProfileForm>({
    name: initialUser.name,
    username: initialUser.username,
    bio: initialUser.bio,
    location: initialUser.location,
    website: initialUser.website,
  });
  const [editing, setEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(toApiAssetUrl(initialUser.avatarUrl));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialUserRef = useRef<AuthUser>(initialUser);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUser = await userService.getProfile(token);
        const mappedUser = mapApiUserToAuthUser(apiUser, initialUserRef.current);
        setProfile(mappedUser);
        setForm({
          name: mappedUser.name,
          username: mappedUser.username,
          bio: mappedUser.bio,
          location: mappedUser.location,
          website: mappedUser.website,
        });
        setImagePreviewUrl(toApiAssetUrl(mappedUser.avatarUrl));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [token]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const hasProfileImage = Boolean(imagePreviewUrl.trim());
  const avatarFallbackLetter = (profile.name.trim().split(/\s+/)[0] || "U").charAt(0).toUpperCase();

  const handleFormChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
    setSelectedImage(null);
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(toApiAssetUrl(profile.avatarUrl));
    setForm({
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const detailsResponse = await userService.updateProfile(
        {
          name: form.name.trim(),
          username: form.username.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          website: form.website.trim(),
        },
        token,
      );

      let merged = mapApiUserToAuthUser(detailsResponse, profile);

      if (selectedImage) {
        const pictureResponse = await userService.updateProfilePicture(selectedImage, token);
        merged = mapApiUserToAuthUser(pictureResponse, merged);
      }

      setProfile(merged);
      onProfileUpdated(merged);
      setForm({
        name: merged.name,
        username: merged.username,
        bio: merged.bio,
        location: merged.location,
        website: merged.website,
      });
      setSelectedImage(null);
      setImagePreviewUrl(toApiAssetUrl(merged.avatarUrl));
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", p: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", p: 4 }}>
      <Paper
        elevation={0}
        sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", overflow: "hidden", mb: 4 }}
      >
        <Box
          sx={{
            height: 140,
            background: "linear-gradient(135deg, #FF6B35, #EF4444, #EC4899)",
            position: "relative",
          }}
        />

        <Box sx={{ px: 4, pb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -6, mb: 2.5 }}>
            <Box sx={{ position: "relative" }}>
              {hasProfileImage ? (
                <Avatar
                  src={imagePreviewUrl}
                  alt={profile.username}
                  sx={{ width: 96, height: 96, border: "4px solid white", boxShadow: 3 }}
                />
              ) : (
                <Avatar sx={{ width: 96, height: 96, border: "4px solid white", boxShadow: 3, bgcolor: "primary.main" }}>
                  {avatarFallbackLetter}
                </Avatar>
              )}

              <Box
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF6B35, #EF4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid white",
                }}
              >
                <Restaurant sx={{ fontSize: 14, color: "common.white" }} />
              </Box>

              {editing ? (
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: "absolute",
                    right: -10,
                    bottom: 26,
                    width: 28,
                    height: 28,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CameraAlt sx={{ fontSize: 14 }} />
                </IconButton>
              ) : null}

              <Box
                component="input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleSelectImage}
                sx={{ display: "none" }}
              />
            </Box>

            <Stack direction="row" spacing={1} sx={{ pb: 0.5 }}>
              {editing ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancel}
                    disabled={isSaving}
                    sx={{ height: 36, color: "text.secondary", borderColor: "grey.300" }}
                  >
                    Cancel
                  </Button>
                  <Button variant="contained" size="small" onClick={() => void handleSave()} disabled={isSaving} sx={{ height: 36 }}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setEditing(true)}
                  sx={{ height: 36, color: "text.secondary", borderColor: "grey.300" }}
                >
                  Edit Profile
                </Button>
              )}
            </Stack>
          </Stack>

          {error ? (
            <Typography color="error.main" sx={{ mb: 2 }}>
              {error}
            </Typography>
          ) : null}

          {editing ? (
            <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
              <TextField fullWidth label="Name" value={form.name} onChange={(event) => handleFormChange("name", event.target.value)} size="small" />
              <TextField fullWidth label="Username" value={form.username} onChange={(event) => handleFormChange("username", event.target.value)} size="small" />
              <TextField fullWidth label="Bio" value={form.bio} onChange={(event) => handleFormChange("bio", event.target.value)} multiline rows={3} size="small" />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField fullWidth label="Location" value={form.location} onChange={(event) => handleFormChange("location", event.target.value)} size="small" />
                <TextField fullWidth label="Website" value={form.website} onChange={(event) => handleFormChange("website", event.target.value)} size="small" />
              </Stack>
            </Stack>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
                {profile.name || "Unnamed Chef"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                @{profile.username || "chef"}
              </Typography>
              {profile.bio ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6, maxWidth: 620 }}>
                  {profile.bio}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                {profile.location ? (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocationOn sx={{ fontSize: 14, color: "grey.500" }} />
                    <Typography variant="caption" color="text.secondary">{profile.location}</Typography>
                  </Stack>
                ) : null}
                {profile.website ? (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LinkIcon sx={{ fontSize: 14, color: "primary.main" }} />
                    <Link
                      href={toExternalUrl(profile.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      underline="hover"
                      sx={{ color: "primary.main", wordBreak: "break-all" }}
                    >
                      {profile.website}
                    </Link>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>

      <MyRecipesSection token={token} />
    </Box>
  );
};

export default ProfileScreen;
