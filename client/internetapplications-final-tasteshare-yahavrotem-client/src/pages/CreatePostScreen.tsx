import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Add,
  AddPhotoAlternate,
  Close,
  Delete,
} from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { recipeService } from "../services/recipeService";

type CreatePostScreenProps = {
  token: string;
};

type Difficulty = "Easy" | "Medium" | "Advanced";

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
  return segments.join(" ");
};

const CreatePostScreen = ({ token }: CreatePostScreenProps) => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [cookHours, setCookHours] = useState<number>(0);
  const [cookMinutes, setCookMinutes] = useState<number>(25);
  const [servings, setServings] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const canSubmit =
    !isSubmitting &&
    imageFile &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    ingredients.some((item) => item.trim().length > 0) &&
    instructions.some((item) => item.trim().length > 0) &&
    Number(servings) > 0;

  const resetImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const updateIngredient = (index: number, value: string) => {
    setIngredients((prev) => updateListItem(prev, index, value));
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions((prev) => updateListItem(prev, index, value));
  };

  const addIngredient = () => {
    setIngredients((prev) => addListItem(prev));
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => removeListItem(prev, index));
  };

  const addInstruction = () => {
    setInstructions((prev) => addListItem(prev));
  };

  const removeInstruction = (index: number) => {
    setInstructions((prev) => removeListItem(prev, index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");

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

    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(null);
    setImagePreviewUrl("");
    resetImageInput();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !imageFile) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await recipeService.createRecipe(
        {
          image: imageFile,
          title,
          description,
          ingredients: ingredients.map((item) => item.trim()).filter(Boolean),
          instructions: instructions.map((item) => item.trim()).filter(Boolean),
          cookTime: formatCookDuration(cookHours, cookMinutes),
          servings: Number(servings),
          difficulty,
        },
        token,
      );

      navigate("/recipes");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create recipe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={(event) => event.preventDefault()} sx={{ minHeight: "100vh", p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
            New Recipe
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Share your culinary creation with the community
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => navigate("/recipes")}
            sx={{ height: 40, color: "text.secondary", borderColor: "grey.300" }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSubmit()} disabled={!canSubmit} sx={{ height: 40 }}>
            {isSubmitting ? "Publishing..." : "Publish Recipe"}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 380px" }, gap: 3, maxWidth: 1100 }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            <Box
              component="input"
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileChange}
              sx={{ display: "none" }}
            />
            {imagePreviewUrl ? (
              <Box sx={{ position: "relative", aspectRatio: "16/8", bgcolor: "grey.100" }}>
                <Box component="img" src={imagePreviewUrl} alt="Recipe preview" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <IconButton
                  onClick={removeImage}
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    bgcolor: "rgba(0,0,0,0.3)",
                    color: "common.white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
                  }}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ) : (
              <Box
                onClick={() => imageInputRef.current?.click()}
                sx={{
                  aspectRatio: "16/8",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "grey.50" },
                  "&:hover [data-slot='upload-icon']": { bgcolor: "rgba(255,107,53,0.1)" },
                  "&:hover [data-slot='upload-icon'] .MuiSvgIcon-root": { color: "primary.main" },
                }}
              >
                <Box
                  data-slot="upload-icon"
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "grey.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <AddPhotoAlternate sx={{ fontSize: 24, color: "grey.400" }} />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Click to upload a photo of your dish</Typography>
                  <Typography variant="caption" color="grey.400">JPG, PNG or WebP. Max 5 MB.</Typography>
                </Box>
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Title"
                placeholder="e.g., Classic Margherita Pizza"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Description"
                placeholder="A short, enticing description of the dish..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                rows={3}
                size="small"
              />
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, mb: 1.5, display: "block" }}>
              Ingredients
            </Typography>
            <Stack spacing={1}>
              {ingredients.map((ingredient, index) => (
                <Stack key={`ingredient-${index}`} direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                  <TextField
                    fullWidth
                    placeholder={`Ingredient ${index + 1}, e.g., 2 cups all-purpose flour`}
                    value={ingredient}
                    onChange={(event) => updateIngredient(index, event.target.value)}
                    size="small"
                  />
                  {ingredients.length > 1 ? (
                    <IconButton size="small" onClick={() => removeIngredient(index)} sx={{ color: "grey.400", "&:hover": { color: "error.main" } }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null}
                </Stack>
              ))}
            </Stack>
            <Button size="small" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={addIngredient} sx={{ mt: 1.5, color: "primary.main" }}>
              Add ingredient
            </Button>
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, mb: 1.5, display: "block" }}>
              Step-by-Step Instructions
            </Typography>
            <Stack spacing={1.5}>
              {instructions.map((instruction, index) => (
                <Stack key={`instruction-${index}`} direction="row" alignItems="flex-start" spacing={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
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
                    placeholder={`Step ${index + 1}, e.g., Preheat oven to 425°F...`}
                    value={instruction}
                    onChange={(event) => updateInstruction(index, event.target.value)}
                    multiline
                    rows={2}
                    size="small"
                  />
                  {instructions.length > 1 ? (
                    <IconButton size="small" onClick={() => removeInstruction(index)} sx={{ color: "grey.400", mt: 1, "&:hover": { color: "error.main" } }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null}
                </Stack>
              ))}
            </Stack>
            <Button size="small" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={addInstruction} sx={{ mt: 1.5, color: "primary.main" }}>
              Add step
            </Button>
          </Paper>
        </Stack>

        <Box>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3, position: "sticky", top: 32 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, mb: 2, display: "block" }}>
              Recipe Details
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  select
                  label="Hours"
                  fullWidth
                  size="small"
                  value={cookHours}
                  onChange={(event) => setCookHours(Number(event.target.value))}
                >
                  {hourOptions.map((hour) => (
                    <MenuItem key={hour} value={hour}>{`${hour} hr`}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Minutes"
                  fullWidth
                  size="small"
                  value={cookMinutes}
                  onChange={(event) => setCookMinutes(Number(event.target.value))}
                >
                  {minuteOptions.map((minute) => (
                    <MenuItem key={minute} value={minute}>{`${minute} min`}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                fullWidth
                label="Servings"
                placeholder="e.g., 4"
                type="number"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
                size="small"
                slotProps={{ htmlInput: { min: 1 } }}
              />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Difficulty
                </Typography>
                <ToggleButtonGroup
                  value={difficulty}
                  exclusive
                  onChange={(_, value: Difficulty | null) => {
                    if (value) {
                      setDifficulty(value);
                    }
                  }}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value="Easy" sx={{ fontSize: 12, color: difficulty === "Easy" ? "success.main" : undefined }}>Easy</ToggleButton>
                  <ToggleButton value="Medium" sx={{ fontSize: 12, color: difficulty === "Medium" ? "warning.main" : undefined }}>Medium</ToggleButton>
                  <ToggleButton value="Advanced" sx={{ fontSize: 12, color: difficulty === "Advanced" ? "error.main" : undefined }}>Advanced</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {error ? (
                <Typography color="error.main" variant="body2">
                  {error}
                </Typography>
              ) : null}

              <Box sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <Button variant="contained" fullWidth onClick={() => void handleSubmit()} disabled={!canSubmit} sx={{ height: 44 }}>
                  {isSubmitting ? "Publishing..." : "Publish Recipe"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CreatePostScreen;
