import { Pool } from "pg";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  ssl: process.env.NODE_ENV === "production",
  host: Resource.VididProPostgresDB.host,
  port: Resource.VididProPostgresDB.port,
  user: Resource.VididProPostgresDB.username,
  password: Resource.VididProPostgresDB.password,
  database: Resource.VididProPostgresDB.database,
});
export const db = drizzle({ client: pool });
