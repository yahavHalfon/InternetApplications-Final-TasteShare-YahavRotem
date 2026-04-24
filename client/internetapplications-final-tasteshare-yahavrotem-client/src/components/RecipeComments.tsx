import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { API_BASE_URL } from "../config/env";
import { commentService } from "../services/commentService";
import type { RecipeComment } from "../types/comment";

type RecipeCommentsProps = {
  recipeId: string;
  token?: string;
  userId?: string;
  onCountChange?: (count: number) => void;
};

const toApiAssetUrl = (assetPath?: string): string => {
  if (!assetPath) {
    return "";
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

const formatCommentDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const RecipeComments = ({ recipeId, token, userId, onCountChange }: RecipeCommentsProps) => {
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await commentService.getRecipeComments(recipeId);
        if (!isMounted) {
          return;
        }
        setComments(data);
        onCountChange?.(data.length);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load comments.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  const canSubmit = useMemo(() => Boolean(token && userId && input.trim() && !isSubmitting), [token, userId, input, isSubmitting]);

  const submitComment = async () => {
    const text = input.trim();
    if (!token || !userId || !text || isSubmitting || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;

    const optimisticComment: RecipeComment = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      recipeId,
      text,
      createdAt: new Date().toISOString(),
      author: {
        id: userId,
        name: "You",
        avatarUrl: "",
      },
    };

    setIsSubmitting(true);
    setError(null);
    setInput("");
    setComments((prev) => {
      const next = [...prev, optimisticComment];
      onCountChange?.(next.length);
      return next;
    });

    try {
      const created = await commentService.createRecipeComment(recipeId, text, token);
      setComments((prev) => {
        let wasReplaced = false;
        const next = prev.map((comment) => {
          if (comment.id !== optimisticComment.id) {
            return comment;
          }
          wasReplaced = true;
          return {
            ...created,
            text: created.text || text,
          };
        });

        return wasReplaced ? next : [...next, { ...created, text: created.text || text }];
      });
    } catch (submitError) {
      setComments((prev) => {
        const next = prev.filter((comment) => comment.id !== optimisticComment.id);
        onCountChange?.(next.length);
        return next;
      });
      setInput(text);
      setError(submitError instanceof Error ? submitError.message : "Failed to create comment.");
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
        Comments
      </Typography>

      {isLoading ? (
        <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : comments.length ? (
        <Stack spacing={2}>
          {comments.map((comment) => (
            <Stack key={comment.id} direction="row" spacing={1.25}>
              <Avatar src={toApiAssetUrl(comment.author.avatarUrl)} alt={comment.author.name} sx={{ width: 30, height: 30 }}>
                {comment.author.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {comment.author.name}
                  </Typography>
                  <Typography variant="caption" color="grey.500">
                    {formatCommentDate(comment.createdAt)}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {comment.text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="grey.500">
          No comments yet. Be the first to comment.
        </Typography>
      )}

      <TextField
        fullWidth
        size="small"
        placeholder={token && userId ? "Add a comment..." : "Login to add a comment"}
        value={input}
        disabled={!token || !userId}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submitComment();
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => void submitComment()} disabled={!canSubmit}>
                  <Send sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {error ? (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      ) : null}
    </Stack>
  );
};

export default RecipeComments;
