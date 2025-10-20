import {
  boolean,
  integer,
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
    original_key: varchar("original_key").notNull(),
    thumbnail_key: varchar("thumbnail_key"),
    m3u8_key: varchar("m3u8_key"),
    status: videoStatusEnum().notNull().default("draft"),
    price: varchar("price").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at"),
    user_email: varchar("user_email").notNull(),
  },
  (t) => [primaryKey({ columns: [t.id] })],
);

export const tagTable = pgTable(
  "vididpro_tag",
  {
    id: uuid("id").notNull().defaultRandom(),
    label: varchar("label").notNull().unique(),
    slug: varchar("slug").notNull().unique(),
    description: varchar("description"),
    tag_usage_count: integer("tag_usage_count").notNull().default(0),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at"),
  },
  (t) => [primaryKey({ columns: [t.id] })],
);

export const videoTagTable = pgTable("vididpro_video_tag", {
  tag_id: uuid("tag_id").notNull(),
  video_id: uuid("video_id").notNull(),
});

export const userTableRelations = relations(userTable, ({ many }) => ({
  integrations: many(integrationTable),
  videos: many(videoTable),
  licenses: many(licenseTable),
}));

export const licenseTypeEnum = pgEnum("vididpro_license_type", [
  "instant",
  "custom",
]);
export const licensePaymentStatus = pgEnum("vididpro_license_payment_status", [
  "paid",
  "failed",
  "in discussion",
]);
export const licenseTable = pgTable("vididpro_license", {
  id: uuid("id").notNull().defaultRandom(),
  user_email: varchar("user_email").notNull(),
  video_id: uuid("video_id").notNull(),
  license_type: licenseTypeEnum().notNull(),
  usage: varchar("usage"),
  region: varchar("region"),
  platforms: varchar("platforms"),
  duration: varchar("duration"),
  licensed_to: varchar("licensed_to"),
  budget: varchar("budget"),
  purpose: varchar("purpose"),
  requester_name: varchar("requester_name"),
  quote_price: varchar("quote_price"),
  settle_price: varchar("settle_price"),
  creator_notes: text("creator_notes"),
  payment_status: licensePaymentStatus().notNull().default("in discussion"),
  stripe_session_checkout_id: varchar("stripe_session_checkout_id").unique(),
  stripe_payment_intent_id: varchar("stripe_payment_intent_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
});

export const integrationTableRelations = relations(
  integrationTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [integrationTable.user_email],
      references: [userTable.email],
    }),
  }),
);

export const videoTableRelations = relations(videoTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [videoTable.user_email],
    references: [userTable.email],
  }),
  tags: many(videoTagTable),
  license: many(licenseTable),
}));

export const tagTableRelations = relations(tagTable, ({ many }) => ({
  tags: many(videoTagTable),
}));

export const videoTagTableRelations = relations(videoTagTable, ({ one }) => ({
  video: one(videoTable, {
    fields: [videoTagTable.video_id],
    references: [videoTable.id],
  }),
  tag: one(tagTable, {
    fields: [videoTagTable.tag_id],
    references: [tagTable.id],
  }),
}));

export const licenseTableRelations = relations(
  licenseTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [licenseTable.user_email],
      references: [userTable.email],
    }),
    video: one(videoTable, {
      fields: [licenseTable.video_id],
      references: [videoTable.id],
    }),
  }),
);
