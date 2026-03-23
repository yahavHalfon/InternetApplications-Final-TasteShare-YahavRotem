import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  ChatBubbleOutline,
  Close,
  Favorite,
  FavoriteBorder,
  People,
  Restaurant,
} from "@mui/icons-material";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipeDetails } from "../services/recipeService";
import type { RecipeFeedItem } from "../types/recipe";
import RecipeComments from "./RecipeComments";

type RecipeDetailModalProps = {
  recipe: RecipeFeedItem | null;
  open: boolean;
  onClose: () => void;
  token?: string;
  userId?: string;
  onLikeChange?: (recipeId: string, likedBy: string[]) => void;
  onCommentCountChange?: (recipeId: string, commentsCount: number) => void;
};

const toApiAssetUrl = (assetPath?: string): string | undefined => {
  if (!assetPath) {
    return undefined;
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

const RecipeDetailModal = ({ recipe, open, onClose, token, userId, onLikeChange, onCommentCountChange }: RecipeDetailModalProps) => {
  const [details, setDetails] = useState<ApiRecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

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
        setCommentsCount(data.stats.commentsCount);
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

  const handleCommentsCountChange = (count: number) => {
    if (!recipe) {
      return;
    }
    setCommentsCount(count);
    onCommentCountChange?.(recipe._id, count);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" } },
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            m: { xs: 1, md: 1.5 },
            maxHeight: "calc(100vh - 16px)",
          },
        },
      }}
    >
      {!recipe ? null : isLoading ? (
        <Box sx={{ minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={30} />
        </Box>
      ) : error || !details ? (
        <DialogContent sx={{ p: 2.5, color: "error.main" }}>{error || "Recipe not found."}</DialogContent>
      ) : (
        <>
          <Box sx={{ position: "relative", height: 320, bgcolor: "grey.100" }}>
            <Box
              component="img"
              src={heroImage}
              alt={details.title}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
            <IconButton
              onClick={onClose}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                bgcolor: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(8px)",
                color: "common.white",
                "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
              }}
            >
              <Close />
            </IconButton>
            <Stack direction="row" spacing={1} sx={{ position: "absolute", bottom: 16, left: 20 }}>
              <Chip
                icon={<AccessTime sx={{ fontSize: 14, color: "white !important" }} />}
                label={details.badges.cookTime}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "common.white", fontSize: 12 }}
              />
              <Chip
                icon={<People sx={{ fontSize: 14, color: "white !important" }} />}
                label={`${details.badges.servings} servings`}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "common.white", fontSize: 12 }}
              />
              <Chip
                icon={<Restaurant sx={{ fontSize: 14, color: "white !important" }} />}
                label={details.badges.difficulty}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "common.white", fontSize: 12 }}
              />
            </Stack>
          </Box>

          <DialogContent sx={{ p: 3, overflowY: "auto" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 22 }}>
                {details.title}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, pt: 0.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  onClick={() => void handleLikeClick()}
                  sx={{ cursor: token && userId ? "pointer" : "default", opacity: isLiking ? 0.6 : 1 }}
                >
                  {isLikedByUser ? (
                    <Favorite sx={{ fontSize: 20, color: "error.main" }} />
                  ) : (
                    <FavoriteBorder sx={{ fontSize: 20, color: "grey.400" }} />
                  )}
                  <Typography variant="body2" sx={{ color: isLikedByUser ? "error.main" : "grey.500" }}>
                    {likesCount}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1 }}>
                  <ChatBubbleOutline sx={{ fontSize: 20, color: "grey.400" }} />
                  <Typography variant="body2" color="grey.500">
                    {commentsCount}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <Avatar src={details.author.avatarUrl} alt={details.author.username} sx={{ width: 24, height: 24 }}>
                {details.author.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                by {" "}
                <Typography component="span" variant="body2" color="text.primary">
                  {details.author.name}
                </Typography>
              </Typography>
              <Typography variant="body2" color="grey.300">
                &middot;
              </Typography>
              <Typography variant="body2" color="grey.500">
                {details.createdAtLabel}
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3, whiteSpace: "pre-line" }}>
              {details.description}
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 4 }}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, mb: 1.5, display: "block" }}>
                  Ingredients
                </Typography>
                <Stack spacing={1}>
                  {details.ingredients.map((ingredient) => (
                    <Stack key={ingredient} direction="row" alignItems="flex-start" spacing={1.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", mt: "7px", flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {ingredient}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, mb: 1.5, display: "block" }}>
                  Instructions
                </Typography>
                <Stack spacing={1.5}>
                  {details.instructions.map((step, index) => (
                    <Stack key={`${index + 1}-${step}`} direction="row" spacing={1.5}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,107,53,0.1)",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0.25,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {step}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Box>

            <RecipeComments
              recipeId={recipe._id}
              token={token}
              userId={userId}
              onCountChange={handleCommentsCountChange}
            />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};

export default RecipeDetailModal;
