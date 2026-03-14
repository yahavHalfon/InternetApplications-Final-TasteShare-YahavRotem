import express, { Express } from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.dev" });
import authRoute from "./routes/authRoutes";
import { swaggerUi, swaggerSpec } from "./swagger";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
app.use(express.json());
app.use(morgan("common"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Posts & Comments API Documentation'
}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});

app.use("/auth", authRoute);
app.use("/post", postRoutes);
app.use("/comments", commentRoutes);
app.use("/users", userRoutes);

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