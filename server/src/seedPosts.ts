import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "./model/postModel";
import { postSeedData } from "./seeds/postSeedData";

dotenv.config({ path: ".env.dev" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env.dev");
}

async function seedPosts() {
  try {
    console.log("Connecting to Mongo:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI!, {});

    await Post.bulkWrite(
      postSeedData.map((post) => ({
        updateOne: {
          filter: { id: post.id },
          update: { $set: post },
          upsert: true,
        },
      }))
    );

    console.log(`Seeded ${postSeedData.length} feed posts.`);
    process.exit(0);
  } catch (error) {
    console.error("Posts seed failed:", error);
    process.exit(1);
  }
}

seedPosts();
