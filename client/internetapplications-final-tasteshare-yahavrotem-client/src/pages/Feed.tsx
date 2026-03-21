import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import { LogOut } from "lucide-react";
import Post from "../components/Post";
import type { Post as PostType, User } from "../types/post";
import { postService } from "../services/postService";

interface FeedProps {
  onLogout: () => void;
}

const Feed: React.FC<FeedProps> = ({ onLogout }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiPosts = await postService.getPosts();

        const mappedPosts: PostType[] = apiPosts.map((post) => ({
          _id: post.id,
          userID: post.id,
          title: post.title,
          content: post.content,
          image: post.imageUrl,
          createdAt: post.createdAtText ?? "",
          likesCount: post.likesCount ?? 0,
          commentsCount: post.commentsCount ?? 0,
          cookTime: post.cookTime,
          difficulty: post.difficulty,
        }));

        const mappedUsers = apiPosts.reduce<Record<string, User>>((acc, post) => {
          acc[post.id] = {
            _id: post.id,
            username: post.username,
            profileImage: post.userImageUrl,
          };
          return acc;
        }, {});

        setPosts(mappedPosts);
        setUsersById(mappedUsers);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load feed posts.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPosts();
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
        {posts.map((post) => (
          <Post 
            key={post._id} 
            post={post} 
            user={usersById[post.userID] ?? { _id: post.userID, username: "Unknown User" }}
          />
        ))}
      </Box>

      {/* Pagination Placeholder */}
      {!isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 6, pb: 4 }}>
          <CircularProgress size={30} thickness={4} sx={{ color: "grey.300" }} />
        </Box>
      ) : null}
    </Box>
  );
};

export default Feed;
