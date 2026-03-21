import React, { useState } from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { Clock3, Heart, MessageCircle } from "lucide-react";
import type { RecipeCardProps } from "../types/recipe";
import { recipeService } from "../services/recipeService";

interface RecipeCardWithActionsProps extends RecipeCardProps {
  userId?: string;
  token?: string;
  onLikeChange?: (recipeId: string, likedBy: string[]) => void;
}

const RecipeCard: React.FC<RecipeCardWithActionsProps> = ({
  recipe,
  user,
  userId,
  token,
  onLikeChange,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [likedBy, setLikedBy] = useState(recipe.likedBy);

  const isLikedByUser = userId ? likedBy.includes(userId) : false;
  const likesCount = likedBy.length;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || !token || isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      const updatedRecipe = await recipeService.toggleLike(recipe._id, token);
      const newLikedBy = updatedRecipe.likedBy || [];
      setLikedBy(newLikedBy);
      onLikeChange?.(recipe._id, newLikedBy);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        borderColor: "grey.200",
        transition: "box-shadow 0.3s",
        "&:hover": {
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      }}
    >
      {recipe.image && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            paddingTop: "62.5%",
            backgroundColor: "grey.100",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={recipe.image}
            alt={recipe.title || "Recipe image"}
            loading="lazy"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s",
              "&:hover": {
                transform: "scale(1.03)",
              },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              gap: 1,
            }}
          >
            {recipe.cookTime && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 4,
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(4px)",
                  color: "grey.600",
                }}
              >
                <Clock3 size={11} />
                <Typography sx={{ fontSize: 11, fontWeight: 500 }}>
                  {recipe.cookTime}
                </Typography>
              </Box>
            )}
            {recipe.difficulty && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 4,
                  backdropFilter: "blur(4px)",
                  bgcolor:
                    recipe.difficulty === "Easy" ? "rgba(236, 253, 245, 0.9)" :
                    recipe.difficulty === "Medium" ? "rgba(255, 251, 235, 0.9)" :
                    "rgba(254, 242, 242, 0.9)",
                  color:
                    recipe.difficulty === "Easy" ? "success.main" :
                    recipe.difficulty === "Medium" ? "warning.main" :
                    "error.main",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 500 }}>
                  {recipe.difficulty}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Avatar
            src={user.profileImage}
            alt={user.username}
            sx={{ width: 24, height: 24, fontSize: 12, bgcolor: "primary.main" }}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ fontSize: 12, color: "grey.500" }}>
            {user.username}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "grey.300" }}>·</Typography>
          <Typography sx={{ fontSize: 12, color: "grey.400" }}>
            {recipe.createdAt}
          </Typography>
        </Box>

        {recipe.title && (
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "grey.900",
              mb: 0.5,
            }}
          >
            {recipe.title}
          </Typography>
        )}
        <Typography
          sx={{
            fontSize: 13,
            color: "grey.600",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 2,
          }}
        >
          {recipe.content}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "grey.100",
          }}
        >
          <Box
            onClick={handleLikeClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              cursor: userId && token ? "pointer" : "default",
              opacity: isLiking ? 0.6 : 1,
              transition: "opacity 0.2s",
              "&:hover .icon": userId && token ? { color: "error.light" } : {},
            }}
          >
            <Heart
              className="icon"
              size={17}
              fill={isLikedByUser ? "#ef4444" : "none"}
              style={{
                color: isLikedByUser ? "#ef4444" : "#9ca3af",
                transition: "all 0.2s",
              }}
            />
            <Typography sx={{ fontSize: 12, color: "grey.400" }}>
              {likesCount}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover .icon": { color: "warning.light" } }}>
            <MessageCircle className="icon" size={17} style={{ color: "#9ca3af", transition: "color 0.2s" }} />
            <Typography sx={{ fontSize: 12, color: "grey.400" }}>
              {recipe.commentsCount}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default RecipeCard;
