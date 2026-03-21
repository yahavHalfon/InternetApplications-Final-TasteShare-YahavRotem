import { useEffect, useMemo, useState } from "react";
import { Avatar, Box, CircularProgress, Dialog, IconButton, Paper, Typography } from "@mui/material";
import { Clock3, Heart, MessageCircle, Users, X } from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipeDetails } from "../services/recipeService";
import type { RecipeFeedItem } from "../types/recipe";

type RecipeDetailsModalProps = {
  recipe: RecipeFeedItem | null;
  open: boolean;
  onClose: () => void;
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

const RecipeDetailsModal = ({ recipe, open, onClose, token, userId, onLikeChange }: RecipeDetailsModalProps) => {
  const [details, setDetails] = useState<ApiRecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  const recipeId = recipe?._id;

  useEffect(() => {
    if (!open || !recipeId) {
      setDetails(null);
      setError(null);
      return;
    }

    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await recipeService.getRecipeById(recipeId);
        setDetails({
          ...data,
          image: toApiAssetUrl(data.image) || "",
          author: {
            ...data.author,
            avatarUrl: toApiAssetUrl(data.author.avatarUrl) || "",
          },
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load recipe details.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDetails();
  }, [open, recipeId]);

  const likesCount = recipe?.likedBy.length ?? 0;
  const isLikedByUser = useMemo(() => (userId && recipe ? recipe.likedBy.includes(userId) : false), [recipe, userId]);
  const heroImage = recipe?.image || details?.image || "";

  const handleLikeClick = async () => {
    if (!recipe || !token || !userId || isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      const updatedRecipe = await recipeService.toggleLike(recipe._id, token);
      onLikeChange?.(recipe._id, updatedRecipe.likedBy || []);
    } catch (toggleError) {
      console.error("Failed to toggle like:", toggleError);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          m: { xs: 1, md: 1.5 },
          maxHeight: "calc(100vh - 16px)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          maxHeight: "calc(100vh - 16px)",
          overflowY: "auto",
          bgcolor: "#f8f8fa",
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            bgcolor: "rgba(255,255,255,0.92)",
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <X size={18} />
        </IconButton>

        {!recipe ? null : isLoading ? (
          <Box sx={{ minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={30} />
          </Box>
        ) : error || !details ? (
          <Paper variant="outlined" sx={{ m: 2, p: 2.5, borderRadius: 2, color: "error.main" }}>
            {error || "Recipe not found."}
          </Paper>
        ) : (
          <>
            <Box sx={{ position: "relative", width: "100%", pt: { xs: "40%", md: "30%" }, bgcolor: "grey.100" }}>
              <Box
                component="img"
                src={heroImage}
                alt={details.title}
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <Box sx={{ position: "absolute", top: 14, right: 68, display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25, borderRadius: 4, bgcolor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", color: "grey.600" }}>
                  <Clock3 size={11} />
                  <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{details.badges.cookTime}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25, borderRadius: 4, bgcolor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", color: "grey.600" }}>
                  <Users size={11} />
                  <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{details.badges.servings} servings</Typography>
                </Box>
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 4,
                    backdropFilter: "blur(4px)",
                    bgcolor:
                      details.badges.difficulty === "Easy" ? "rgba(236, 253, 245, 0.9)" :
                      details.badges.difficulty === "Medium" ? "rgba(255, 251, 235, 0.9)" :
                      "rgba(254, 242, 242, 0.9)",
                    color:
                      details.badges.difficulty === "Easy" ? "success.main" :
                      details.badges.difficulty === "Medium" ? "warning.main" :
                      "error.main",
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{details.badges.difficulty}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 2, md: 2.25 } }}>
              <Typography sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 700, lineHeight: 1.15 }}>{details.title}</Typography>

              <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 2.5, color: "grey.600" }}>
                <Box
                  onClick={handleLikeClick}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: token && userId ? "pointer" : "default",
                    opacity: isLiking ? 0.6 : 1,
                  }}
                >
                  <Heart size={17} fill={isLikedByUser ? "#ef4444" : "none"} style={{ color: isLikedByUser ? "#ef4444" : "#9ca3af" }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{likesCount}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <MessageCircle size={17} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{details.stats.commentsCount}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2.5, display: "flex", alignItems: "center", gap: 1.2 }}>
                <Avatar src={details.author.avatarUrl} alt={details.author.username} sx={{ width: 34, height: 34, fontSize: 14 }}>
                  {details.author.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{details.author.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: "grey.500" }}>{details.createdAtLabel}</Typography>
                </Box>
              </Box>

              <Typography sx={{ mt: 2.5, color: "grey.700", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {details.description}
              </Typography>

              <Box sx={{ mt: 2.25, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: "grey.200" }}>
                  <Typography sx={{ fontSize: 13, letterSpacing: 0.8, fontWeight: 700, color: "grey.500" }}>INGREDIENTS</Typography>
                  <Box component="ul" sx={{ mt: 1.6, pl: 2.1, mb: 0, '& li::marker': { color: '#EA7317', fontSize: '1.2em' } }}>
                    {details.ingredients.map((ingredient) => (
                      <Typography key={ingredient} component="li" sx={{ mb: 1.1, color: "grey.800", lineHeight: 1.55 }}>
                        {ingredient}
                      </Typography>
                    ))}
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: "grey.200" }}>
                  <Typography sx={{ fontSize: 13, letterSpacing: 0.8, fontWeight: 700, color: "grey.500" }}>INSTRUCTIONS</Typography>
                  <Box sx={{ mt: 1.6, display: "flex", flexDirection: "column", gap: 1.4 }}>
                    {details.instructions.map((step, index) => (
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
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default RecipeDetailsModal;
