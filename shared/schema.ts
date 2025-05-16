import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

// Available models - using only OpenAI models
export enum AIModel {
  GPT_4_O = "gpt-4o",
  GPT_4 = "gpt-4",
  GPT_3_5_TURBO = "gpt-3.5-turbo"
}

export enum ModelProvider {
  OPENAI = "openai",
}

// Topic schema
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  model: text("model").default(AIModel.GPT_4_O).notNull(),
  provider: text("provider").default(ModelProvider.OPENAI).notNull()
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  content: true,
  model: true,
  provider: true
});

// Response schema
export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => topics.id).notNull(),
  summary: text("summary").notNull(),
  chartData: jsonb("chart_data").notNull(),
  comparisons: jsonb("comparisons").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  topicId: true,
  summary: true,
  chartData: true,
  comparisons: true
});

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;

// Worldview enum
export enum WorldView {
  ATHEISM = "atheism",
  AGNOSTICISM = "agnosticism",
  CHRISTIANITY = "christianity",
  ISLAM = "islam",
  HINDUISM = "hinduism",
  BUDDHISM = "buddhism",
  JUDAISM = "judaism",
  SIKHISM = "sikhism",
}

// Chart data types
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

export type WorldViewComparison = {
  worldview: WorldView;
  summary: string;
  keyConcepts: string[];
  afterlifeType: string;
};

// Chat session schema
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldview: text("worldview").notNull(), // Main worldview (for backward compatibility)
  worldviews: text("worldviews").array().notNull().default([]), // Array of worldviews for group chats
  isGroupChat: boolean("is_group_chat").default(false).notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  worldview: true,
  worldviews: true,
  isGroupChat: true,
  title: true
});

// Chat message schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").references(() => chatSessions.id).notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  model: text("model").default(AIModel.GPT_4_O),
  provider: text("provider").default(ModelProvider.OPENAI)
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isUser: true,
  model: true,
  provider: true
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Topic/Response pair type for frontend
export type TopicResponsePair = {
  topic: Topic;
  response: Response;
};

// Topic data with metadata for frontend
export type TopicData = Topic & {
  hasResponse: boolean;
};