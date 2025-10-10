import { pgTable, varchar } from "drizzle-orm/pg-core";

export const userTable = pgTable("vididpro_user", {
  email: varchar("email").notNull().unique().primaryKey(),
});
