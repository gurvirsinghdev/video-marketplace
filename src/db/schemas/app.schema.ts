import {
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

export const userAccountStatus = pgEnum("user_account_status", [
  "pending",
  "fulfilled",
]);
export const userTable = pgTable(
  "vididpro_user",
  {
    email: varchar("email").notNull().unique(),
    name: varchar("name"),
    account_status: userAccountStatus("account_status")
      .default("pending")
      .notNull(),

    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").$defaultFn(() => sql`NOW()`),
  },
  (t) => [primaryKey({ columns: [t.email] })],
);
