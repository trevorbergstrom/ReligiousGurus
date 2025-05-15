import { 
  topics, 
  responses, 
  type Topic, 
  type InsertTopic, 
  type Response, 
  type InsertResponse,
  WorldView,
  ChartData,
  WorldViewComparison
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Topic operations
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopic(id: number): Promise<Topic | undefined>;
  getAllTopics(): Promise<Topic[]>;
  
  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  getResponseByTopicId(topicId: number): Promise<Response | undefined>;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // Topic operations
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const [topic] = await db
      .insert(topics)
      .values(insertTopic)
      .returning();
    return topic;
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, id));
    return topic;
  }

  async getAllTopics(): Promise<Topic[]> {
    return await db
      .select()
      .from(topics)
      .orderBy(desc(topics.createdAt));
  }

  // Response operations
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const [response] = await db
      .insert(responses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async getResponseByTopicId(topicId: number): Promise<Response | undefined> {
    const [response] = await db
      .select()
      .from(responses)
      .where(eq(responses.topicId, topicId));
    return response;
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();
