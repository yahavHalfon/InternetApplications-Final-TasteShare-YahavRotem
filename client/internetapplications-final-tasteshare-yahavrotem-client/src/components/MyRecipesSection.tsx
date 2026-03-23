import { useEffect, useState } from "react";
import { ChefHat, Grid3X3 } from "lucide-react";
import { API_BASE_URL } from "../config/env";
import { recipeService, type ApiRecipe } from "../services/recipeService";
import "./MyRecipesSection.css";

type MyRecipesSectionProps = {
  token: string;
};

const toApiAssetUrl = (assetPath?: string): string => {
  if (!assetPath) {
    return "";
  }
  return assetPath.startsWith("/") ? `${API_BASE_URL}${assetPath}` : assetPath;
};

function MyRecipesSection({ token }: MyRecipesSectionProps) {
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMyRecipes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await recipeService.getMyRecipes(token);
        setRecipes(response.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load your recipes.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMyRecipes();
  }, [token]);

  return (
    <section className="my-recipes-section" aria-label="My Recipes">
      <div className="my-recipes-tabs" role="tablist" aria-label="Profile tabs">
        <button type="button" className="my-recipes-tab my-recipes-tab-active" role="tab" aria-selected="true">
          <Grid3X3 size={15} />
          <span>My Recipes</span>
        </button>
      </div>

      <div className="my-recipes-content">
        {isLoading ? <div className="my-recipes-loading">Loading recipes...</div> : null}

        {error ? <p className="my-recipes-error">{error}</p> : null}

        {!isLoading && !error && recipes.length === 0 ? (
          <div className="my-recipes-empty">
            <div className="my-recipes-empty-icon" aria-hidden="true">
              <ChefHat size={28} />
            </div>
            <p className="my-recipes-empty-title">No recipes yet</p>
            <p className="my-recipes-empty-subtitle">Your published recipes will appear here.</p>
          </div>
        ) : null}

        {!isLoading && !error && recipes.length > 0 ? (
          <div className="my-recipes-grid">
            {recipes.map((recipe) => (
              <article key={recipe._id} className="my-recipes-tile" aria-label={recipe.title}>
                <img src={toApiAssetUrl(recipe.image)} alt={recipe.title} loading="lazy" />
                <div className="my-recipes-tile-overlay">
                  <p>{recipe.title}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default MyRecipesSection;
