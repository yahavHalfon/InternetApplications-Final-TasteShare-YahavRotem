import { useEffect, useState } from "react";
import { Avatar, Box, CircularProgress, Paper, Typography } from "@mui/material";
import {
  AccessTime,
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  People,
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipeDetails } from "../services/recipeService";

type RecipeDetailScreenProps = {
  recipeId: string;
  token?: string;
  userId?: string;
  onLikeChange?: (recipeId: string, likedBy: string[]) => void;
};

const toApiAssetUrl = (assetPath?: string): string | undefined => {
  if (!assetPath) {
    return undefined;
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

const RecipeDetailScreen = ({ recipeId, token, userId, onLikeChange }: RecipeDetailScreenProps) => {
  const [recipe, setRecipe] = useState<ApiRecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikedByUser, setIsLikedByUser] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await recipeService.getRecipeById(recipeId);
        setRecipe({
          ...data,
          image: toApiAssetUrl(data.image) || "",
          author: {
            ...data.author,
            avatarUrl: toApiAssetUrl(data.author.avatarUrl) || "",
          },
        });
        setLikesCount(data.stats.likesCount);
        setIsLikedByUser(userId ? data.likedBy?.includes(userId) ?? false : false);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load recipe details.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecipe();
  }, [recipeId, userId]);

  const handleLikeClick = async () => {
    if (!userId || !token || isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      const updatedRecipe = await recipeService.toggleLike(recipeId, token);
      const newLikedBy = updatedRecipe.likedBy || [];
      setIsLikedByUser(newLikedBy.includes(userId));
      setLikesCount(newLikedBy.length);
      onLikeChange?.(recipeId, newLikedBy);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={34} thickness={4} />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, color: "error.main" }}>
        {error || "Recipe not found."}
      </Paper>
    );
  }

  return (
    <Box sx={{ maxWidth: 980, mx: "auto", px: { xs: 1, md: 0 }, pb: 4 }}>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", borderColor: "grey.200" }}>
        <Box sx={{ position: "relative", width: "100%", paddingTop: "48%", backgroundColor: "grey.100" }}>
          <Box
            component="img"
            src={recipe.image}
            alt={recipe.title}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              right: 14,
              top: 14,
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.5, borderRadius: 10, bgcolor: "rgba(255,255,255,0.92)" }}>
              <AccessTime sx={{ fontSize: 13 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{recipe.badges.cookTime}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.5, borderRadius: 10, bgcolor: "rgba(255,255,255,0.92)" }}>
              <People sx={{ fontSize: 13 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{recipe.badges.servings} servings</Typography>
            </Box>
            <Box sx={{ px: 1.2, py: 0.5, borderRadius: 10, bgcolor: "rgba(255,255,255,0.92)" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{recipe.badges.difficulty}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography sx={{ fontSize: { xs: 23, md: 30 }, fontWeight: 700, lineHeight: 1.15 }}>{recipe.title}</Typography>

          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 2.5, color: "grey.600" }}>
            <Box
              onClick={handleLikeClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                cursor: userId && token ? "pointer" : "default",
                opacity: isLiking ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {isLikedByUser ? (
                <Favorite sx={{ fontSize: 17, color: "error.main" }} />
              ) : (
                <FavoriteBorder sx={{ fontSize: 17, color: "grey.400" }} />
              )}
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{likesCount}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <ChatBubbleOutline sx={{ fontSize: 17 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{recipe.stats.commentsCount}</Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2.5, display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar src={recipe.author.avatarUrl} alt={recipe.author.username} sx={{ width: 34, height: 34, fontSize: 14 }}>
              {recipe.author.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{recipe.author.name}</Typography>
              <Typography sx={{ fontSize: 12, color: "grey.500" }}>{recipe.createdAtLabel}</Typography>
            </Box>
          </Box>

          <Typography sx={{ mt: 2.5, color: "grey.700", lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {recipe.description}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "grey.200" }}>
          <Typography sx={{ fontSize: 13, letterSpacing: 0.8, fontWeight: 700, color: "grey.500" }}>INGREDIENTS</Typography>
          <Box component="ul" sx={{ mt: 1.6, pl: 2.1, mb: 0, '& li::marker': { color: '#EA7317', fontSize: '1.2em' } }}>
            {recipe.ingredients.map((ingredient) => (
              <Typography key={ingredient} component="li" sx={{ mb: 1.1, color: "grey.800", lineHeight: 1.55 }}>
                {ingredient}
              </Typography>
            ))}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "grey.200" }}>
          <Typography sx={{ fontSize: 13, letterSpacing: 0.8, fontWeight: 700, color: "grey.500" }}>INSTRUCTIONS</Typography>
          <Box sx={{ mt: 1.6, display: "flex", flexDirection: "column", gap: 1.4 }}>
            {recipe.instructions.map((step, index) => (
              <Box key={`${index + 1}-${step}`} sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    minWidth: 24,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: "#EA7317",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    mt: 0.2,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ color: "grey.800", lineHeight: 1.6 }}>{step}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RecipeDetailScreen;
