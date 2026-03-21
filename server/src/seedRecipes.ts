import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import dotenv from "dotenv";
import User from "./model/userModel";
import Recipe, { type RecipeDifficulty } from "./model/recipeModel";

dotenv.config({ path: ".env.dev" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env.dev");
}

type SeedRecipe = {
  image: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: string;
  servings: number;
  difficulty: RecipeDifficulty;
};

type SeedUser = {
  email: string;
  name: string;
  username: string;
  bio: string;
  location: string;
};

const TOTAL_RECIPES = 100;
const UNKNOWN_USER_RECIPES = 20;
const SEED_PASSWORD = "Password123!";

const seedUsers: SeedUser[] = [
  {
    email: "yahav.seed@tasteshare.local",
    name: "Yahav Chef",
    username: "yahavchef",
    bio: "Home cook and pasta lover.",
    location: "Tel Aviv",
  },
  {
    email: "rotem.seed@tasteshare.local",
    name: "Rotem Baker",
    username: "rotembakes",
    bio: "Bread, cakes, and weekend desserts.",
    location: "Haifa",
  },
  {
    email: "dana.seed@tasteshare.local",
    name: "Dana Green",
    username: "danagreen",
    bio: "Fresh salads and veggie bowls.",
    location: "Jerusalem",
  },
  {
    email: "lior.seed@tasteshare.local",
    name: "Lior Grill",
    username: "liorgrill",
    bio: "Open-flame cooking fan.",
    location: "Beer Sheva",
  },
  {
    email: "maya.seed@tasteshare.local",
    name: "Maya Spice",
    username: "mayaspice",
    bio: "Bold spices and one-pot dinners.",
    location: "Raanana",
  },
  {
    email: "noam.seed@tasteshare.local",
    name: "Noam Quick",
    username: "noamquick",
    bio: "Fast weekday meals.",
    location: "Netanya",
  },
  {
    email: "gal.seed@tasteshare.local",
    name: "Gal Comfort",
    username: "galcomfort",
    bio: "Comfort food all year.",
    location: "Herzliya",
  },
  {
    email: "adi.seed@tasteshare.local",
    name: "Adi Fresh",
    username: "adifresh",
    bio: "Seasonal ingredients only.",
    location: "Eilat",
  },
];

const recipeTemplates: SeedRecipe[] = [
  {
    image:
      "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80",
    title: "One-Pan Lemon Herb Chicken",
    description:
      "Juicy chicken thighs roasted with garlic, lemon, and fresh herbs for a fast and comforting dinner.",
    ingredients: [
      "4 chicken thighs",
      "2 tbsp olive oil",
      "3 garlic cloves, minced",
      "1 lemon, sliced",
      "1 tsp dried oregano",
      "Salt and black pepper",
    ],
    instructions: [
      "Preheat oven to 200C.",
      "Season chicken with oil, garlic, oregano, salt, and pepper.",
      "Arrange in a baking dish with lemon slices.",
      "Bake for 30-35 minutes until golden and cooked through.",
      "Rest for 5 minutes and serve.",
    ],
    cookTime: "40 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    title: "Mediterranean Quinoa Bowl",
    description:
      "A bright protein-rich bowl with quinoa, cucumbers, cherry tomatoes, chickpeas, and a lemon tahini drizzle.",
    ingredients: [
      "1 cup quinoa",
      "2 cups water",
      "1 cup cherry tomatoes, halved",
      "1 cucumber, diced",
      "1 cup cooked chickpeas",
      "3 tbsp tahini",
      "1 tbsp lemon juice",
    ],
    instructions: [
      "Cook quinoa in water until fluffy.",
      "Whisk tahini with lemon juice and a splash of water.",
      "Combine quinoa, tomatoes, cucumber, and chickpeas.",
      "Top with tahini dressing and toss before serving.",
    ],
    cookTime: "25 min",
    servings: 3,
    difficulty: "Easy",
  },
  {
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    title: "Slow-Simmered Mushroom Risotto",
    description:
      "Creamy arborio rice cooked gradually with mushrooms, stock, and parmesan for rich restaurant-style flavor.",
    ingredients: [
      "1 cup arborio rice",
      "4 cups vegetable stock, warm",
      "250g mushrooms, sliced",
      "1 small onion, finely chopped",
      "2 tbsp butter",
      "1/3 cup grated parmesan",
      "2 tbsp olive oil",
    ],
    instructions: [
      "Saute onion and mushrooms in olive oil and butter.",
      "Add rice and stir for 1 minute.",
      "Add warm stock gradually, stirring until absorbed each time.",
      "Continue until rice is creamy and al dente.",
      "Fold in parmesan, season, and serve immediately.",
    ],
    cookTime: "45 min",
    servings: 4,
    difficulty: "Medium",
  },
];

const buildSeedRecipes = (userIds: string[]) => {
  return Array.from({ length: TOTAL_RECIPES }, (_, index) => {
    const template = recipeTemplates[index % recipeTemplates.length];
    const recipeNumber = String(index + 1).padStart(3, "0");
    const shouldUseUnknownUser = index >= TOTAL_RECIPES - UNKNOWN_USER_RECIPES;
    const userId = shouldUseUnknownUser
      ? String(new Types.ObjectId())
      : userIds[index % userIds.length];

    return {
      userId,
      image: template.image,
      title: `Seed Recipe #${recipeNumber} - ${template.title}`,
      description: template.description,
      ingredients: template.ingredients,
      instructions: template.instructions,
      cookTime: template.cookTime,
      servings: template.servings,
      difficulty: template.difficulty,
      likedBy: [],
    };
  });
};

async function seedRecipes() {
  try {
    console.log("Connecting to Mongo:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI!, {});

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

    await User.bulkWrite(
      seedUsers.map((user) => ({
        updateOne: {
          filter: { email: user.email },
          update: {
            $set: {
              name: user.name,
              username: user.username,
              bio: user.bio,
              location: user.location,
              avatarUrl: "",
              website: "",
            },
            $setOnInsert: {
              email: user.email,
              password: hashedPassword,
            },
          },
          upsert: true,
        },
      }))
    );

    const createdUsers = await User.find({ email: { $in: seedUsers.map((user) => user.email) } })
      .select("_id email name username")
      .lean();

    if (createdUsers.length === 0) {
      throw new Error("Failed to seed users for recipes.");
    }

    const recipesToInsert = buildSeedRecipes(createdUsers.map((user) => String(user._id)));

    await Recipe.deleteMany({ title: /^Seed Recipe #\d{3} - / });
    await Recipe.insertMany(recipesToInsert);

    console.log(`Seeded ${createdUsers.length} users.`);
    createdUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.name} / ${user.username})`);
    });
    console.log(`Seeded ${TOTAL_RECIPES} recipes.`);
    console.log(`Recipes mapped to seeded users: ${TOTAL_RECIPES - UNKNOWN_USER_RECIPES}.`);
    console.log(`Recipes with random user IDs (Unknown fallback): ${UNKNOWN_USER_RECIPES}.`);
    process.exit(0);
  } catch (error) {
    console.error("Recipe seed failed:", error);
    process.exit(1);
  }
}

void seedRecipes();
