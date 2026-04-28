import express, { Express } from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import authRoute from "./routes/authRoutes";
import { swaggerUi, swaggerSpec } from "./swagger";
import recipeRoutes from "./routes/recipeRoutes";
import userRoutes from "./routes/userRoutes";

const envFile = process.env.ENV_FILE ?? (process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev");
dotenv.config({ path: envFile });

const app = express();
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const CLIENT_DIST_DIR = path.resolve(
  process.cwd(),
  "../client/internetapplications-final-tasteshare-yahavrotem-client/dist",
);

const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  maxAge: 86400,
};

app.use(express.json());
app.use(morgan("common"));

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Recipes & Comments API Documentation'
}));

app.use(cors(corsOptions));
app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

if (process.env.NODE_ENV === "production" && fs.existsSync(CLIENT_DIST_DIR)) {
  app.use(express.static(CLIENT_DIST_DIR));
  // Serve SPA for browser navigations (Accept: text/html) before API routes
  app.get(/^\/(?!uploads|api-docs).*/, (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const accept = req.headers.accept ?? "";
    if (accept.includes("text/html")) {
      res.sendFile(path.join(CLIENT_DIST_DIR, "index.html"));
    } else {
      next();
    }
  });
}

app.use("/auth", authRoute);
app.use("/recipes", recipeRoutes);
app.use("/users", userRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    const multerError = err as multer.MulterError;
    const message = multerError.code === "LIMIT_FILE_SIZE"
      ? "Image is too large. Max size is 5 MB."
      : multerError.message;
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
    db.on("error", (error: Error) => {
      console.error(error);
    });
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });
  });
  return promise;
};


export default initApp;