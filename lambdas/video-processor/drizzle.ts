import { Pool } from "pg";
import { Resource } from "sst";
import { drizzle } from "drizzle-orm/node-postgres";

export const getDB = async () => {
  const pool = new Pool({
    ssl: {
      rejectUnauthorized: false,
    },
    host: Resource.DB.host,
    port: Resource.DB.port,
    user: Resource.DB.username,
    password: Resource.DB.password,
    database: Resource.DB.database,
    maxUses: 1,
  });

  return {
    db: drizzle({ client: pool }),
    client: { end: async () => {} },
  };
};
