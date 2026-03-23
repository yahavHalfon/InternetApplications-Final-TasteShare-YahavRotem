import { useState, type MouseEvent } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
} from "@mui/icons-material";
import type { RecipeCardProps } from "../types/recipe";
import { recipeService } from "../services/recipeService";

type RecipeCardWithActionsProps = RecipeCardProps & {
  userId?: string;
  token?: string;
  onLikeChange?: (recipeId: string, likedBy: string[]) => void;
  onRecipeClick?: (recipeId: string) => void;
};

const RecipeCard = ({
  recipe,
  user,
  userId,
  token,
  onLikeChange,
  onRecipeClick,
}: RecipeCardWithActionsProps) => {
  const [isLiking, setIsLiking] = useState(false);

  const isLikedByUser = userId ? recipe.likedBy.includes(userId) : false;
  const likesCount = recipe.likedBy.length;

  const handleLikeClick = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!userId || !token || isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      const updatedRecipe = await recipeService.toggleLike(recipe._id, token);
      const newLikedBy = updatedRecipe.likedBy || [];
      onLikeChange?.(recipe._id, newLikedBy);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const difficultyColor =
    recipe.difficulty === "Easy"
      ? { bg: "rgba(236,253,245,0.9)", color: "success.main" }
      : recipe.difficulty === "Medium"
        ? { bg: "rgba(255,251,235,0.9)", color: "warning.main" }
        : { bg: "rgba(254,242,242,0.9)", color: "error.main" };

  return (
    <Card
      onClick={() => onRecipeClick?.(recipe._id)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 6px 16px rgba(0,0,0,0.08)" },
        "&:hover img": { transform: "scale(1.03)" },
      }}
    >
      {!!recipe.image && (
        <Box sx={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", bgcolor: "grey.100" }}>
          <CardMedia
            component="img"
            image={recipe.image}
            alt={recipe.title || "Recipe image"}
            loading="lazy"
            sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
          />
          <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 12, right: 12 }}>
            {!!recipe.cookTime && (
              <Chip
                icon={<AccessTime sx={{ fontSize: 12 }} />}
                label={recipe.cookTime}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(8px)",
                  fontSize: 11,
                  height: 24,
                }}
              />
            )}
            {!!recipe.difficulty && (
              <Chip
                label={recipe.difficulty}
                size="small"
                sx={{
                  bgcolor: difficultyColor.bg,
                  color: difficultyColor.color,
                  fontSize: 11,
                  height: 24,
                }}
              />
            )}
          </Stack>
        </Box>
      )}

      <CardContent sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Avatar src={user.profileImage} alt={user.username} sx={{ width: 24, height: 24 }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {user.username}
          </Typography>
          <Typography variant="caption" color="grey.300">
            &middot;
          </Typography>
          <Typography variant="caption" color="grey.400">
            {recipe.createdAt}
          </Typography>
        </Stack>

        {!!recipe.title && (
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5, fontSize: 15 }}>
            {recipe.title}
          </Typography>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: 13,
            lineHeight: 1.6,
            mb: 1.5,
          }}
        >
          {recipe.content}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: "auto", pt: 1, borderTop: "1px solid", borderColor: "grey.50" }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            onClick={(event) => void handleLikeClick(event)}
            sx={{
              cursor: userId && token ? "pointer" : "default",
              opacity: isLiking ? 0.6 : 1,
            }}
          >
            {isLikedByUser ? (
              <Favorite sx={{ fontSize: 17, color: "error.main" }} />
            ) : (
              <FavoriteBorder
                sx={{
                  fontSize: 17,
                  color: "grey.400",
                  "&:hover": { color: userId && token ? "error.light" : "grey.400" },
                }}
              />
            )}
            <Typography variant="caption" sx={{ color: isLikedByUser ? "error.main" : "grey.500" }}>
              {likesCount}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: "pointer" }}>
            <ChatBubbleOutline sx={{ fontSize: 17, color: "grey.400" }} />
            <Typography variant="caption" color="grey.500">
              {recipe.commentsCount}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
