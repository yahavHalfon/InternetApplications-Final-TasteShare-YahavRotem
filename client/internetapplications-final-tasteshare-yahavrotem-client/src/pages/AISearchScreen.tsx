import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Card,
  Stack,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Search,
  AutoAwesome,
  Close,
  FavoriteBorder,
  ChatBubbleOutline,
  ArrowForward,
} from "@mui/icons-material";
import { recipeService } from "../services/recipeService";
import type { ApiRecipe, AiGeneratedRecipe } from "../services/recipeService";
import { API_BASE_URL } from "../config/env";

const SUGGESTIONS = [
  "What can I cook with tomatoes, eggs, and onions?",
  "Quick 15-minute weeknight dinners",
  "High-protein meal prep ideas",
  "Gluten-free desserts for a party",
  "Comfort food for a rainy day",
];

const toApiAssetUrl = (path?: string) =>
  path?.startsWith("/") ? `${API_BASE_URL}${path}` : (path ?? "");

function MiniRecipeCard({
  recipe,
  onOpen,
}: {
  recipe: ApiRecipe & { commentsCount?: number };
  onOpen: (r: ApiRecipe) => void;
}) {
  const difficultyColor =
    recipe.difficulty === "Easy"
      ? { bg: "#f0fdf4", color: "#16a34a" }
      : recipe.difficulty === "Medium"
      ? { bg: "#fffbeb", color: "#d97706" }
      : { bg: "#fef2f2", color: "#dc2626" };

  return (
    <Card
      onClick={() => onOpen(recipe)}
      sx={{
        display: "flex",
        height: 180,
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 6px 16px rgba(0,0,0,0.08)" },
        "&:hover .mini-img": { transform: "scale(1.03)" },
      }}
    >
      <Box sx={{ width: 180, height: 180, flexShrink: 0, bgcolor: "grey.100", overflow: "hidden" }}>
        <Box
          component="img"
          src={toApiAssetUrl(recipe.image)}
          alt={recipe.title}
          className="mini-img"
          sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
        />
      </Box>
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="caption" color="grey.400" sx={{ mb: 0.75, display: "block" }}>
            {recipe.cookTime}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {recipe.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.6,
            }}
          >
            {recipe.description}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <FavoriteBorder sx={{ fontSize: 13, color: "grey.500" }} />
            <Typography variant="caption" color="grey.500">
              {recipe.likedBy?.length ?? 0}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ChatBubbleOutline sx={{ fontSize: 13, color: "grey.500" }} />
            <Typography variant="caption" color="grey.500">
              {recipe.commentsCount ?? 0}
            </Typography>
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={recipe.difficulty}
            size="small"
            sx={{ bgcolor: difficultyColor.bg, color: difficultyColor.color, fontSize: 10, height: 22 }}
          />
        </Stack>
      </Box>
    </Card>
  );
}

