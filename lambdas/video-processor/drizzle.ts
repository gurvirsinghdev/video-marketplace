import { Pool } from "pg";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  ssl: process.env.NODE_ENV === "production",
  host: Resource.DB.host,
  port: Resource.DB.port,
  user: Resource.DB.username,
  password: Resource.DB.password,
  database: Resource.DB.database,
});
export const db = drizzle({ client: pool });
