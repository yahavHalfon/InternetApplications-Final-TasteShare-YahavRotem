import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Alert, CircularProgress } from "@mui/material";
import { recipeService } from "../services/recipeService";
import "./CreateRecipe.css";

type CreateRecipeProps = {
  token: string;
};

type Difficulty = "Easy" | "Medium" | "Advanced";

const defaultIngredient = "";
const defaultInstruction = "";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const hourOptions = Array.from({ length: 13 }, (_, index) => index);
const minuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);

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

function CreateRecipe({ token }: CreateRecipeProps) {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([defaultIngredient]);
  const [instructions, setInstructions] = useState<string[]>([defaultInstruction]);
  const [cookHours, setCookHours] = useState("0");
  const [cookMinutes, setCookMinutes] = useState("25");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const hasCookDuration = Number(cookHours) > 0 || Number(cookMinutes) > 0;

    return (
      !isSubmitting
      && !!imageFile
      && title.trim().length > 0
      && description.trim().length > 0
      && ingredients.some((item) => item.trim().length > 0)
      && instructions.some((item) => item.trim().length > 0)
      && hasCookDuration
      && Number(servings) > 0
    );
  }, [cookHours, cookMinutes, description, imageFile, ingredients, instructions, isSubmitting, servings, title]);

  const updateIngredient = (index: number, value: string) => {
    setIngredients((prev) => prev.map((current, i) => (i === index ? value : current)));
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions((prev) => prev.map((current, i) => (i === index ? value : current)));
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, ""]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions((prev) => [...prev, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");

    if (!allowedImageTypes.has(file.type)) {
      setError("Only JPG, PNG, GIF or WebP images are allowed.");
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image is too large. Max size is 5 MB.");
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
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
          cookTime: formatCookDuration(Number(cookHours), Number(cookMinutes)),
          servings: Number(servings),
          difficulty,
        },
        token,
      );

      navigate("/feed");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create recipe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-recipe-page">
      <div className="create-recipe-header">
        <div>
          <h1>New Recipe</h1>
          <p>Share your culinary creation with the community</p>
        </div>
        <div className="create-recipe-header-actions">
          <button type="button" className="create-recipe-cancel" onClick={() => navigate("/feed")}>Cancel</button>
          <button
            type="button"
            className="create-recipe-publish"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={14} thickness={5} color="inherit" />
                Publishing...
              </>
            ) : "Publish Recipe"}
          </button>
        </div>
      </div>

      <div className="create-recipe-grid">
        <div className="create-recipe-main">
          <section className="create-recipe-card create-recipe-image-card">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="create-recipe-file-input"
              onChange={handleFileChange}
            />
            {imagePreviewUrl ? (
              <div className="create-recipe-image-preview-wrap">
                <img src={imagePreviewUrl} alt="Recipe preview" className="create-recipe-image-preview" />
                <button type="button" className="create-recipe-remove-image" onClick={removeImage}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="create-recipe-upload-placeholder"
                onClick={() => imageInputRef.current?.click()}
              >
                <span className="create-recipe-upload-icon">
                  <ImagePlus size={24} />
                </span>
                <span className="create-recipe-upload-text">Click to upload a photo of your dish</span>
                <span className="create-recipe-upload-hint">JPG, PNG or WebP. Max 5 MB.</span>
              </button>
            )}
          </section>

          <section className="create-recipe-card create-recipe-text-card">
            <label className="create-recipe-label" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g., Classic Margherita Pizza"
              className="create-recipe-input"
            />

            <label className="create-recipe-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="A short, enticing description of the dish..."
              className="create-recipe-textarea"
            />
          </section>

          <section className="create-recipe-card">
            <label className="create-recipe-label">Ingredients</label>
            <div className="create-recipe-list">
              {ingredients.map((ingredient, index) => (
                <div key={`ingredient-${index}`} className="create-recipe-list-row">
                  <span className="create-recipe-dot" />
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(event) => updateIngredient(index, event.target.value)}
                    placeholder={`Ingredient ${index + 1}, e.g., 2 cups all-purpose flour`}
                    className="create-recipe-list-input"
                  />
                  {ingredients.length > 1 ? (
                    <button type="button" className="create-recipe-delete" onClick={() => removeIngredient(index)}>
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button type="button" className="create-recipe-add" onClick={addIngredient}>
              <Plus size={15} /> Add ingredient
            </button>
          </section>

          <section className="create-recipe-card">
            <label className="create-recipe-label">Step-by-Step Instructions</label>
            <div className="create-recipe-list create-recipe-list-steps">
              {instructions.map((instruction, index) => (
                <div key={`instruction-${index}`} className="create-recipe-step-row">
                  <span className="create-recipe-step-index">{index + 1}</span>
                  <textarea
                    value={instruction}
                    onChange={(event) => updateInstruction(index, event.target.value)}
                    rows={2}
                    placeholder={`Step ${index + 1}, e.g., Preheat oven to 425°F...`}
                    className="create-recipe-list-textarea"
                  />
                  {instructions.length > 1 ? (
                    <button type="button" className="create-recipe-delete create-recipe-step-delete" onClick={() => removeInstruction(index)}>
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button type="button" className="create-recipe-add" onClick={addInstruction}>
              <Plus size={15} /> Add step
            </button>
          </section>
        </div>

        <aside className="create-recipe-sidebar">
          <section className="create-recipe-card create-recipe-sticky">
            <h3>Recipe Details</h3>

            <label className="create-recipe-sidebar-label" htmlFor="cook-time">Cook Time</label>
            <div id="cook-time" className="create-recipe-duration-row" role="group" aria-label="Cook duration picker">
              <select
                value={cookHours}
                onChange={(event) => setCookHours(event.target.value)}
                className="create-recipe-sidebar-input create-recipe-duration-input"
              >
                {hourOptions.map((hour) => (
                  <option key={hour} value={String(hour)}>{hour} hr</option>
                ))}
              </select>
              <select
                value={cookMinutes}
                onChange={(event) => setCookMinutes(event.target.value)}
                className="create-recipe-sidebar-input create-recipe-duration-input"
              >
                {minuteOptions.map((minute) => (
                  <option key={minute} value={String(minute)}>{minute} min</option>
                ))}
              </select>
            </div>

            <label className="create-recipe-sidebar-label" htmlFor="servings">Servings</label>
            <input
              id="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(event) => setServings(event.target.value)}
              placeholder="e.g., 4"
              className="create-recipe-sidebar-input"
            />

            <label className="create-recipe-sidebar-label">Difficulty</label>
            <div className="create-recipe-difficulty-grid">
              {(["Easy", "Medium", "Advanced"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`create-recipe-difficulty create-recipe-difficulty-${level.toLowerCase()} ${difficulty === level ? "active" : ""}`}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>

            {error ? (
              <Alert severity="error" sx={{ mb: 1.5, fontSize: "13px", py: 0.5 }}>
                {error}
              </Alert>
            ) : null}

            <button
              type="button"
              className="create-recipe-sidebar-publish"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={14} thickness={5} color="inherit" />
                  Publishing...
                </>
              ) : "Publish Recipe"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default CreateRecipe;
