import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
const allowedTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const createStorage = (subDirectory?: string) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    const destinationPath = subDirectory
      ? path.join(UPLOADS_DIR, subDirectory)
      : UPLOADS_DIR;
    fs.mkdirSync(destinationPath, { recursive: true });
    cb(null, destinationPath);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, png, gif, webp) are allowed"));
  }
};

export const upload = multer({
  storage: createStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadRecipeImage = multer({
  storage: createStorage("recipes"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});