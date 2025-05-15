import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Topic schema
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  content: true,
});

// Response schema for storing the coordinator and expert responses
export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  summary: text("summary").notNull(),
  chartData: jsonb("chart_data").notNull(),
  comparisons: jsonb("comparisons").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  topicId: true,
  summary: true,
  chartData: true,
  comparisons: true,
});

// Define types
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;

// WorldViews enum
export enum WorldView {
  ATHEISM = "atheism",
  AGNOSTICISM = "agnosticism",
  CHRISTIANITY = "christianity",
  ISLAM = "islam",
  HINDUISM = "hinduism",
  BUDDHISM = "buddhism",
  JUDAISM = "judaism",
}

// Chart data types for the frontend
export type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
};

// Comparison data for the table
export type WorldViewComparison = {
  worldview: WorldView;
  summary: string;
  keyConcepts: string[];
  afterlifeType: string;
};
