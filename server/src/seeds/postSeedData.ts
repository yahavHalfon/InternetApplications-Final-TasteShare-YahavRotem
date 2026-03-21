import type { PostDifficulty } from "../model/postModel";

export type PostSeedItem = {
  id: string;
  username: string;
  userImageUrl: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAtText: string;
  likesCount: number;
  commentsCount: number;
  cookTime: string;
  difficulty: PostDifficulty;
};

export const postSeedData: PostSeedItem[] = [
  {
    id: "p1",
    username: "Maria Chen",
    userImageUrl:
      "https://ui-avatars.com/api/?name=Maria+Chen&background=E8634F&color=fff&size=128&bold=true",
    title: "Creamy Garlic Tuscan Pasta",
    content:
      "A rich and comforting weeknight pasta with sun-dried tomatoes, wilted baby spinach, and a velvety parmesan cream sauce that coats every strand of linguine.",
    imageUrl:
      "https://images.unsplash.com/photo-1770908811367-e1232962e81b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2glMjBvdmVyaGVhZHxlbnwxfHx8fDE3NzM0OTI2MTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAtText: "2h ago",
    likesCount: 234,
    commentsCount: 18,
    cookTime: "25 min",
    difficulty: "Easy",
  },
  {
    id: "p2",
    username: "Alex Rivera",
    userImageUrl:
      "https://ui-avatars.com/api/?name=Alex+Rivera&background=4F8FE8&color=fff&size=128&bold=true",
    title: "Ultimate Avocado Toast with Poached Egg",
    content:
      "Perfectly ripe avocado smashed on artisan sourdough, crowned with a runny poached egg, Aleppo pepper flakes, and a bright squeeze of lemon. Brunch perfection.",
    imageUrl:
      "https://images.unsplash.com/photo-1609158087148-3bae840bcfda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvJTIwdG9hc3QlMjBicmVha2Zhc3R8ZW58MXx8fHwxNzczNDY4NjU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAtText: "4h ago",
    likesCount: 187,
    commentsCount: 24,
    cookTime: "15 min",
    difficulty: "Easy",
  },
  {
    id: "p3",
    username: "Maria Chen",
    userImageUrl:
      "https://ui-avatars.com/api/?name=Maria+Chen&background=E8634F&color=fff&size=128&bold=true",
    title: "Triple Chocolate Lava Cake",
    content:
      "An indulgent dessert with a molten dark chocolate center, a delicate cocoa shell, and a dusting of powdered sugar. Serve warm with a scoop of vanilla bean ice cream.",
    imageUrl:
      "https://images.unsplash.com/photo-1607257882338-70f7dd2ae344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaG9jb2xhdGUlMjBjYWtlJTIwZGVzc2VydHxlbnwxfHx8fDE3NzM0NTYxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    createdAtText: "6h ago",
    likesCount: 412,
    commentsCount: 56,
    cookTime: "30 min",
    difficulty: "Advanced",
  },
];
