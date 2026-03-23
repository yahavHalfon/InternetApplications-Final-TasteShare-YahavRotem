import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, CircularProgress, Grid } from "@mui/material";
import dayjs from "dayjs";
import RecipeCard from "../components/RecipeCard";
import RecipeDetailModal from "../components/RecipeDetailModal";
import type { RecipeFeedItem } from "../types/recipe";
import { API_BASE_URL } from "../config/env";
import { recipeService } from "../services/recipeService";
import { userService } from "../services/userService";

const PAGE_SIZE = 9;

type FeedUserView = {
  username: string;
  profileImage?: string;
};

const toApiAssetUrl = (assetPath?: string): string | undefined => {
  if (!assetPath) {
    return undefined;
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

type FeedScreenProps = {
  token?: string;
  userId?: string;
};

const FeedScreen = ({ token, userId }: FeedScreenProps) => {
  const [recipes, setRecipes] = useState<RecipeFeedItem[]>([]);
  const [usersById, setUsersById] = useState<Record<string, FeedUserView>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeFeedItem | null>(null);
  const pageRef = useRef(1);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const usersCacheRef = useRef<Record<string, FeedUserView>>({});

  const getRecipeUser = (userId: string) => ({
    _id: userId,
    ...(usersById[userId] ?? { username: "Unknown User" }),
  });

  const handleRecipeClick = (recipeId: string) => {
    const clickedRecipe = recipes.find((recipe) => recipe._id === recipeId) ?? null;
    setSelectedRecipe(clickedRecipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const handleRecipeLikeChange = (recipeId: string, likedBy: string[]) => {
    setRecipes((prev) =>
      prev.map((r) => (r._id === recipeId ? { ...r, likedBy, likesCount: likedBy.length } : r))
    );
    setSelectedRecipe((prev) => (prev && prev._id === recipeId ? { ...prev, likedBy, likesCount: likedBy.length } : prev));
  };

  const resolveUsers = useCallback(async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds));
    const missingIds = uniqueIds.filter((id) => !usersCacheRef.current[id]);

    if (missingIds.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      missingIds.map(async (id) => {
        const user = await userService.getUserById(id);
        const name = user?.name?.trim();
        const displayName = name && name.length > 0 ? name : "Unknown User";
        return {
          id,
          user: {
            username: displayName,
            profileImage: toApiAssetUrl(user?.avatarUrl),
          },
        };
      }),
    );

    const updates: Record<string, FeedUserView> = {};

    results.forEach((result, index) => {
      const id = missingIds[index];
      updates[id] =
        result.status === "fulfilled"
          ? result.value.user
          : { username: "Unknown User" };
    });

    usersCacheRef.current = { ...usersCacheRef.current, ...updates };
    setUsersById((prev) => ({ ...prev, ...updates }));
  }, []);

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
        image: toApiAssetUrl(recipe.image),
        createdAt: dayjs(recipe.createdAt).format("DD/MM/YYYY"),
        likesCount: recipe.likedBy?.length ?? 0,
        likedBy: recipe.likedBy ?? [],
        commentsCount: 0,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
      }));

      await resolveUsers(mappedRecipes.map((recipe) => recipe.userID));

      setRecipes((prev) => (append ? [...prev, ...mappedRecipes] : mappedRecipes));
      setHasMore(response.hasMore);
      pageRef.current = page;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load recipes.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [resolveUsers]);

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
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, mb: 0.5 }}
        >
          Recipe Feed
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Discover delicious recipes from the community
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 8 }}>
          <CircularProgress size={34} thickness={4} />
        </Box>
      ) : null}

      {error ? (
        <Typography sx={{ color: "error.main", mb: 2 }}>{error}</Typography>
      ) : null}

      <Grid container spacing={2.5}>
        {recipes.map((recipe) => (
          <Grid key={recipe._id} size={{ xs: 12, md: 6, lg: 4 }}>
            <RecipeCard
              recipe={recipe}
              user={getRecipeUser(recipe.userID)}
              token={token}
              userId={userId}
              onLikeChange={handleRecipeLikeChange}
              onRecipeClick={handleRecipeClick}
            />
          </Grid>
        ))}
      </Grid>

      {isLoadingMore ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
          <CircularProgress size={24} thickness={4} />
        </Box>
      ) : null}

      <Box ref={loadMoreRef} sx={{ height: 1 }} />

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          open={isModalOpen}
          onClose={handleCloseModal}
          token={token}
          userId={userId}
          onLikeChange={handleRecipeLikeChange}
        />
      )}
    </Box>
  );
};

export default FeedScreen;
