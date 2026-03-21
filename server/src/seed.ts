import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./model/userModel";

dotenv.config({ path: ".env.dev" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env.dev");
}

const seedUser = {
  email: "dummy@tasteshare.local",
  password: "Password123!",
  name: "Dummy User",
  username: "dummyuser",
  avatarUrl: "",
  bio: "Seed user for initial DB visibility",
  website: "",
  location: "",
};

async function seed() {
  try {
    console.log("Connecting to Mongo:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI!, { });

    const existing = await User.findOne({ email: seedUser.email });
    if (existing) {
      console.log("Dummy user already exists:", existing.email);
      process.exit(0);
      return;
    }

    const hashedPassword = await bcrypt.hash(seedUser.password, 10);

    const user = new User({
      ...seedUser,
      password: hashedPassword,
    });

    await user.save();

    console.log("Dummy user created:", user.email);
    console.log("Done seeding tasteshare DB. Run show dbs/collections again.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();