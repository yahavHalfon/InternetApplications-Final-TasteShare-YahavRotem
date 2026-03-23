import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Edit, GridView, Restaurant } from "@mui/icons-material";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipe } from "../services/recipeService";
import dayjs from "dayjs";
import type { RecipeFeedItem } from "../types/recipe";
import RecipeDetailModal from "./RecipeDetailModal";

type MyRecipesSectionProps = {
  token: string;
  userId: string;
};

const toApiAssetUrl = (assetPath?: string): string => {
  if (!assetPath) {
    return "";
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

function MyRecipesSection({ token, userId }: MyRecipesSectionProps) {
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeFeedItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ApiRecipe | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<ApiRecipe["difficulty"]>("Easy");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<ApiRecipe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadMyRecipes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await recipeService.getMyRecipes(token);
        setRecipes(response.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load your recipes.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMyRecipes();
  }, [token]);

  const toFeedItem = (recipe: ApiRecipe): RecipeFeedItem => ({
    _id: recipe._id,
    userID: recipe.userId,
    title: recipe.title,
    content: recipe.description,
    image: toApiAssetUrl(recipe.image) || undefined,
    createdAt: dayjs(recipe.createdAt).format("DD/MM/YYYY"),
    likesCount: recipe.likedBy?.length ?? 0,
    likedBy: recipe.likedBy ?? [],
    commentsCount: 0,
    cookTime: recipe.cookTime,
    difficulty: recipe.difficulty,
  });

  const handleRecipeClick = (recipe: ApiRecipe) => {
    setSelectedRecipe(toFeedItem(recipe));
    setIsDetailOpen(true);
  };

  const handleCloseRecipe = () => {
    setIsDetailOpen(false);
    setSelectedRecipe(null);
  };

  const handleRecipeLikeChange = (recipeId: string, likedBy: string[]) => {
    setRecipes((prev) =>
      prev.map((recipe) => (recipe._id === recipeId ? { ...recipe, likedBy } : recipe)),
    );
    setSelectedRecipe((prev) => (prev && prev._id === recipeId ? { ...prev, likedBy, likesCount: likedBy.length } : prev));
  };

  const openEditDialog = (recipe: ApiRecipe) => {
    setEditingRecipe(recipe);
    setEditTitle(recipe.title);
    setEditDescription(recipe.description);
    setEditDifficulty(recipe.difficulty);
    setError(null);
  };

  const closeEditDialog = () => {
    if (isUpdating) {
      return;
    }
    setEditingRecipe(null);
    setEditTitle("");
    setEditDescription("");
    setEditDifficulty("Easy");
  };

  const handleSaveEdit = async () => {
    if (!editingRecipe || isUpdating) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const updatedRecipe = await recipeService.updateRecipe(
        editingRecipe._id,
        {
          title: editTitle.trim(),
          description: editDescription.trim(),
          difficulty: editDifficulty,
        },
        token,
      );

      setRecipes((prev) => prev.map((recipe) => (recipe._id === updatedRecipe._id ? { ...recipe, ...updatedRecipe } : recipe)));
      setSelectedRecipe((prev) =>
        prev && prev._id === updatedRecipe._id
          ? {
              ...prev,
              title: updatedRecipe.title,
              content: updatedRecipe.description,
            }
          : prev,
      );
      closeEditDialog();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update recipe.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!deleteCandidate || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await recipeService.deleteRecipe(deleteCandidate._id, token);
      setRecipes((prev) => prev.filter((recipe) => recipe._id !== deleteCandidate._id));
      setSelectedRecipe((prev) => (prev && prev._id === deleteCandidate._id ? null : prev));
      setIsDetailOpen((prevOpen) => (selectedRecipe?._id === deleteCandidate._id ? false : prevOpen));
      setDeleteCandidate(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete recipe.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Paper
      component="section"
      aria-label="My Recipes"
      elevation={0}
      sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
    >
      <Tabs
        value={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontSize: 13, fontWeight: 500 },
          "& .Mui-selected": { color: "text.primary" },
          "& .MuiTabs-indicator": { bgcolor: "primary.main" },
        }}
      >
        <Tab icon={<GridView sx={{ fontSize: 16 }} />} iconPosition="start" label="My Recipes" />
      </Tabs>

      <Box sx={{ p: 2.5 }}>
        {isLoading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : null}

        {!isLoading && !!error ? (
          <Typography color="error.main">{error}</Typography>
        ) : null}

        {!isLoading && !error && recipes.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "grey.50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Restaurant sx={{ fontSize: 28, color: "grey.400" }} />
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              No recipes yet
            </Typography>
            <Typography variant="body2" color="grey.400" sx={{ mt: 0.5 }}>
              Your published recipes will appear here.
            </Typography>
          </Stack>
        ) : null}

        {!isLoading && !error && recipes.length > 0 ? (
          <Grid container spacing={1.5}>
            {recipes.map((recipe) => (
              <Grid key={recipe._id} size={{ xs: 6, md: 4, lg: 3 }}>
                <Box
                  onClick={() => handleRecipeClick(recipe)}
                  sx={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "grey.100",
                    cursor: "pointer",
                    "&:hover [data-slot='tile-overlay']": { opacity: 1 },
                    "&:hover [data-slot='tile-image']": { transform: "scale(1.05)" },
                  }}
                >
                  <Box
                    component="img"
                    src={toApiAssetUrl(recipe.image)}
                    alt={recipe.title}
                    loading="lazy"
                    data-slot="tile-image"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s",
                    }}
                  />
                  <Box
                    data-slot="tile-overlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2), transparent)",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      p: 1.5,
                    }}
                  >
                    <Stack direction="row" justifyContent="flex-end" spacing={0.75}>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDialog(recipe);
                        }}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.9)",
                          backdropFilter: "blur(4px)",
                          width: 32,
                          height: 32,
                          "&:hover": { bgcolor: "white", color: "info.main" },
                        }}
                      >
                        <Edit sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteCandidate(recipe);
                        }}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.9)",
                          backdropFilter: "blur(4px)",
                          width: 32,
                          height: 32,
                          "&:hover": { bgcolor: "white", color: "error.main" },
                        }}
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" sx={{ color: "common.white", fontWeight: 500 }}>
                      {recipe.title}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Box>

      {selectedRecipe ? (
        <RecipeDetailModal
          recipe={selectedRecipe}
          open={isDetailOpen}
          onClose={handleCloseRecipe}
          token={token}
          userId={userId}
          onLikeChange={handleRecipeLikeChange}
        />
      ) : null}

      <Dialog open={!!editingRecipe} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Recipe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              fullWidth
              multiline
              rows={4}
              size="small"
            />
            <TextField
              select
              label="Difficulty"
              value={editDifficulty}
              onChange={(event) => setEditDifficulty(event.target.value as ApiRecipe["difficulty"])}
              fullWidth
              size="small"
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeEditDialog} variant="outlined" color="inherit" disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSaveEdit()}
            variant="contained"
            disabled={isUpdating || !editTitle.trim() || !editDescription.trim()}
          >
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteCandidate} onClose={() => setDeleteCandidate(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Recipe?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. This recipe will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteCandidate(null)} variant="outlined" color="inherit" disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={() => void handleDeleteRecipe()} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MyRecipesSection;
