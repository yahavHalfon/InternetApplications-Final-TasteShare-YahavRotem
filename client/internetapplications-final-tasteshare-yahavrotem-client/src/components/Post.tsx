import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { PostProps } from "../types/post";

const Post: React.FC<PostProps> = ({ post, user }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        borderColor: "grey.200",
        transition: "box-shadow 0.3s",
        "&:hover": {
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      }}
    >
      {/* Image Container */}
      {post.image && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            paddingTop: "62.5%", // 16:10 aspect ratio
            backgroundColor: "grey.100",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={post.image}
            alt={post.title || "Post image"}
            loading="lazy"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s",
              "&:hover": {
                transform: "scale(1.03)",
              },
            }}
          />
          {/* Top Right Badges */}
          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              gap: 1,
            }}
          >
            {post.cookTime && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 4,
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(4px)",
                  color: "grey.600",
                }}
              >
                <AccessTimeIcon sx={{ fontSize: 11 }} />
                <Typography sx={{ fontSize: 11, fontWeight: 500 }}>
                  {post.cookTime}
                </Typography>
              </Box>
            )}
            {post.difficulty && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 4,
                  backdropFilter: "blur(4px)",
                  bgcolor: 
                    post.difficulty === "Easy" ? "rgba(236, 253, 245, 0.9)" :
                    post.difficulty === "Medium" ? "rgba(255, 251, 235, 0.9)" : 
                    "rgba(254, 242, 242, 0.9)",
                  color: 
                    post.difficulty === "Easy" ? "success.main" :
                    post.difficulty === "Medium" ? "warning.main" : 
                    "error.main",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 500 }}>
                  {post.difficulty}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* User Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Avatar
            src={user.profileImage}
            alt={user.username}
            sx={{ width: 24, height: 24, fontSize: 12, bgcolor: "primary.main" }}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ fontSize: 12, color: "grey.500" }}>
            {user.username}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "grey.300" }}>·</Typography>
          <Typography sx={{ fontSize: 12, color: "grey.400" }}>
            {post.createdAt}
          </Typography>
        </Box>

        {/* Text */}
        {post.title && (
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "grey.900",
              mb: 0.5,
            }}
          >
            {post.title}
          </Typography>
        )}
        <Typography
          sx={{
            fontSize: 13,
            color: "grey.600",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 2,
          }}
        >
          {post.content}
        </Typography>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "grey.100",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover .icon": { color: "error.light" } }}>
            <FavoriteBorderIcon className="icon" sx={{ fontSize: 17, color: "grey.400", transition: "color 0.2s" }} />
            <Typography sx={{ fontSize: 12, color: "grey.400" }}>
              {post.likesCount}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover .icon": { color: "warning.light" } }}>
            <ChatBubbleOutlineIcon className="icon" sx={{ fontSize: 17, color: "grey.400", transition: "color 0.2s" }} />
            <Typography sx={{ fontSize: 12, color: "grey.400" }}>
              {post.commentsCount}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default Post;
