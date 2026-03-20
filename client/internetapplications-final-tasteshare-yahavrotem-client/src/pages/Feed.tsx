import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import Post from "../components/Post";
import type { Post as PostType, User } from "../types/post";

const mockUser: User = {
  _id: "u1",
  username: "Maria Chen",
  profileImage: "https://ui-avatars.com/api/?name=Maria+Chen&background=E8634F&color=fff&size=128&bold=true",
};

const mockUser2: User = {
  _id: "u2",
  username: "Alex Rivera",
  profileImage: "https://ui-avatars.com/api/?name=Alex+Rivera&background=4F8FE8&color=fff&size=128&bold=true",
};

const mockPosts: PostType[] = [
  {
    _id: "p1",
    userID: "u1",
    title: "Creamy Garlic Tuscan Pasta",
    content: "A rich and comforting weeknight pasta with sun-dried tomatoes, wilted baby spinach, and a velvety parmesan cream sauce that coats every strand of linguine.",
    image: "https://images.unsplash.com/photo-1770908811367-e1232962e81b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2glMjBvdmVyaGVhZHxlbnwxfHx8fDE3NzM0OTI2MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: "2h ago",
    likesCount: 234,
    commentsCount: 18,
    cookTime: "25 min",
    difficulty: "Easy",
  },
  {
    _id: "p2",
    userID: "u2",
    title: "Ultimate Avocado Toast with Poached Egg",
    content: "Perfectly ripe avocado smashed on artisan sourdough, crowned with a runny poached egg, Aleppo pepper flakes, and a bright squeeze of lemon. Brunch perfection.",
    image: "https://images.unsplash.com/photo-1609158087148-3bae840bcfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvJTIwdG9hc3QlMjBicmVha2Zhc3R8ZW58MXx8fHwxNzczNDY4NjU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: "4h ago",
    likesCount: 187,
    commentsCount: 24,
    cookTime: "15 min",
    difficulty: "Easy",
  },
  {
    _id: "p3",
    userID: "u1",
    title: "Triple Chocolate Lava Cake",
    content: "An indulgent dessert with a molten dark chocolate center, a delicate cocoa shell, and a dusting of powdered sugar. Serve warm with a scoop of vanilla bean ice cream.",
    image: "https://images.unsplash.com/photo-1607257882338-70f7dd2ae344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwZGVzc2VydHxlbnwxfHx8fDE3NzM0NTYxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAt: "6h ago",
    likesCount: 412,
    commentsCount: 56,
    cookTime: "30 min",
    difficulty: "Advanced",
  }
];

const Feed: React.FC = () => {
  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 }, bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "grey.900", mb: 0.5 }}>
          Recipe Feed
        </Typography>
        <Typography variant="body2" sx={{ color: "grey.500" }}>
          Discover delicious recipes from the community
        </Typography>
      </Box>

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 2.5,
        }}
      >
        {mockPosts.map((post) => (
          <Post 
            key={post._id} 
            post={post} 
            user={post.userID === "u1" ? mockUser : mockUser2} 
          />
        ))}
      </Box>

      {/* Pagination Placeholder */}
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 6, pb: 4 }}>
        <CircularProgress size={30} thickness={4} sx={{ color: "grey.300" }} />
      </Box>
    </Box>
  );
};

export default Feed;
