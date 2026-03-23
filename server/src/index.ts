import express, { Express } from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
dotenv.config({ path: ".env.dev" });
import authRoute from "./routes/authRoutes";
import { swaggerUi, swaggerSpec } from "./swagger";
import recipeRoutes from "./routes/recipeRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
app.use(express.json());
app.use(morgan("common"));

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Recipes & Comments API Documentation'
}));

app.use(cors({
  origin: "*",
  allowedHeaders: "*",
  methods: "*",
  maxAge: 86400,
}));

app.use("/auth", authRoute);
app.use("/recipes", recipeRoutes);
app.use("/users", userRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Image is too large. Max size is 5 MB."
      : err.message;
    return res.status(400).json({ error: message });
  }

  if (err instanceof Error && err.message.toLowerCase().includes("only image files")) {
    return res.status(400).json({ error: err.message });
  }

  return next(err);
});

const initApp = () => {
  const promise = new Promise<Express>((resolve, reject) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error("MONGODB_URI is not defined in the environment variables.");
      reject(new Error("MONGODB_URI is not defined"));
    } else {
      mongoose
        .connect(dbUri, {})
        .then(() => {
          resolve(app);
        });
    }
    const db = mongoose.connection;
    db.on("error", (error) => {
      console.error(error);
    });
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });
  });
  return promise;
};


export default initApp;