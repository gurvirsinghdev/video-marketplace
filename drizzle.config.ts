import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schemas",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    ssl: process.env.NODE_ENV === "production",
    host: Resource.DB.host,
    port: Resource.DB.port,
    user: Resource.DB.username,
    password: Resource.DB.password,
    database: Resource.DB.database,
  },
});
