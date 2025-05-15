import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

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

// Chat conversations
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldview: text("worldview").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  worldview: true,
  title: true,
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isUser: true,
});

// Define types for chat
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
