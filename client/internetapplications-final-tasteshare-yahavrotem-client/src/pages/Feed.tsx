import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import { LogOut } from "lucide-react";
import RecipeCard from "../components/RecipeCard";
import type { RecipeFeedItem, User } from "../types/recipe";
import { recipeService } from "../services/recipeService";

interface FeedProps {
  onLogout: () => void;
}

const Feed: React.FC<FeedProps> = ({ onLogout }) => {
  const [recipes, setRecipes] = useState<RecipeFeedItem[]>([]);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const recipes = await recipeService.getRecipes();

        const mappedRecipes: RecipeFeedItem[] = recipes.map((recipe) => ({
          _id: recipe._id,
          userID: recipe.userId,
          title: recipe.title,
          content: recipe.description,
          image: recipe.image,
          createdAt: new Date(recipe.createdAt).toLocaleDateString(),
          likesCount: recipe.likedBy?.length ?? 0,
          commentsCount: 0,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
        }));

        const mappedUsers = recipes.reduce<Record<string, User>>((acc, recipe) => {
          acc[recipe.userId] = {
            _id: recipe.userId,
            username: "TasteShare Chef",
          };
          return acc;
        }, {});

        setRecipes(mappedRecipes);
        setUsersById(mappedUsers);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load recipes.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRecipes();
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 }, bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "grey.900", mb: 0.5 }}>
            Recipe Feed
          </Typography>
          <Typography variant="body2" sx={{ color: "grey.500" }}>
            Discover delicious recipes from the community
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="inherit" 
          onClick={onLogout}
          startIcon={<LogOut size={18} />}
          sx={{ borderColor: "grey.300", color: "grey.700", textTransform: "none", fontWeight: 600 }}
        >
          Logout
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 8 }}>
          <CircularProgress size={34} thickness={4} />
        </Box>
      ) : null}

      {error ? (
        <Typography sx={{ color: "error.main", mb: 2 }}>{error}</Typography>
      ) : null}

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 2.5,
        }}
      >
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe._id}
            recipe={recipe}
            user={usersById[recipe.userID] ?? { _id: recipe.userID, username: "Unknown User" }}
          />
        ))}
      </Box>

    </Box>
  );
};

export default Feed;
