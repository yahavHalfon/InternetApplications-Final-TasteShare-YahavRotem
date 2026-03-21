import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ChefHat, Link2, MapPin } from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { userService, type ApiUser } from "../services/userService";
import type { AuthUser } from "../services/authService";
import "./Profile.css";

type ProfileProps = {
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

const mapApiUserToAuthUser = (apiUser: ApiUser, fallback: AuthUser): AuthUser => {
  return {
    id: apiUser.id ?? fallback.id,
    email: apiUser.email ?? fallback.email,
    name: apiUser.name ?? fallback.name,
    username: apiUser.username ?? fallback.username,
    avatarUrl: apiUser.avatarUrl ?? fallback.avatarUrl,
    bio: apiUser.bio ?? fallback.bio,
    website: apiUser.website ?? fallback.website,
    location: apiUser.location ?? fallback.location,
  };
};

const getAvatarFallbackInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

function Profile({ token, initialUser, onProfileUpdated }: ProfileProps) {
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

  const displayName = useMemo(() => form.name.trim() || profile.name || "Chef", [form.name, profile.name]);
  const fallbackAvatarInitials = useMemo(() => getAvatarFallbackInitials(displayName), [displayName]);
  const hasProfileImage = Boolean(imagePreviewUrl.trim());

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
      <section className="profile-screen">
        <div className="profile-card profile-loading">Loading profile...</div>
      </section>
    );
  }

  return (
    <section className="profile-screen">
      <div className="profile-card">
        <div className="profile-banner" />

        <div className="profile-content">
          <div className="profile-top-row">
            <div className="profile-avatar-wrap">
              {hasProfileImage ? (
                <img
                  src={imagePreviewUrl}
                  alt={displayName}
                  className="profile-avatar-lg"
                />
              ) : (
                <div className="profile-avatar-fallback" role="img" aria-label={`${displayName} initials`}>
                  <span>{fallbackAvatarInitials}</span>
                </div>
              )}
              <div className="profile-chef-badge" aria-hidden="true">
                <ChefHat size={14} />
              </div>
              {editing ? (
                <button
                  type="button"
                  className="profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile picture"
                >
                  <Camera size={14} />
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleSelectImage}
                hidden
              />
            </div>

            <div className="profile-actions">
              {editing ? (
                <>
                  <button type="button" className="profile-btn-secondary" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </button>
                  <button type="button" className="profile-btn-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button type="button" className="profile-btn-secondary" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {error ? <p className="profile-error">{error}</p> : null}

          {editing ? (
            <div className="profile-edit-grid">
              <div className="profile-field profile-field-full">
                <label htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                />
              </div>

              <div className="profile-field profile-field-full">
                <label htmlFor="profile-username">Username</label>
                <input
                  id="profile-username"
                  type="text"
                  value={form.username}
                  onChange={(event) => handleFormChange("username", event.target.value)}
                />
              </div>

              <div className="profile-field profile-field-full">
                <label htmlFor="profile-bio">Bio</label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  value={form.bio}
                  onChange={(event) => handleFormChange("bio", event.target.value)}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-location">Location</label>
                <input
                  id="profile-location"
                  type="text"
                  value={form.location}
                  onChange={(event) => handleFormChange("location", event.target.value)}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-website">Website</label>
                <input
                  id="profile-website"
                  type="text"
                  value={form.website}
                  onChange={(event) => handleFormChange("website", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="profile-meta">
              <h1>{profile.name || "Unnamed Chef"}</h1>
              <p className="profile-meta-username">@{profile.username || "chef"}</p>
              {profile.bio ? <p className="profile-meta-bio">{profile.bio}</p> : null}
              <div className="profile-meta-row">
                {profile.location ? (
                  <span>
                    <MapPin size={13} />
                    {profile.location}
                  </span>
                ) : null}
                {profile.website ? (
                  <span>
                    <Link2 size={13} />
                    {profile.website}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Profile;
