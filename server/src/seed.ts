import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import dotenv from "dotenv";
import User from "./model/userModel";
import Recipe, { type RecipeDifficulty } from "./model/recipeModel";
import Comment from "./model/commentModel";
import embeddingService from "./services/embeddingService";

const envPath = process.env.ENV_FILE || ".env.dev";
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(`MONGODB_URI is required in ${envPath}`);
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
  // ── Comfort Food ──
  {
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    title: "Classic Beef Stew",
    description: "Hearty slow-cooked beef stew with potatoes, carrots, and rich gravy. The ultimate comfort food for cold rainy days.",
    ingredients: ["500g beef chuck, cubed", "3 potatoes, diced", "2 carrots, sliced", "1 onion, chopped", "2 cups beef broth", "2 tbsp tomato paste", "2 tbsp flour", "Salt and pepper"],
    instructions: ["Brown beef in a large pot.", "Add onion and cook until soft.", "Stir in flour and tomato paste.", "Add broth, potatoes, and carrots.", "Simmer on low for 2 hours until tender."],
    cookTime: "2h 30min",
    servings: 6,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1588566565463-180a5b2090d2?auto=format&fit=crop&w=1200&q=80",
    title: "Creamy Tomato Soup",
    description: "Velvety smooth tomato soup with a hint of basil. Perfect warming bowl for a cozy evening at home.",
    ingredients: ["800g canned tomatoes", "1 onion, diced", "3 garlic cloves", "1 cup heavy cream", "Fresh basil", "2 tbsp olive oil", "Salt and pepper"],
    instructions: ["Saute onion and garlic in olive oil.", "Add canned tomatoes and simmer 20 minutes.", "Blend until smooth.", "Stir in cream and basil.", "Season and serve with crusty bread."],
    cookTime: "35 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?auto=format&fit=crop&w=1200&q=80",
    title: "Mac and Cheese",
    description: "Creamy baked macaroni and cheese with a golden breadcrumb crust. Classic American comfort dish the whole family loves.",
    ingredients: ["400g elbow macaroni", "3 cups shredded cheddar", "2 cups milk", "3 tbsp butter", "3 tbsp flour", "1/2 cup breadcrumbs", "Salt and pepper"],
    instructions: ["Cook macaroni al dente.", "Make a roux with butter and flour.", "Add milk and stir until thick.", "Melt in cheese.", "Combine with pasta, top with breadcrumbs, bake at 190C for 20 min."],
    cookTime: "45 min",
    servings: 6,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80",
    title: "Chicken Pot Pie",
    description: "Flaky golden pastry filled with creamy chicken and vegetable filling. Warm, comforting, and satisfying.",
    ingredients: ["2 chicken breasts, cooked and shredded", "1 cup frozen peas", "2 carrots, diced", "1 cup chicken broth", "1/2 cup heavy cream", "1 sheet puff pastry", "2 tbsp butter", "2 tbsp flour"],
    instructions: ["Make filling: melt butter, add flour, stir in broth and cream.", "Add chicken, peas, and carrots.", "Pour into a baking dish.", "Cover with puff pastry and brush with egg wash.", "Bake at 200C for 25 minutes until golden."],
    cookTime: "50 min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
    title: "Loaded Baked Potato Soup",
    description: "Thick and creamy potato soup topped with bacon, cheese, and sour cream. A hug in a bowl.",
    ingredients: ["4 large potatoes", "4 slices bacon", "1 cup shredded cheddar", "1/2 cup sour cream", "3 cups chicken broth", "1 cup milk", "2 green onions"],
    instructions: ["Bake potatoes until tender, scoop out flesh.", "Cook bacon until crispy, crumble.", "Simmer potato flesh in broth and milk.", "Mash to desired consistency.", "Top with bacon, cheese, sour cream, and green onions."],
    cookTime: "1h 15min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1200&q=80",
    title: "Beef Chili Con Carne",
    description: "Spicy and hearty beef chili with beans and tomatoes. Slow-simmered for deep rich flavor on cold evenings.",
    ingredients: ["500g ground beef", "2 cans kidney beans", "1 can crushed tomatoes", "1 onion, diced", "2 tbsp chili powder", "1 tsp cumin", "1 bell pepper, diced", "Salt"],
    instructions: ["Brown beef and onion.", "Add bell pepper and cook 3 minutes.", "Stir in chili powder and cumin.", "Add tomatoes and beans.", "Simmer for 45 minutes, season to taste."],
    cookTime: "1h",
    servings: 6,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=1200&q=80",
    title: "Chicken Noodle Soup",
    description: "Classic homemade chicken noodle soup with tender vegetables. The go-to remedy for cold days and sick days.",
    ingredients: ["2 chicken breasts", "200g egg noodles", "2 carrots, sliced", "2 celery stalks, sliced", "1 onion, diced", "6 cups chicken broth", "Fresh dill"],
    instructions: ["Simmer chicken in broth until cooked.", "Remove chicken, shred, and set aside.", "Add onion, carrots, and celery to broth.", "Cook 10 minutes, add noodles.", "Return chicken, add dill, and serve hot."],
    cookTime: "40 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    title: "Shepherd's Pie",
    description: "Savory lamb and vegetable filling topped with fluffy mashed potatoes. A British classic for family dinners.",
    ingredients: ["500g ground lamb", "4 potatoes, peeled and cubed", "1 cup frozen peas", "2 carrots, diced", "1 onion, diced", "2 tbsp tomato paste", "1 cup beef broth", "Butter and milk"],
    instructions: ["Cook lamb with onion and carrots.", "Add peas, tomato paste, and broth, simmer 15 min.", "Boil and mash potatoes with butter and milk.", "Spread meat in a dish, top with mash.", "Bake at 200C for 20 minutes until golden."],
    cookTime: "1h",
    servings: 6,
    difficulty: "Medium",
  },

  // ── Quick Meals (under 20 min) ──
  {
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80",
    title: "15-Minute Garlic Shrimp Stir Fry",
    description: "Quick and flavorful shrimp tossed with garlic, soy sauce, and vegetables. Ready in just 15 minutes.",
    ingredients: ["300g shrimp, peeled", "3 garlic cloves, minced", "1 bell pepper, sliced", "1 cup snap peas", "2 tbsp soy sauce", "1 tbsp sesame oil", "Cooked rice"],
    instructions: ["Heat sesame oil in a wok.", "Cook shrimp 2 minutes per side, set aside.", "Stir fry garlic, bell pepper, and snap peas.", "Return shrimp, add soy sauce.", "Serve over rice."],
    cookTime: "15 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
    title: "Quick Chicken Caesar Wrap",
    description: "Grilled chicken strips with crisp romaine, parmesan, and Caesar dressing in a tortilla. Lunch in 10 minutes.",
    ingredients: ["2 large tortillas", "1 grilled chicken breast, sliced", "2 cups romaine lettuce", "1/4 cup parmesan shavings", "3 tbsp Caesar dressing"],
    instructions: ["Warm tortillas briefly.", "Layer lettuce, chicken, and parmesan.", "Drizzle with Caesar dressing.", "Roll tightly and cut in half.", "Serve immediately."],
    cookTime: "10 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
    title: "Avocado Toast with Egg",
    description: "Smashed avocado on sourdough topped with a fried egg and chili flakes. Quick, nutritious breakfast or snack.",
    ingredients: ["2 slices sourdough bread", "1 ripe avocado", "2 eggs", "Chili flakes", "Salt and pepper", "1 tbsp olive oil"],
    instructions: ["Toast the bread.", "Mash avocado with salt and pepper.", "Fry eggs in olive oil.", "Spread avocado on toast, top with egg.", "Sprinkle chili flakes and serve."],
    cookTime: "10 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80",
    title: "Caprese Panini",
    description: "Warm pressed sandwich with fresh mozzarella, tomato, basil, and balsamic glaze. Italian lunch in minutes.",
    ingredients: ["2 ciabatta rolls", "150g fresh mozzarella", "2 tomatoes, sliced", "Fresh basil leaves", "Balsamic glaze", "Olive oil"],
    instructions: ["Slice ciabatta and drizzle with olive oil.", "Layer mozzarella, tomato, and basil.", "Press in a panini grill for 3-4 minutes.", "Drizzle with balsamic glaze.", "Serve warm."],
    cookTime: "10 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    title: "5-Minute Smoothie Bowl",
    description: "Thick blended acai and banana bowl topped with granola, berries, and coconut. Energizing quick breakfast.",
    ingredients: ["2 frozen acai packs", "1 banana", "1/2 cup almond milk", "Granola", "Fresh berries", "Shredded coconut", "Honey"],
    instructions: ["Blend acai, banana, and almond milk until thick.", "Pour into a bowl.", "Top with granola, berries, and coconut.", "Drizzle with honey.", "Serve immediately."],
    cookTime: "5 min",
    servings: 1,
    difficulty: "Easy",
  },

  // ── Italian ──
  {
    image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80",
    title: "Spaghetti Carbonara",
    description: "Classic Roman pasta with crispy guanciale, egg yolks, pecorino, and black pepper. Simple and elegant.",
    ingredients: ["400g spaghetti", "150g guanciale or pancetta", "4 egg yolks", "1 cup grated pecorino romano", "Black pepper"],
    instructions: ["Cook spaghetti al dente.", "Crisp guanciale in a pan.", "Whisk egg yolks with pecorino and pepper.", "Toss hot pasta with guanciale.", "Add egg mixture off heat, toss quickly until creamy."],
    cookTime: "25 min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    title: "Margherita Pizza",
    description: "Classic Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella, and basil on crispy thin crust.",
    ingredients: ["Pizza dough", "200g San Marzano tomatoes", "200g fresh mozzarella", "Fresh basil", "2 tbsp olive oil", "Salt"],
    instructions: ["Stretch dough into a circle.", "Spread crushed tomatoes.", "Tear mozzarella over top.", "Bake at 250C for 8-10 minutes.", "Top with fresh basil and olive oil."],
    cookTime: "20 min",
    servings: 2,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=1200&q=80",
    title: "Penne Arrabbiata",
    description: "Spicy Italian pasta in a fiery tomato sauce with garlic and red chili flakes. Bold and simple.",
    ingredients: ["400g penne", "800g crushed tomatoes", "4 garlic cloves, sliced", "1 tsp red chili flakes", "3 tbsp olive oil", "Fresh parsley", "Salt"],
    instructions: ["Cook penne al dente.", "Saute garlic and chili in olive oil.", "Add tomatoes and simmer 15 minutes.", "Toss pasta in sauce.", "Garnish with parsley and serve."],
    cookTime: "25 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80",
    title: "Eggplant Parmigiana",
    description: "Layers of breaded eggplant, marinara sauce, and melted mozzarella baked until bubbly. Italian vegetarian classic.",
    ingredients: ["2 large eggplants, sliced", "2 cups marinara sauce", "2 cups shredded mozzarella", "1 cup breadcrumbs", "2 eggs, beaten", "1/2 cup parmesan", "Olive oil"],
    instructions: ["Bread eggplant slices in egg then breadcrumbs.", "Fry until golden on each side.", "Layer eggplant, marinara, and mozzarella in a dish.", "Repeat layers and top with parmesan.", "Bake at 190C for 25 minutes."],
    cookTime: "1h",
    servings: 6,
    difficulty: "Medium",
  },

  // ── Asian ──
  {
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80",
    title: "Pad Thai",
    description: "Sweet, sour, and savory Thai rice noodles with shrimp, peanuts, bean sprouts, and tamarind sauce.",
    ingredients: ["200g rice noodles", "200g shrimp", "2 eggs", "1 cup bean sprouts", "3 tbsp tamarind paste", "2 tbsp fish sauce", "2 tbsp sugar", "Crushed peanuts", "Lime wedges"],
    instructions: ["Soak noodles in warm water until soft.", "Scramble eggs in a wok, set aside.", "Cook shrimp, add noodles.", "Mix tamarind, fish sauce, and sugar; pour over noodles.", "Toss with eggs, sprouts, peanuts, and serve with lime."],
    cookTime: "30 min",
    servings: 2,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1200&q=80",
    title: "Thai Green Curry",
    description: "Fragrant coconut curry with chicken, Thai basil, and vegetables. Aromatic and mildly spicy Thai dinner.",
    ingredients: ["2 chicken breasts, sliced", "1 can coconut milk", "3 tbsp green curry paste", "1 zucchini, sliced", "1 bell pepper, sliced", "Thai basil leaves", "Fish sauce", "Jasmine rice"],
    instructions: ["Fry curry paste in oil for 1 minute.", "Add coconut milk and bring to a simmer.", "Add chicken and vegetables.", "Cook 15 minutes until chicken is done.", "Season with fish sauce, top with basil, serve with rice."],
    cookTime: "30 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
    title: "Japanese Chicken Katsu",
    description: "Crispy panko-breaded chicken cutlet served with tonkatsu sauce, shredded cabbage, and steamed rice.",
    ingredients: ["2 chicken breasts, pounded thin", "1 cup panko breadcrumbs", "1/2 cup flour", "2 eggs, beaten", "Tonkatsu sauce", "Shredded cabbage", "Oil for frying"],
    instructions: ["Coat chicken in flour, egg, then panko.", "Fry in oil at 170C for 4-5 minutes per side.", "Drain on paper towels.", "Slice into strips.", "Serve with cabbage, rice, and tonkatsu sauce."],
    cookTime: "25 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1200&q=80",
    title: "Vegetable Fried Rice",
    description: "Quick wok-tossed rice with mixed vegetables, soy sauce, and scrambled egg. Great way to use leftover rice.",
    ingredients: ["3 cups cooked rice (day-old)", "2 eggs", "1 cup mixed vegetables", "3 tbsp soy sauce", "1 tbsp sesame oil", "2 green onions, sliced", "1 garlic clove, minced"],
    instructions: ["Heat sesame oil in a wok on high.", "Scramble eggs, set aside.", "Stir fry garlic and vegetables.", "Add rice, break up clumps.", "Add soy sauce, eggs, and green onions. Toss and serve."],
    cookTime: "15 min",
    servings: 3,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80",
    title: "Miso Ramen",
    description: "Rich and umami miso broth with ramen noodles, soft-boiled egg, chashu pork, and nori. Japanese soul food.",
    ingredients: ["200g ramen noodles", "4 cups dashi broth", "3 tbsp white miso paste", "2 soft-boiled eggs", "Sliced chashu pork", "Nori sheets", "Green onions", "Corn kernels"],
    instructions: ["Heat broth and whisk in miso paste.", "Cook ramen noodles separately.", "Divide noodles into bowls, ladle broth.", "Top with egg halves, chashu, nori, corn.", "Garnish with green onions and serve."],
    cookTime: "35 min",
    servings: 2,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?auto=format&fit=crop&w=1200&q=80",
    title: "Korean Bibimbap",
    description: "Colorful Korean rice bowl with seasoned vegetables, beef, a fried egg, and gochujang sauce.",
    ingredients: ["2 cups cooked rice", "200g beef bulgogi", "1 carrot, julienned", "1 zucchini, julienned", "1 cup spinach", "2 fried eggs", "Gochujang sauce", "Sesame oil"],
    instructions: ["Saute each vegetable separately with sesame oil.", "Cook beef bulgogi.", "Arrange rice in bowls.", "Top with vegetables, beef, and fried egg.", "Drizzle gochujang and mix before eating."],
    cookTime: "40 min",
    servings: 2,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80",
    title: "Sushi Rolls",
    description: "Homemade maki rolls with fresh salmon, avocado, and cucumber wrapped in seasoned rice and nori.",
    ingredients: ["2 cups sushi rice", "4 nori sheets", "200g fresh salmon", "1 avocado, sliced", "1 cucumber, julienned", "Rice vinegar", "Soy sauce", "Wasabi"],
    instructions: ["Cook and season rice with vinegar.", "Place nori on a bamboo mat, spread rice.", "Layer salmon, avocado, and cucumber.", "Roll tightly using the mat.", "Slice with a wet knife and serve with soy and wasabi."],
    cookTime: "45 min",
    servings: 4,
    difficulty: "Advanced",
  },

  // ── Mexican / Latin ──
  {
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    title: "Chicken Tacos",
    description: "Seasoned grilled chicken in warm corn tortillas with salsa, avocado, and cilantro. Quick Mexican dinner.",
    ingredients: ["2 chicken breasts", "8 small corn tortillas", "1 avocado, diced", "1/2 cup salsa", "Fresh cilantro", "1 lime", "Taco seasoning"],
    instructions: ["Season chicken with taco seasoning.", "Grill 6-7 minutes per side.", "Slice chicken into strips.", "Warm tortillas.", "Assemble with chicken, avocado, salsa, cilantro, and lime."],
    cookTime: "20 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=1200&q=80",
    title: "Black Bean Burrito Bowl",
    description: "Hearty Mexican-inspired bowl with black beans, cilantro lime rice, corn, and avocado crema.",
    ingredients: ["1 can black beans", "2 cups cooked rice", "1 cup corn kernels", "1 avocado", "1/2 cup sour cream", "Lime juice", "Fresh cilantro", "Cumin"],
    instructions: ["Season beans with cumin and warm.", "Mix rice with lime juice and cilantro.", "Blend avocado with sour cream for crema.", "Assemble bowls with rice, beans, and corn.", "Top with avocado crema."],
    cookTime: "20 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=1200&q=80",
    title: "Beef Enchiladas",
    description: "Corn tortillas stuffed with seasoned beef and cheese, smothered in enchilada sauce and baked.",
    ingredients: ["500g ground beef", "8 corn tortillas", "2 cups enchilada sauce", "2 cups shredded Mexican cheese", "1 onion, diced", "1 tsp cumin", "Sour cream"],
    instructions: ["Cook beef with onion and cumin.", "Fill tortillas with beef and cheese.", "Roll and place in a baking dish.", "Pour enchilada sauce and sprinkle remaining cheese.", "Bake at 190C for 20 minutes."],
    cookTime: "45 min",
    servings: 4,
    difficulty: "Easy",
  },

  // ── Indian ──
  {
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=80",
    title: "Butter Chicken",
    description: "Tender chicken in a creamy, mildly spiced tomato sauce. One of India's most beloved dishes worldwide.",
    ingredients: ["500g chicken thighs, cubed", "1 cup tomato puree", "1/2 cup heavy cream", "2 tbsp butter", "1 tbsp garam masala", "1 tsp turmeric", "1 onion, diced", "Garlic and ginger paste", "Basmati rice"],
    instructions: ["Marinate chicken with turmeric and garam masala.", "Saute onion, garlic, and ginger in butter.", "Add tomato puree and simmer 10 minutes.", "Add chicken and cook through.", "Stir in cream and serve with basmati rice."],
    cookTime: "40 min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80",
    title: "Chana Masala",
    description: "Spiced chickpea curry in a tangy tomato sauce. A protein-packed vegetarian Indian staple.",
    ingredients: ["2 cans chickpeas", "1 can crushed tomatoes", "1 onion, diced", "2 tsp garam masala", "1 tsp cumin", "1 tsp turmeric", "Fresh cilantro", "Naan bread"],
    instructions: ["Saute onion until golden.", "Add spices and cook 1 minute.", "Add tomatoes and chickpeas.", "Simmer 20 minutes until thick.", "Top with cilantro and serve with naan."],
    cookTime: "35 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80",
    title: "Palak Paneer",
    description: "Cubes of soft paneer cheese in a creamy pureed spinach sauce. Classic Indian vegetarian dinner.",
    ingredients: ["250g paneer, cubed", "500g fresh spinach", "1 onion, diced", "2 garlic cloves", "1 tsp garam masala", "1/2 cup cream", "1 tbsp ghee"],
    instructions: ["Blanch spinach and blend into a puree.", "Fry paneer cubes in ghee until golden.", "Saute onion and garlic.", "Add spinach puree and garam masala.", "Stir in cream and paneer, simmer 5 minutes."],
    cookTime: "30 min",
    servings: 3,
    difficulty: "Easy",
  },

  // ── Middle Eastern ──
  {
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
    title: "Falafel Pita Wraps",
    description: "Crispy homemade falafel in warm pita with tahini, pickles, and fresh salad. Popular Middle Eastern street food.",
    ingredients: ["2 cans chickpeas", "1 onion", "3 garlic cloves", "Fresh parsley and cilantro", "1 tsp cumin", "Pita bread", "Tahini sauce", "Tomatoes and cucumbers"],
    instructions: ["Blend chickpeas, onion, garlic, herbs, and cumin.", "Form into small patties.", "Fry in oil until golden brown.", "Warm pita bread.", "Fill with falafel, veggies, and tahini."],
    cookTime: "35 min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=1200&q=80",
    title: "Shakshuka",
    description: "Eggs poached in a spiced tomato and pepper sauce. A beloved Middle Eastern breakfast dish.",
    ingredients: ["6 eggs", "800g crushed tomatoes", "2 bell peppers, diced", "1 onion, diced", "3 garlic cloves", "2 tsp cumin", "1 tsp paprika", "Fresh cilantro", "Crusty bread"],
    instructions: ["Saute onion, peppers, and garlic.", "Add tomatoes, cumin, and paprika, simmer 15 min.", "Make wells and crack eggs into sauce.", "Cover and cook until eggs are set.", "Top with cilantro, serve with bread."],
    cookTime: "30 min",
    servings: 3,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=1200&q=80",
    title: "Lamb Shawarma",
    description: "Spiced slow-roasted lamb sliced thin and served with garlic sauce, pickled turnips, and flatbread.",
    ingredients: ["1kg lamb shoulder", "2 tsp cumin", "2 tsp paprika", "1 tsp turmeric", "1 tsp cinnamon", "4 garlic cloves", "Flatbread", "Garlic sauce", "Pickled turnips"],
    instructions: ["Mix spices with garlic and rub onto lamb.", "Roast at 160C for 3 hours until tender.", "Slice thinly.", "Warm flatbread.", "Assemble with garlic sauce and pickled turnips."],
    cookTime: "3h 15min",
    servings: 6,
    difficulty: "Medium",
  },

  // ── Vegan ──
  {
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    title: "Vegan Buddha Bowl",
    description: "Colorful bowl of roasted sweet potato, quinoa, avocado, chickpeas, and tahini dressing. Nutritious plant-based meal.",
    ingredients: ["1 sweet potato, cubed", "1 cup quinoa", "1 can chickpeas", "1 avocado", "2 cups kale", "3 tbsp tahini", "Lemon juice", "Olive oil"],
    instructions: ["Roast sweet potato and chickpeas at 200C for 25 min.", "Cook quinoa.", "Massage kale with olive oil.", "Assemble bowls with all components.", "Drizzle with tahini and lemon dressing."],
    cookTime: "35 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    title: "Vegan Mushroom Stroganoff",
    description: "Creamy mushroom sauce over pasta made with cashew cream. Rich comfort food, entirely plant-based.",
    ingredients: ["400g mushrooms, sliced", "300g pasta", "1 cup raw cashews, soaked", "1 onion, diced", "3 garlic cloves", "1 cup vegetable broth", "2 tbsp soy sauce", "Fresh thyme"],
    instructions: ["Blend soaked cashews with broth for cream.", "Saute onion, garlic, and mushrooms.", "Add soy sauce and thyme.", "Pour in cashew cream and simmer 10 min.", "Toss with cooked pasta and serve."],
    cookTime: "30 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80",
    title: "Vegan Black Bean Tacos",
    description: "Spiced black beans with mango salsa and avocado on corn tortillas. Fresh, colorful, plant-based Mexican dinner.",
    ingredients: ["2 cans black beans", "8 corn tortillas", "1 mango, diced", "1 avocado, sliced", "1/2 red onion, diced", "Fresh cilantro", "Lime juice", "Cumin and chili powder"],
    instructions: ["Season beans with cumin and chili, heat.", "Mix mango, onion, cilantro, and lime for salsa.", "Warm tortillas.", "Fill with beans, mango salsa, and avocado.", "Squeeze lime on top and serve."],
    cookTime: "15 min",
    servings: 4,
    difficulty: "Easy",
  },

  // ── Gluten-Free ──
  {
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
    title: "Grilled Salmon with Asparagus",
    description: "Perfectly grilled salmon fillet with roasted asparagus and lemon. Gluten-free, high-protein, and elegant.",
    ingredients: ["2 salmon fillets", "1 bunch asparagus", "2 tbsp olive oil", "1 lemon", "2 garlic cloves, minced", "Salt and pepper"],
    instructions: ["Season salmon with garlic, lemon, salt, and pepper.", "Toss asparagus with olive oil.", "Grill salmon 4 minutes per side.", "Roast asparagus at 200C for 12 minutes.", "Serve together with lemon wedges."],
    cookTime: "20 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    title: "Cauliflower Rice Stir Fry",
    description: "Low-carb cauliflower rice with colorful vegetables and soy sauce. Gluten-free and keto-friendly.",
    ingredients: ["1 cauliflower head, riced", "1 cup broccoli florets", "1 carrot, diced", "2 eggs", "3 tbsp tamari (gluten-free soy sauce)", "1 tbsp sesame oil", "Green onions"],
    instructions: ["Heat sesame oil in a wok.", "Scramble eggs, set aside.", "Stir fry broccoli and carrot.", "Add cauliflower rice and cook 5 minutes.", "Add tamari, eggs, and green onions. Serve."],
    cookTime: "15 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    title: "Stuffed Bell Peppers",
    description: "Bell peppers filled with seasoned ground turkey, rice, and cheese. Naturally gluten-free family dinner.",
    ingredients: ["4 bell peppers", "500g ground turkey", "1 cup cooked rice", "1 cup shredded cheese", "1 can diced tomatoes", "1 tsp oregano", "Salt and pepper"],
    instructions: ["Cut tops off peppers and remove seeds.", "Brown turkey, mix with rice, tomatoes, and oregano.", "Stuff peppers with filling.", "Top with cheese.", "Bake at 190C for 30 minutes."],
    cookTime: "50 min",
    servings: 4,
    difficulty: "Easy",
  },

  // ── High Protein / Meal Prep ──
  {
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=80",
    title: "Greek Chicken Meal Prep",
    description: "Herb-marinated chicken with lemon, served over couscous with cucumber salad. Perfect for weekly meal prep.",
    ingredients: ["4 chicken breasts", "2 cups couscous", "1 cucumber, diced", "1 cup cherry tomatoes", "1/4 cup feta cheese", "Oregano, lemon juice, olive oil", "Salt and pepper"],
    instructions: ["Marinate chicken in lemon, oregano, and oil.", "Grill chicken 6 min per side.", "Cook couscous per package directions.", "Mix cucumber, tomatoes, and feta.", "Divide into containers with chicken, couscous, and salad."],
    cookTime: "30 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=1200&q=80",
    title: "Protein Pancakes",
    description: "Fluffy pancakes packed with protein from eggs and protein powder. Healthy high-protein breakfast.",
    ingredients: ["1 cup oat flour", "1 scoop protein powder", "2 eggs", "1/2 cup milk", "1 banana, mashed", "1 tsp baking powder", "Maple syrup and berries"],
    instructions: ["Mix oat flour, protein powder, and baking powder.", "Whisk eggs, milk, and banana, combine with dry.", "Cook pancakes on a nonstick pan.", "Flip when bubbles form.", "Serve with berries and maple syrup."],
    cookTime: "15 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
    title: "Tuna Poke Bowl",
    description: "Fresh ahi tuna cubes marinated in soy and sesame over sushi rice with edamame and avocado. High-protein light meal.",
    ingredients: ["300g sushi-grade tuna", "2 cups sushi rice", "1 avocado", "1/2 cup edamame", "3 tbsp soy sauce", "1 tbsp sesame oil", "Sesame seeds", "Green onions"],
    instructions: ["Cook sushi rice and cool slightly.", "Cube tuna and marinate in soy and sesame oil.", "Divide rice into bowls.", "Top with tuna, avocado, and edamame.", "Garnish with sesame seeds and green onions."],
    cookTime: "25 min",
    servings: 2,
    difficulty: "Easy",
  },

  // ── Desserts ──
  {
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    title: "Chocolate Lava Cake",
    description: "Rich individual chocolate cakes with a molten center. Elegant dessert that impresses every time.",
    ingredients: ["200g dark chocolate", "100g butter", "3 eggs", "1/2 cup sugar", "1/4 cup flour", "Powdered sugar for dusting"],
    instructions: ["Melt chocolate and butter together.", "Whisk eggs and sugar until fluffy.", "Fold in chocolate mixture and flour.", "Pour into greased ramekins.", "Bake at 220C for 12 minutes. Invert and serve."],
    cookTime: "25 min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    title: "Classic Tiramisu",
    description: "Layers of espresso-soaked ladyfingers and mascarpone cream. The iconic Italian no-bake dessert.",
    ingredients: ["250g mascarpone", "3 eggs, separated", "1/2 cup sugar", "1 cup strong espresso, cooled", "200g ladyfingers", "Cocoa powder"],
    instructions: ["Beat yolks with sugar until thick.", "Fold in mascarpone.", "Whip egg whites and fold into mixture.", "Dip ladyfingers in espresso, layer in dish.", "Alternate with cream layers. Chill 4 hours, dust with cocoa."],
    cookTime: "30 min",
    servings: 6,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1200&q=80",
    title: "Apple Crumble",
    description: "Warm spiced apples topped with a buttery oat crumble. Cozy autumn dessert best served with vanilla ice cream.",
    ingredients: ["6 apples, peeled and sliced", "1 cup oats", "1/2 cup flour", "1/2 cup brown sugar", "1/3 cup cold butter", "1 tsp cinnamon", "Vanilla ice cream"],
    instructions: ["Toss apples with cinnamon and a bit of sugar.", "Spread in a baking dish.", "Mix oats, flour, brown sugar, and butter into crumbles.", "Scatter over apples.", "Bake at 180C for 35 minutes until golden. Serve with ice cream."],
    cookTime: "45 min",
    servings: 6,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    title: "Gluten-Free Brownies",
    description: "Fudgy and rich chocolate brownies made with almond flour. Gluten-free decadence for a party.",
    ingredients: ["1 cup almond flour", "1/2 cup cocoa powder", "3/4 cup sugar", "1/3 cup melted coconut oil", "2 eggs", "1 tsp vanilla extract", "1/2 cup chocolate chips"],
    instructions: ["Mix almond flour, cocoa, and sugar.", "Stir in coconut oil, eggs, and vanilla.", "Fold in chocolate chips.", "Pour into a lined 8x8 pan.", "Bake at 175C for 22-25 minutes. Cool before slicing."],
    cookTime: "35 min",
    servings: 9,
    difficulty: "Easy",
  },

  // ── Breakfast ──
  {
    image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80",
    title: "Fluffy Blueberry Pancakes",
    description: "Light and fluffy buttermilk pancakes studded with fresh blueberries. Classic weekend breakfast treat.",
    ingredients: ["1.5 cups flour", "1 cup buttermilk", "1 egg", "2 tbsp sugar", "1 tsp baking powder", "1/2 tsp baking soda", "1 cup blueberries", "Butter and maple syrup"],
    instructions: ["Mix dry ingredients.", "Whisk buttermilk and egg, combine with dry.", "Fold in blueberries.", "Cook on a buttered griddle until golden.", "Serve with butter and maple syrup."],
    cookTime: "20 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
    title: "Overnight Oats",
    description: "No-cook oats soaked overnight in milk with chia seeds and honey. Grab-and-go healthy breakfast.",
    ingredients: ["1 cup rolled oats", "1 cup milk", "2 tbsp chia seeds", "1 tbsp honey", "1/2 cup yogurt", "Fresh berries", "Sliced almonds"],
    instructions: ["Mix oats, milk, chia seeds, honey, and yogurt.", "Pour into jars.", "Refrigerate overnight.", "Top with berries and almonds in the morning.", "Enjoy cold."],
    cookTime: "5 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80",
    title: "Veggie Omelette",
    description: "Fluffy three-egg omelette filled with sauteed mushrooms, peppers, and goat cheese. Quick protein breakfast.",
    ingredients: ["3 eggs", "1/4 cup mushrooms, sliced", "1/4 bell pepper, diced", "2 tbsp goat cheese", "Fresh chives", "1 tbsp butter", "Salt and pepper"],
    instructions: ["Beat eggs with salt and pepper.", "Saute mushrooms and pepper in butter.", "Pour eggs over vegetables.", "Cook until nearly set.", "Add goat cheese, fold, and serve with chives."],
    cookTime: "10 min",
    servings: 1,
    difficulty: "Easy",
  },

  // ── Salads (Summer / Light) ──
  {
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
    title: "Watermelon Feta Summer Salad",
    description: "Refreshing summer salad with juicy watermelon, salty feta, mint, and balsamic glaze. Light and vibrant.",
    ingredients: ["4 cups watermelon, cubed", "150g feta cheese, crumbled", "Fresh mint leaves", "Balsamic glaze", "Olive oil", "Black pepper"],
    instructions: ["Arrange watermelon on a plate.", "Scatter feta and mint.", "Drizzle with balsamic glaze and olive oil.", "Crack black pepper on top.", "Serve chilled."],
    cookTime: "10 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    title: "Mediterranean Quinoa Salad",
    description: "Bright protein-rich salad with quinoa, cucumbers, cherry tomatoes, chickpeas, and a lemon tahini drizzle.",
    ingredients: ["1 cup quinoa", "1 cup cherry tomatoes, halved", "1 cucumber, diced", "1 cup cooked chickpeas", "3 tbsp tahini", "1 tbsp lemon juice", "Fresh parsley"],
    instructions: ["Cook quinoa and cool.", "Whisk tahini with lemon juice and water.", "Combine quinoa, tomatoes, cucumber, and chickpeas.", "Toss with dressing.", "Top with parsley and serve."],
    cookTime: "25 min",
    servings: 3,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=1200&q=80",
    title: "Thai Mango Salad",
    description: "Crunchy green mango strips with peanuts, chili, lime, and fish sauce. Tangy and refreshing Thai street salad.",
    ingredients: ["2 green mangoes, julienned", "1/4 cup roasted peanuts", "1 red chili, sliced", "2 tbsp fish sauce", "2 tbsp lime juice", "1 tbsp sugar", "Fresh cilantro"],
    instructions: ["Toss mango with chili and peanuts.", "Whisk fish sauce, lime juice, and sugar.", "Pour dressing over salad.", "Garnish with cilantro.", "Serve immediately."],
    cookTime: "10 min",
    servings: 2,
    difficulty: "Easy",
  },

  // ── BBQ / Grilling ──
  {
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    title: "BBQ Pulled Pork Sandwich",
    description: "Slow-smoked pulled pork in tangy BBQ sauce on a brioche bun with coleslaw. Summer barbecue essential.",
    ingredients: ["1.5kg pork shoulder", "1 cup BBQ sauce", "4 brioche buns", "2 cups coleslaw mix", "2 tbsp apple cider vinegar", "Smoked paprika", "Brown sugar"],
    instructions: ["Rub pork with paprika and brown sugar.", "Slow cook at 130C for 6 hours.", "Shred meat and mix with BBQ sauce.", "Toast brioche buns.", "Pile pork on buns, top with coleslaw."],
    cookTime: "6h 30min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=80",
    title: "Grilled Lamb Chops",
    description: "Herb-crusted lamb chops grilled to perfection. Elegant yet simple main course for outdoor dining.",
    ingredients: ["8 lamb chops", "3 tbsp olive oil", "4 garlic cloves, minced", "2 tbsp fresh rosemary, chopped", "1 tbsp fresh thyme", "Salt and pepper", "Lemon wedges"],
    instructions: ["Mix olive oil, garlic, rosemary, and thyme.", "Coat lamb chops and marinate 30 minutes.", "Grill on high heat 3-4 minutes per side.", "Rest for 5 minutes.", "Serve with lemon wedges."],
    cookTime: "45 min",
    servings: 4,
    difficulty: "Medium",
  },

  // ── Snacks / Appetizers ──
  {
    image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=1200&q=80",
    title: "Crispy Spring Rolls",
    description: "Golden fried spring rolls filled with vegetables and glass noodles. Popular Asian appetizer or snack.",
    ingredients: ["20 spring roll wrappers", "200g glass noodles", "2 cups shredded cabbage", "1 carrot, julienned", "2 tbsp soy sauce", "1 tsp sesame oil", "Oil for frying", "Sweet chili sauce"],
    instructions: ["Soak noodles and chop.", "Mix noodles, cabbage, carrot, soy, and sesame oil.", "Place filling on wrappers and roll tightly.", "Fry at 170C until golden.", "Serve with sweet chili sauce."],
    cookTime: "35 min",
    servings: 6,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7?auto=format&fit=crop&w=1200&q=80",
    title: "Hummus with Pita Chips",
    description: "Smooth creamy hummus with crispy homemade pita chips. Easy appetizer or healthy snack for any occasion.",
    ingredients: ["2 cans chickpeas", "3 tbsp tahini", "2 garlic cloves", "3 tbsp lemon juice", "3 tbsp olive oil", "4 pita breads", "Paprika", "Salt"],
    instructions: ["Blend chickpeas, tahini, garlic, lemon, and olive oil until smooth.", "Season with salt.", "Cut pita into triangles, brush with oil.", "Bake pita chips at 190C for 8 minutes.", "Serve hummus drizzled with oil and paprika."],
    cookTime: "20 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?auto=format&fit=crop&w=1200&q=80",
    title: "Bruschetta",
    description: "Toasted bread topped with fresh tomatoes, garlic, basil, and olive oil. Simple Italian appetizer bursting with flavor.",
    ingredients: ["1 baguette, sliced", "4 tomatoes, diced", "2 garlic cloves, minced", "Fresh basil, chopped", "3 tbsp olive oil", "1 tbsp balsamic vinegar", "Salt"],
    instructions: ["Toast bread slices.", "Mix tomatoes, garlic, basil, oil, and vinegar.", "Season with salt.", "Spoon mixture onto toasts.", "Serve immediately."],
    cookTime: "15 min",
    servings: 4,
    difficulty: "Easy",
  },

  // ── One-Pot / Easy Weeknight ──
  {
    image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80",
    title: "One-Pan Lemon Herb Chicken",
    description: "Juicy chicken thighs roasted with garlic, lemon, and fresh herbs for a fast and comforting weeknight dinner.",
    ingredients: ["4 chicken thighs", "2 tbsp olive oil", "3 garlic cloves, minced", "1 lemon, sliced", "1 tsp dried oregano", "Salt and black pepper"],
    instructions: ["Preheat oven to 200C.", "Season chicken with oil, garlic, oregano, salt, and pepper.", "Arrange in a baking dish with lemon slices.", "Bake for 30-35 minutes until golden.", "Rest for 5 minutes and serve."],
    cookTime: "40 min",
    servings: 4,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    title: "Slow-Simmered Mushroom Risotto",
    description: "Creamy arborio rice cooked gradually with mushrooms, stock, and parmesan for rich restaurant-style flavor.",
    ingredients: ["1 cup arborio rice", "4 cups vegetable stock", "250g mushrooms, sliced", "1 small onion, diced", "2 tbsp butter", "1/3 cup grated parmesan", "2 tbsp olive oil"],
    instructions: ["Saute onion and mushrooms in olive oil and butter.", "Add rice and stir for 1 minute.", "Add stock gradually, stirring until absorbed.", "Continue until rice is creamy and al dente.", "Fold in parmesan and serve."],
    cookTime: "45 min",
    servings: 4,
    difficulty: "Medium",
  },
  {
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    title: "Lentil Soup",
    description: "Hearty and nourishing red lentil soup with cumin and lemon. Budget-friendly, vegan, and great for meal prep.",
    ingredients: ["2 cups red lentils", "1 onion, diced", "2 carrots, diced", "3 garlic cloves", "1 tsp cumin", "6 cups vegetable broth", "Lemon juice", "Olive oil"],
    instructions: ["Saute onion, carrots, and garlic in olive oil.", "Add cumin and stir 30 seconds.", "Add lentils and broth.", "Simmer 25 minutes until lentils are soft.", "Blend partially, add lemon juice, and serve."],
    cookTime: "35 min",
    servings: 6,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
    title: "Creamy Tuscan Chicken",
    description: "Pan-seared chicken in a sun-dried tomato and spinach cream sauce. Restaurant quality in 25 minutes.",
    ingredients: ["4 chicken breasts", "1 cup sun-dried tomatoes", "3 cups fresh spinach", "1 cup heavy cream", "3 garlic cloves", "1/2 cup parmesan", "Olive oil"],
    instructions: ["Sear chicken in olive oil, 5 min per side. Set aside.", "Saute garlic and sun-dried tomatoes.", "Add cream and parmesan, stir until melted.", "Add spinach and wilt.", "Return chicken to pan and simmer 5 minutes."],
    cookTime: "25 min",
    servings: 4,
    difficulty: "Easy",
  },

  // ── Seafood ──
  {
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80",
    title: "Garlic Butter Shrimp Pasta",
    description: "Succulent shrimp in garlic butter sauce tossed with linguine and white wine. Quick elegant seafood dinner.",
    ingredients: ["300g linguine", "300g large shrimp", "4 garlic cloves, minced", "3 tbsp butter", "1/4 cup white wine", "Red pepper flakes", "Fresh parsley", "Lemon juice"],
    instructions: ["Cook linguine al dente.", "Melt butter, saute garlic.", "Add shrimp and cook 2 minutes per side.", "Deglaze with wine, add lemon and pepper flakes.", "Toss with pasta and parsley."],
    cookTime: "20 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80",
    title: "Fish Tacos with Lime Crema",
    description: "Crispy battered white fish in warm tortillas with crunchy slaw and tangy lime crema. Baja-style street food.",
    ingredients: ["400g white fish fillets", "8 corn tortillas", "1 cup shredded cabbage", "1/2 cup sour cream", "1 lime", "1 cup flour", "1 tsp paprika", "Oil for frying"],
    instructions: ["Coat fish in seasoned flour and fry until golden.", "Mix sour cream with lime juice for crema.", "Warm tortillas.", "Fill with fish and cabbage slaw.", "Drizzle crema and squeeze lime."],
    cookTime: "25 min",
    servings: 4,
    difficulty: "Medium",
  },

  // ── Holiday / Special ──
  {
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=1200&q=80",
    title: "Roast Turkey with Gravy",
    description: "Herb-rubbed whole roasted turkey with pan gravy. The centerpiece for Thanksgiving and holiday celebrations.",
    ingredients: ["1 whole turkey (5kg)", "4 tbsp butter, softened", "Fresh sage, rosemary, thyme", "2 onions, quartered", "4 celery stalks", "2 cups chicken broth", "3 tbsp flour"],
    instructions: ["Rub turkey with herb butter, stuff cavity with onion and celery.", "Roast at 170C for 3-4 hours, basting.", "Rest 30 minutes before carving.", "Make gravy from pan drippings with flour and broth.", "Serve turkey with gravy."],
    cookTime: "4h",
    servings: 10,
    difficulty: "Advanced",
  },
  {
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80",
    title: "Christmas Gingerbread Cookies",
    description: "Spiced gingerbread cookies decorated with royal icing. Fun holiday baking project for the whole family.",
    ingredients: ["3 cups flour", "1 tsp baking soda", "2 tsp ground ginger", "1 tsp cinnamon", "1/2 tsp cloves", "3/4 cup butter", "3/4 cup brown sugar", "1 egg", "1/3 cup molasses"],
    instructions: ["Mix flour, baking soda, and spices.", "Cream butter and sugar, add egg and molasses.", "Combine wet and dry ingredients.", "Roll, cut shapes, bake at 175C for 10-12 minutes.", "Decorate with royal icing when cool."],
    cookTime: "1h 30min",
    servings: 24,
    difficulty: "Medium",
  },

  // ── Low-Carb / Keto ──
  {
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    title: "Keto Bacon Cheeseburger Bowl",
    description: "All the flavors of a cheeseburger without the bun. Ground beef, bacon, cheese, and pickles in a bowl. Low-carb and satisfying.",
    ingredients: ["500g ground beef", "4 bacon strips", "1 cup shredded cheddar", "Pickles, diced", "Lettuce, shredded", "Mustard and mayo", "Tomato, diced"],
    instructions: ["Cook bacon until crispy, crumble.", "Brown ground beef, season well.", "Layer lettuce in bowls.", "Top with beef, bacon, cheese, pickles, and tomato.", "Drizzle with mustard and mayo."],
    cookTime: "20 min",
    servings: 2,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
    title: "Zucchini Noodle Alfredo",
    description: "Spiralized zucchini noodles in a rich and creamy parmesan alfredo sauce. Low-carb pasta alternative.",
    ingredients: ["4 zucchini, spiralized", "1 cup heavy cream", "1 cup grated parmesan", "3 garlic cloves, minced", "2 tbsp butter", "Salt and pepper", "Fresh basil"],
    instructions: ["Melt butter and saute garlic.", "Add cream and bring to a gentle simmer.", "Stir in parmesan until melted.", "Add zucchini noodles and toss 2 minutes.", "Season and serve with basil."],
    cookTime: "15 min",
    servings: 2,
    difficulty: "Easy",
  },

  // ── Baked Goods ──
  {
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    title: "Homemade Banana Bread",
    description: "Moist and tender banana bread with walnuts. The ultimate way to use overripe bananas. Great for breakfast or snacking.",
    ingredients: ["3 ripe bananas", "1/3 cup melted butter", "3/4 cup sugar", "1 egg", "1 tsp vanilla", "1.5 cups flour", "1 tsp baking soda", "1/2 cup walnuts"],
    instructions: ["Mash bananas, mix with butter.", "Stir in sugar, egg, and vanilla.", "Add flour and baking soda.", "Fold in walnuts.", "Bake in a loaf pan at 175C for 55-60 minutes."],
    cookTime: "1h 10min",
    servings: 8,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80",
    title: "Cinnamon Rolls",
    description: "Soft yeasted rolls filled with cinnamon sugar and drizzled with cream cheese frosting. Weekend baking at its best.",
    ingredients: ["3 cups flour", "1 packet yeast", "1 cup warm milk", "1/4 cup sugar", "1/4 cup butter", "2 tsp cinnamon", "1/2 cup brown sugar", "Cream cheese frosting"],
    instructions: ["Mix yeast, warm milk, and sugar. Let activate.", "Add flour and butter, knead into dough.", "Roll out, spread butter, cinnamon, and brown sugar.", "Roll up tightly and slice into 12 pieces.", "Bake at 180C for 22 minutes, frost while warm."],
    cookTime: "2h",
    servings: 12,
    difficulty: "Medium",
  },

  // ── Casseroles / Oven Bakes ──
  {
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=1200&q=80",
    title: "Chicken and Broccoli Casserole",
    description: "Creamy chicken and broccoli baked with cheese and rice. Easy family-friendly casserole for busy weeknights.",
    ingredients: ["3 chicken breasts, cubed", "3 cups broccoli florets", "2 cups cooked rice", "1 cup shredded cheddar", "1 can cream of mushroom soup", "1/2 cup milk", "Salt and pepper"],
    instructions: ["Mix soup, milk, and half the cheese.", "Combine with chicken, broccoli, and rice.", "Pour into a baking dish.", "Top with remaining cheese.", "Bake at 190C for 35 minutes."],
    cookTime: "50 min",
    servings: 6,
    difficulty: "Easy",
  },
  {
    image: "https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=1200&q=80",
    title: "Vegetable Lasagna",
    description: "Layers of pasta, ricotta, spinach, zucchini, and marinara with bubbling mozzarella. Hearty vegetarian bake.",
    ingredients: ["12 lasagna sheets", "2 cups ricotta", "2 cups shredded mozzarella", "500g spinach", "2 zucchini, sliced", "3 cups marinara sauce", "1/2 cup parmesan"],
    instructions: ["Spread sauce in a baking dish.", "Layer pasta, ricotta, spinach, zucchini, and mozzarella.", "Repeat layers.", "Top with sauce, parmesan.", "Bake at 190C for 40 minutes, rest 10 minutes."],
    cookTime: "1h",
    servings: 8,
    difficulty: "Medium",
  },
];

