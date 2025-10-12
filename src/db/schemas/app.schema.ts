import {
  boolean,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const userAccountStatus = pgEnum("user_account_status", [
  "pending",
  "fulfilled",
]);
export const userAccountType = pgEnum("user_account_type", [
  "company",
  "government_entity",
  "individual",
  "non_profit",
]);
export const userTable = pgTable(
  "vididpro_user",
  {
    email: varchar("email").notNull().unique(),
    name: varchar("name"),
    account_status: userAccountStatus("account_status")
      .default("pending")
      .notNull(),
    country: varchar("country"),
    account_type: userAccountType(),
    registered_name: varchar("registered_name"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at"),
  },
  (t) => [primaryKey({ columns: [t.email] })],
);

export const integrationServiceEnum = pgEnum("integration_service", ["stripe"]);
export const integrationTable = pgTable(
  "vididpro_integration",
  {
    id: uuid("id").notNull().defaultRandom(),
    user_email: varchar("user_email").notNull(),
    service: integrationServiceEnum("service").notNull(),
    metadata: json("metadata").default(JSON.stringify({})),
    active: boolean("active").notNull().default(false),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at"),
  },
  (t) => [primaryKey({ columns: [t.id] })],
);

export const videoStatusEnum = pgEnum("video_status_enum", [
  "draft",
  "restricted",
  "published",
]);
export const videoTable = pgTable(
  "vididpro_video",
  {
    id: uuid("id").notNull().defaultRandom(),
    title: varchar("title").notNull(),
    description: text("description").notNull(),
    file_key: varchar("file_key").notNull(),
    status: videoStatusEnum().notNull().default("draft"),
    tags: varchar("tags"),
    price: varchar("price").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at"),
    user_email: varchar("user_email").notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] })],
);

export const userTableRelations = relations(userTable, ({ many }) => ({
  integrations: many(integrationTable),
  videos: many(videoTable),
}));

export const integrationTableRelations = relations(
  integrationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [integrationTable.user_email],
      references: [userTable.email],
    }),
  }),
);

export const videoTableRelations = relations(videoTable, ({ one }) => ({
  user: one(userTable, {
    fields: [videoTable.user_email],
    references: [userTable.email],
  }),
}));
