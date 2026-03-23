import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Delete, Edit, GridView, Restaurant } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipe } from "../services/recipeService";
import RecipeManagementModal from "./RecipeManagementModal";

type MyRecipesSectionProps = {
  token: string;
};

const toApiAssetUrl = (assetPath?: string): string => {
  if (!assetPath) {
    return "";
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

function MyRecipesSection({ token }: MyRecipesSectionProps) {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<ApiRecipe | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ApiRecipe | null>(null);

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

  const handleRecipeUpdated = (updatedRecipe: ApiRecipe) => {
    setRecipes((prev) => prev.map((recipe) => (recipe._id === updatedRecipe._id ? { ...recipe, ...updatedRecipe } : recipe)));
  };

  const handleRecipeDeleted = (recipeId: string) => {
    setRecipes((prev) => prev.filter((recipe) => recipe._id !== recipeId));
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
                          setEditingRecipe(recipe);
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

      <RecipeManagementModal
        token={token}
        editingRecipe={editingRecipe}
        deleteCandidate={deleteCandidate}
        onCloseEdit={() => setEditingRecipe(null)}
        onCloseDelete={() => setDeleteCandidate(null)}
        onRecipeUpdated={handleRecipeUpdated}
        onRecipeDeleted={handleRecipeDeleted}
      />
    </Paper>
  );
}

export default MyRecipesSection;
