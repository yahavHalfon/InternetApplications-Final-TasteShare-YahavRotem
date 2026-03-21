import mongoose from "mongoose";
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

const seedRecipes: SeedRecipe[] = [
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

async function seedThreeRecipes() {
  try {
    console.log("Connecting to Mongo:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI!, {});

    const seedUser =
      (await User.findOne({ email: "dummy@tasteshare.local" })) ||
      (await User.findOne());

    if (!seedUser) {
      throw new Error("No user found. Run npm run seed first to create a seed user.");
    }

    await Recipe.bulkWrite(
      seedRecipes.map((recipe) => ({
        updateOne: {
          filter: { userId: seedUser._id, title: recipe.title },
          update: { $set: { ...recipe, userId: seedUser._id, likedBy: [] } },
          upsert: true,
        },
      }))
    );

    console.log(`Seeded ${seedRecipes.length} recipes for user ${seedUser.email}.`);
    process.exit(0);
  } catch (error) {
    console.error("Recipe seed failed:", error);
    process.exit(1);
  }
}

void seedThreeRecipes();
