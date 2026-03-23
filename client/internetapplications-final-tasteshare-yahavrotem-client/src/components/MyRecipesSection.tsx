import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
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
import { Add, AddPhotoAlternate, Delete, Edit, GridView, Restaurant } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipe } from "../services/recipeService";

type MyRecipesSectionProps = {
  token: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const hourOptions = Array.from({ length: 13 }, (_, index) => index);
const minuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);

const addListItem = (items: string[]): string[] => [...items, ""];
const removeListItem = (items: string[], index: number): string[] => items.filter((_, i) => i !== index);
const updateListItem = (items: string[], index: number, value: string): string[] =>
  items.map((current, i) => (i === index ? value : current));

const formatCookDuration = (hours: number, minutes: number): string => {
  const segments: string[] = [];
  if (hours > 0) {
    segments.push(`${hours} hr`);
  }
  if (minutes > 0) {
    segments.push(`${minutes} min`);
  }
  return segments.length ? segments.join(" ") : "0 min";
};

const parseCookDuration = (cookTime?: string): { hours: number; minutes: number } => {
  if (!cookTime) {
    return { hours: 0, minutes: 0 };
  }

  const hoursMatch = cookTime.match(/(\d+)\s*hr/i);
  const minutesMatch = cookTime.match(/(\d+)\s*min/i);

  return {
    hours: hoursMatch ? Number(hoursMatch[1]) : 0,
    minutes: minutesMatch ? Number(minutesMatch[1]) : 0,
  };
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

const toApiAssetUrl = (assetPath?: string): string => {
  if (!assetPath) {
    return "";
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

function MyRecipesSection({ token }: MyRecipesSectionProps) {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<ApiRecipe | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIngredients, setEditIngredients] = useState<string[]>([""]);
  const [editInstructions, setEditInstructions] = useState<string[]>([""]);
  const [editCookHours, setEditCookHours] = useState<number>(0);
  const [editCookMinutes, setEditCookMinutes] = useState<number>(0);
  const [editServings, setEditServings] = useState<string>("");
  const [editDifficulty, setEditDifficulty] = useState<ApiRecipe["difficulty"]>("Easy");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageValue, setEditImageValue] = useState<string | null>(null);
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

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`);
  };

  const openEditDialog = (recipe: ApiRecipe) => {
    const cookDuration = parseCookDuration(recipe.cookTime);
    setEditingRecipe(recipe);
    setEditTitle(recipe.title);
    setEditDescription(recipe.description);
    setEditIngredients(recipe.ingredients?.length ? recipe.ingredients : [""]);
    setEditInstructions(recipe.instructions?.length ? recipe.instructions : [""]);
    setEditCookHours(cookDuration.hours);
    setEditCookMinutes(cookDuration.minutes);
    setEditServings(String(recipe.servings ?? ""));
    setEditDifficulty(recipe.difficulty);
    setEditImagePreview(toApiAssetUrl(recipe.image));
    setEditImageValue(null);
    setError(null);
  };

  const resetImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const updateIngredient = (index: number, value: string) => {
    setEditIngredients((prev) => updateListItem(prev, index, value));
  };

  const updateInstruction = (index: number, value: string) => {
    setEditInstructions((prev) => updateListItem(prev, index, value));
  };

  const addIngredient = () => {
    setEditIngredients((prev) => addListItem(prev));
  };

  const removeIngredient = (index: number) => {
    setEditIngredients((prev) => (prev.length > 1 ? removeListItem(prev, index) : prev));
  };

  const addInstruction = () => {
    setEditInstructions((prev) => addListItem(prev));
  };

  const removeInstruction = (index: number) => {
    setEditInstructions((prev) => (prev.length > 1 ? removeListItem(prev, index) : prev));
  };

  const handleEditFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);

    if (!allowedImageTypes.has(file.type)) {
      setError("Only JPG, PNG, GIF or WebP images are allowed.");
      resetImageInput();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image is too large. Max size is 5 MB.");
      resetImageInput();
      return;
    }

    if (editImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editImagePreview);
    }

    try {
      const encodedImage = await fileToDataUrl(file);
      setEditImageValue(encodedImage);
      setEditImagePreview(URL.createObjectURL(file));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Failed to read image file.");
      resetImageInput();
    }
  };

  const closeEditDialog = () => {
    if (isUpdating) {
      return;
    }
    setEditingRecipe(null);
    setEditTitle("");
    setEditDescription("");
    setEditIngredients([""]);
    setEditInstructions([""]);
    setEditCookHours(0);
    setEditCookMinutes(0);
    setEditServings("");
    setEditDifficulty("Easy");
    if (editImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImagePreview("");
    setEditImageValue(null);
    resetImageInput();
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
          image: editImageValue ?? undefined,
          title: editTitle.trim(),
          description: editDescription.trim(),
          ingredients: editIngredients.map((item) => item.trim()).filter(Boolean),
          instructions: editInstructions.map((item) => item.trim()).filter(Boolean),
          cookTime: formatCookDuration(editCookHours, editCookMinutes),
          servings: Number(editServings),
          difficulty: editDifficulty,
        },
        token,
      );

      setRecipes((prev) => prev.map((recipe) => (recipe._id === updatedRecipe._id ? { ...recipe, ...updatedRecipe } : recipe)));
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

        {!isLoading && error ? (
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
                  onClick={() => handleRecipeClick(recipe._id)}
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

      <Dialog open={!!editingRecipe} onClose={closeEditDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit Recipe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box
              component="input"
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={(event) => void handleEditFileChange(event)}
              sx={{ display: "none" }}
            />

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {editImagePreview ? (
                <Box sx={{ position: "relative", aspectRatio: "16/8", bgcolor: "grey.100" }}>
                  <Box component="img" src={editImagePreview} alt="Recipe preview" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <Button
                    size="small"
                    startIcon={<AddPhotoAlternate sx={{ fontSize: 16 }} />}
                    onClick={() => imageInputRef.current?.click()}
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: "rgba(0,0,0,0.55)",
                      color: "common.white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    Change Photo
                  </Button>
                </Box>
              ) : (
                <Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ py: 4 }}>
                  <AddPhotoAlternate sx={{ color: "grey.500" }} />
                  <Button size="small" variant="outlined" onClick={() => imageInputRef.current?.click()}>
                    Upload Photo
                  </Button>
                </Stack>
              )}
            </Box>

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
            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, display: "block", mb: 1 }}>
                Ingredients
              </Typography>
              <Stack spacing={1}>
                {editIngredients.map((ingredient, index) => (
                  <Stack key={`ingredient-${index}`} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                    <TextField
                      fullWidth
                      placeholder={`Ingredient ${index + 1}`}
                      value={ingredient}
                      onChange={(event) => updateIngredient(index, event.target.value)}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeIngredient(index)}
                      disabled={editIngredients.length === 1}
                      sx={{ color: "grey.500", "&:hover": { color: "error.main" } }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button size="small" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={addIngredient} sx={{ mt: 1 }}>
                Add ingredient
              </Button>
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, display: "block", mb: 1 }}>
                Instructions
              </Typography>
              <Stack spacing={1.25}>
                {editInstructions.map((instruction, index) => (
                  <Stack key={`instruction-${index}`} direction="row" alignItems="flex-start" spacing={1}>
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
                        mt: 1,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <TextField
                      fullWidth
                      placeholder={`Step ${index + 1}`}
                      value={instruction}
                      onChange={(event) => updateInstruction(index, event.target.value)}
                      multiline
                      rows={2}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeInstruction(index)}
                      disabled={editInstructions.length === 1}
                      sx={{ color: "grey.500", mt: 1, "&:hover": { color: "error.main" } }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button size="small" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={addInstruction} sx={{ mt: 1 }}>
                Add step
              </Button>
            </Box>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                label="Hours"
                value={editCookHours}
                onChange={(event) => setEditCookHours(Number(event.target.value))}
                fullWidth
                size="small"
              >
                {hourOptions.map((hour) => (
                  <MenuItem key={hour} value={hour}>{`${hour} hr`}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Minutes"
                value={editCookMinutes}
                onChange={(event) => setEditCookMinutes(Number(event.target.value))}
                fullWidth
                size="small"
              >
                {minuteOptions.map((minute) => (
                  <MenuItem key={minute} value={minute}>{`${minute} min`}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Servings"
                value={editServings}
                onChange={(event) => setEditServings(event.target.value)}
                type="number"
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Stack>

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
            disabled={
              isUpdating ||
              !editTitle.trim() ||
              !editDescription.trim() ||
              !editIngredients.some((item) => item.trim().length > 0) ||
              !editInstructions.some((item) => item.trim().length > 0) ||
              Number(editServings) < 1
            }
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
