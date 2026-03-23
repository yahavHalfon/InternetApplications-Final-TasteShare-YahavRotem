import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { GridView, Restaurant } from "@mui/icons-material";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipe } from "../services/recipeService";

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
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  sx={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "grey.100",
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
                      alignItems: "flex-end",
                      p: 1.5,
                    }}
                  >
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
    </Paper>
  );
}

export default MyRecipesSection;
