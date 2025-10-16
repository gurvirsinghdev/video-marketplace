import { Pool } from "pg";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";

export const getDB = async () => {
  const pool = new Pool({
    host: Resource.DB.host,
    port: Resource.DB.port,
    user: Resource.DB.username,
    password: Resource.DB.password,
    database: Resource.DB.database,

    maxUses: 1,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  return drizzle({ client: pool });
};
