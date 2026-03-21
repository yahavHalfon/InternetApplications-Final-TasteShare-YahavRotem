import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import RecipeCard from "../components/RecipeCard";
import type { RecipeFeedItem, User } from "../types/recipe";
import { recipeService } from "../services/recipeService";

const PAGE_SIZE = 9;

const Feed: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeFeedItem[]>([]);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadRecipes = useCallback(async (page: number, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await recipeService.getRecipes(page, PAGE_SIZE);
      const incomingRecipes = response.data;

      const mappedRecipes: RecipeFeedItem[] = incomingRecipes.map((recipe) => ({
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

      const mappedUsers = incomingRecipes.reduce<Record<string, User>>((acc, recipe) => {
        acc[recipe.userId] = {
          _id: recipe.userId,
          username: "TasteShare Chef",
        };
        return acc;
      }, {});

      setRecipes((prev) => (append ? [...prev, ...mappedRecipes] : mappedRecipes));
      setUsersById((prev) => ({ ...prev, ...mappedUsers }));
      setHasMore(response.hasMore);
      pageRef.current = page;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load recipes.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadRecipes(1, false);
  }, [loadRecipes]);

  useEffect(() => {
    if (!loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first.isIntersecting || isLoading || isLoadingMore || !hasMore) {
          return;
        }
        void loadRecipes(pageRef.current + 1, true);
      },
      { threshold: 0.2 },
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, loadRecipes]);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 }, bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "grey.900", mb: 0.5 }}>
            Recipe Feed
          </Typography>
          <Typography variant="body2" sx={{ color: "grey.500" }}>
            Discover delicious recipes from the community
          </Typography>
        </Box>
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

      {isLoadingMore ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
          <CircularProgress size={24} thickness={4} />
        </Box>
      ) : null}

      <Box ref={loadMoreRef} sx={{ height: 1 }} />

    </Box>
  );
};

export default Feed;