function AiRecipeCard({ recipe, onOpen }: { recipe: AiGeneratedRecipe; onOpen: (recipe: AiGeneratedRecipe) => void }) {
  const difficultyColor =
    recipe.difficulty === "Easy"
      ? { bg: "#f0fdf4", color: "#16a34a" }
      : recipe.difficulty === "Medium"
      ? { bg: "#fffbeb", color: "#d97706" }
      : { bg: "#fef2f2", color: "#dc2626" };

  return (
    <Card
      onClick={() => onOpen(recipe)}
      sx={{
        display: "flex",
        height: 180,
        border: "1.5px solid",
        borderColor: "primary.light",
        bgcolor: "rgba(255,107,53,0.03)",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 6px 16px rgba(0,0,0,0.08)" },
      }}
    >
      {/* Placeholder gradient instead of image */}
      <Box
        sx={{
          width: 180,
          height: 180,
          flexShrink: 0,
          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AutoAwesome sx={{ fontSize: 40, color: "white", opacity: 0.9 }} />
      </Box>
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="caption" color="grey.400" sx={{ mb: 0.75, display: "block" }}>
            {recipe.cookTime}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {recipe.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.6,
            }}
          >
            {recipe.description}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
          <Chip
            label="AI Generated"
            size="small"
            icon={<AutoAwesome sx={{ fontSize: 10, color: "primary.main" }} />}
            sx={{ bgcolor: "rgba(255,107,53,0.1)", color: "primary.main", fontSize: 10, height: 22 }}
          />
          <Box sx={{ flex: 1 }} />
          <Chip
            label={recipe.difficulty}
            size="small"
            sx={{ bgcolor: difficultyColor.bg, color: difficultyColor.color, fontSize: 10, height: 22 }}
          />
        </Stack>
      </Box>
    </Card>
  );
}

type AISearchScreenProps = {
  token: string;
};

function AISearchScreen({ token }: AISearchScreenProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<(ApiRecipe & { commentsCount?: number })[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiGeneratedRecipe[]>([]);
  const [selectedAiRecipe, setSelectedAiRecipe] = useState<AiGeneratedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;
    setQuery(searchQuery);
    setIsLoading(true);
    setError(null);

    try {
      const response = await recipeService.searchRecipes(searchQuery, token);
      setResults(response.data);
      setAiSuggestions(response.aiSuggestions ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearched(false);
    setResults([]);
    setAiSuggestions([]);
    setError(null);
  };

  const handleOpenRecipe = (recipe: ApiRecipe) => {
    navigate(`/recipes/${recipe._id}`);
  };

  const handleOpenAiRecipe = (recipe: AiGeneratedRecipe) => {
    setSelectedAiRecipe(recipe);
  };

  return (
    <Box sx={{ minHeight: "100vh", p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <AutoAwesome sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography variant="h5" sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
            AI Search
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Ask in plain English and find the perfect recipe
        </Typography>
      </Box>

      {/* Search bar */}
      <Box sx={{ maxWidth: 640, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="What do you want to cook today?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "background.paper", pr: 0.75 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: "grey.400" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {query && (
                      <IconButton size="small" onClick={handleClear}>
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSearch()}
                      disabled={isLoading}
                      startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
                      sx={{ borderRadius: 2, height: 34, fontSize: 13 }}
                    >
                      Search
                    </Button>
                  </Stack>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ maxWidth: 640, mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Searching with AI...
          </Typography>
        </Box>
      )}

      {!searched && !isLoading ? (
            <Box sx={{ maxWidth: 640, mb: 5 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ mb: 1.5, display: "block", letterSpacing: 1.5 }}
              >
                Try asking
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {SUGGESTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      icon={<ArrowForward sx={{ fontSize: 13 }} />}
                      onClick={() => handleSearch(s)}
                      variant="outlined"
                      sx={{
                        borderColor: "grey.200",
                        color: "text.secondary",
                        fontSize: 13,
                        "&:hover": {
                          borderColor: "primary.light",
                          bgcolor: "rgba(255,107,53,0.04)",
                          color: "primary.main",
                        },
                      }}
                    />
                ))}
              </Stack>
            </Box>
        ) : searched && !isLoading ? (
            <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <AutoAwesome sx={{ fontSize: 16, color: "primary.light" }} />
              <Typography variant="body2" color="text.secondary">
                <strong>{results.length} recipes</strong> found for "{query}"
              </Typography>
            </Stack>
            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recipes matched. Try a different query.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ maxWidth: 900 }}>
                {results.map((recipe) => (
                  <Grid size={{ xs: 12, lg: 6 }} key={recipe._id}>
                    <MiniRecipeCard recipe={recipe} onOpen={handleOpenRecipe} />
                  </Grid>
                ))}
              </Grid>
            )}

            {aiSuggestions.length > 0 && (
              <Box sx={{ mt: 5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AutoAwesome sx={{ fontSize: 16, color: "primary.main" }} />
                  <Typography variant="body2" fontWeight={600}>
                    AI Generated Recipes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    — inspired by your search
                  </Typography>
                </Stack>
                <Grid container spacing={2} sx={{ maxWidth: 900 }}>
                  {aiSuggestions.map((recipe, idx) => (
                    <Grid size={{ xs: 12, lg: 6 }} key={idx}>
                      <AiRecipeCard recipe={recipe} onOpen={handleOpenAiRecipe} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            </Box>
        ) : null}

      <Dialog
        open={Boolean(selectedAiRecipe)}
        onClose={() => setSelectedAiRecipe(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesome sx={{ fontSize: 18, color: "primary.main" }} />
          {selectedAiRecipe?.title}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {selectedAiRecipe?.description}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={selectedAiRecipe?.cookTime ?? ""} />
              <Chip size="small" label={selectedAiRecipe?.difficulty ?? ""} />
              <Chip size="small" label={`${selectedAiRecipe?.servings ?? 0} servings`} />
            </Stack>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Ingredients
              </Typography>
              <Stack spacing={0.5}>
                {(selectedAiRecipe?.ingredients ?? []).map((ingredient, index) => (
                  <Typography key={`${ingredient}-${index}`} variant="body2">
                    • {ingredient}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Instructions
              </Typography>
              <Stack spacing={0.75}>
                {(selectedAiRecipe?.instructions ?? []).map((instruction, index) => (
                  <Typography key={`${instruction}-${index}`} variant="body2">
                    {index + 1}. {instruction}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AISearchScreen;
