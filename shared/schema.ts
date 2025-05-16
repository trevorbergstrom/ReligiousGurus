import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

// Available models
export enum AIModel {
  GPT_4_O = "gpt-4o",
  LLAMA_3_1B = "meta-llama/Llama-3.2-1B-Instruct", // Listed first to make it default
  GEMMA_3_1B = "google/gemma-3-1b-it",
  QWEN_7B = "Qwen/Qwen2.5-7B-Instruct",
  MISTRAL_7B = "mistralai/Mistral-7B-Instruct-v0.2",
  PHI_2 = "microsoft/phi-2",
  LLAMA_2_7B = "meta-llama/Llama-2-7b-chat-hf"
}

export enum ModelProvider {
  OPENAI = "openai",
  HUGGINGFACE = "huggingface",
}

// Topic schema
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  model: text("model").notNull().default(AIModel.GPT_4_O),
  provider: text("provider").notNull().default(ModelProvider.OPENAI),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTopicSchema = createInsertSchema(topics).pick({
  content: true,
  model: true,
  provider: true,
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
  SIKHISM = "sikhism",
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
  model: text("model"),
  provider: text("provider"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  isUser: true,
  model: true,
  provider: true,
});

// Define types for chat
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
