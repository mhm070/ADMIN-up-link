import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const poolsTable = pgTable("pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPoolSchema = createInsertSchema(poolsTable).omit({ id: true, createdAt: true });
export type InsertPool = z.infer<typeof insertPoolSchema>;
export type Pool = typeof poolsTable.$inferSelect;