const buildSeedRecipes = (userIds: string[]) => {
  const totalRecipes = recipeTemplates.length;
  return recipeTemplates.map((template, index) => {
    const shouldUseUnknownUser = index >= totalRecipes - UNKNOWN_USER_RECIPES;
    const userId = shouldUseUnknownUser
      ? String(new Types.ObjectId())
      : userIds[index % userIds.length];

    const likeCount = Math.floor(Math.random() * 6);
    const likedBy: string[] = [];
    const availableUserIds = userIds.filter((id) => id !== userId);

    for (let i = 0; i < likeCount && availableUserIds.length > 0; i++) {
      const randomIdx = Math.floor(Math.random() * availableUserIds.length);
      const likerUserId = availableUserIds[randomIdx];
      if (!likedBy.includes(likerUserId)) {
        likedBy.push(likerUserId);
      }
    }

    return {
      userId,
      image: template.image,
      title: template.title,
      description: template.description,
      ingredients: template.ingredients,
      instructions: template.instructions,
      cookTime: template.cookTime,
      servings: template.servings,
      difficulty: template.difficulty,
      likedBy,
    };
  });
};

const commentTemplates = [
  "Looks great, I will try this tonight.",
  "Made it today and it turned out really good.",
  "Nice recipe, I added a bit more garlic.",
  "Super easy and tasty, thanks for sharing.",
];

