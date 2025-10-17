import { Pool } from "pg";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";

let pool: Pool | undefined;

export const getDB = () => {
  if (!pool) {
    pool = new Pool({
      host: Resource.DB.host,
      port: Resource.DB.port,
      user: Resource.DB.username,
      password: Resource.DB.password,
      database: Resource.DB.database,
      max: 40,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return drizzle(pool);
};
