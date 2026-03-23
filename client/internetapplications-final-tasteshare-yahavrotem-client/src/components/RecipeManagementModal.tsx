import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, AddPhotoAlternate, Delete } from "@mui/icons-material";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipe } from "../services/recipeService";

type RecipeManagementModalsProps = {
  token: string;
  editingRecipe: ApiRecipe | null;
  deleteCandidate: ApiRecipe | null;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onRecipeUpdated: (recipe: ApiRecipe) => void;
  onRecipeDeleted: (recipeId: string) => void;
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

function RecipeManagementModals({
  token,
  editingRecipe,
  deleteCandidate,
  onCloseEdit,
  onCloseDelete,
  onRecipeUpdated,
  onRecipeDeleted,
}: RecipeManagementModalsProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setEditImagePreview((previousPreview) => {
      if (previousPreview.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreview);
      }

      return editingRecipe ? toApiAssetUrl(editingRecipe.image) : "";
    });

    if (!editingRecipe) {
      setEditTitle("");
      setEditDescription("");
      setEditIngredients([""]);
      setEditInstructions([""]);
      setEditCookHours(0);
      setEditCookMinutes(0);
      setEditServings("");
      setEditDifficulty("Easy");
      setEditImageValue(null);
      setEditError(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    const cookDuration = parseCookDuration(editingRecipe.cookTime);
    setEditTitle(editingRecipe.title);
    setEditDescription(editingRecipe.description);
    setEditIngredients(editingRecipe.ingredients?.length ? editingRecipe.ingredients : [""]);
    setEditInstructions(editingRecipe.instructions?.length ? editingRecipe.instructions : [""]);
    setEditCookHours(cookDuration.hours);
    setEditCookMinutes(cookDuration.minutes);
    setEditServings(String(editingRecipe.servings ?? ""));
    setEditDifficulty(editingRecipe.difficulty);
    setEditImageValue(null);
    setEditError(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [editingRecipe]);

  useEffect(() => {
    return () => {
      if (editImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [editImagePreview]);

  const closeEditDialog = () => {
    if (isUpdating) {
      return;
    }
    onCloseEdit();
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

    setEditError(null);

    if (!allowedImageTypes.has(file.type)) {
      setEditError("Only JPG, PNG, GIF or WebP images are allowed.");
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setEditError("Image is too large. Max size is 5 MB.");
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
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
      setEditError(imageError instanceof Error ? imageError.message : "Failed to read image file.");
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecipe || isUpdating) {
      return;
    }

    setIsUpdating(true);
    setEditError(null);

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

      onRecipeUpdated(updatedRecipe);
      onCloseEdit();
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : "Failed to update recipe.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!deleteCandidate || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await recipeService.deleteRecipe(deleteCandidate._id, token);
      onRecipeDeleted(deleteCandidate._id);
      onCloseDelete();
    } catch (deleteActionError) {
      setDeleteError(deleteActionError instanceof Error ? deleteActionError.message : "Failed to delete recipe.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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

            {editError ? (
              <Typography color="error.main" variant="body2">
                {editError}
              </Typography>
            ) : null}

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

      <Dialog open={!!deleteCandidate} onClose={onCloseDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete Recipe?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. This recipe will be permanently removed.
          </Typography>
          {deleteError ? (
            <Typography color="error.main" variant="body2" sx={{ mt: 1.5 }}>
              {deleteError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onCloseDelete} variant="outlined" color="inherit" disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={() => void handleDeleteRecipe()} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default RecipeManagementModals;