const buildSeedComments = (recipeIds: string[], userIds: string[]) => {
  const comments: Array<{ recipeId: string; userId: string; text: string }> = [];

  recipeIds.forEach((recipeId, index) => {
    const commentsCount = index % 3;

    for (let offset = 0; offset < commentsCount; offset++) {
      comments.push({
        recipeId,
        userId: userIds[(index + offset) % userIds.length],
        text: commentTemplates[(index + offset) % commentTemplates.length],
      });
    }
  });

  return comments;
};

async function seed() {
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
    const createdUserIds = createdUsers.map((user) => String(user._id));

    await Recipe.deleteMany({});
    const insertedRecipes = await Recipe.insertMany(recipesToInsert);

    const insertedRecipeIds = insertedRecipes.map((recipe) => String(recipe._id));
    await Comment.deleteMany({});

    const commentsToInsert = buildSeedComments(insertedRecipeIds, createdUserIds);
    if (commentsToInsert.length > 0) {
      await Comment.insertMany(commentsToInsert);
    }

    console.log(`Seeded ${createdUsers.length} users.`);
    createdUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.name} / ${user.username})`);
    });
    console.log(`Seeded ${insertedRecipes.length} recipes.`);
    console.log(`Seeded ${commentsToInsert.length} comments.`);

    // Generate embeddings for all recipes
    console.log("Generating embeddings...");
    let embeddedCount = 0;
    for (const recipe of insertedRecipes) {
      const text = `${recipe.title} ${recipe.description} ${recipe.ingredients.join(" ")} ${recipe.cookTime} ${recipe.difficulty}`;
      try {
        const embedding = await embeddingService.embed(text);
        await Recipe.findByIdAndUpdate(recipe._id, { embedding });
        embeddedCount++;
        if (embeddedCount % 10 === 0) {
          console.log(`  Embedded ${embeddedCount}/${insertedRecipes.length} recipes...`);
        }
      } catch (err) {
        console.error(`  Embedding failed for "${recipe.title}":`, err);
      }
    }
    console.log(`Embedded ${embeddedCount}/${insertedRecipes.length} recipes.`);

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

void seed();
