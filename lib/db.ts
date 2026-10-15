import mongoose from "mongoose";
import { env, isDbConfigured } from "./env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Reuse the connection across hot-reloads / serverless invocations.
const globalForMongoose = globalThis as unknown as {
  __techMafiaMongoose?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.__techMafiaMongoose ?? { conn: null, promise: null };
globalForMongoose.__techMafiaMongoose = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!isDbConfigured()) {
    throw new Error(
      "MONGODB_URI is not configured. Add it to .env.local (see .env.example).",
    );
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(env.mongodbUri, {
      dbName: env.mongodbDb,
      // Fail fast instead of buffering forever when the cluster is unreachable.
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
