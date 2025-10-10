import { Resource } from "sst";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schemas",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    ssl: process.env.NODE_ENV === "production",
    host: Resource.VididProPostgresDB.host,
    port: Resource.VididProPostgresDB.port,
    user: Resource.VididProPostgresDB.username,
    password: Resource.VididProPostgresDB.password,
    database: Resource.VididProPostgresDB.database,
  },
});
