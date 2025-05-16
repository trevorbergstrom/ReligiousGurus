import { 
  topics, 
  responses, 
  chatSessions,
  chatMessages,
  type Topic, 
  type InsertTopic, 
  type Response, 
  type InsertResponse,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  WorldView,
  ChartData,
  WorldViewComparison
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Topic operations
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopic(id: number): Promise<Topic | undefined>;
  getAllTopics(): Promise<Topic[]>;
  searchTopics(query: string): Promise<Topic[]>;
  deleteTopic(id: number): Promise<void>;
  
  // Response operations
  createResponse(response: InsertResponse): Promise<Response>;
  getResponseByTopicId(topicId: number): Promise<Response | undefined>;
  deleteResponse(topicId: number): Promise<void>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByWorldview(worldview: string): Promise<ChatSession[]>;
  getAllChatSessions(): Promise<ChatSession[]>;
  deleteChatSession(id: string): Promise<void>;
  
  // Chat messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  deleteChatMessagesBySessionId(sessionId: string): Promise<void>;
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
  
  async searchTopics(query: string): Promise<Topic[]> {
    if (!query || query.trim() === '') {
      return this.getAllTopics();
    }
    
    const searchTerm = `%${query.trim()}%`;
    return await db
      .select()
      .from(topics)
      .where(ilike(topics.content, searchTerm))
      .orderBy(desc(topics.createdAt));
  }
  
  async deleteTopic(id: number): Promise<void> {
    // Delete the associated response first due to foreign key constraints
    await this.deleteResponse(id);
    
    // Then delete the topic
    await db
      .delete(topics)
      .where(eq(topics.id, id));
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
  
  async deleteResponse(topicId: number): Promise<void> {
    await db
      .delete(responses)
      .where(eq(responses.topicId, topicId));
  }
  
  // Chat operations
  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }
  
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id));
    return session;
  }
  
  async getChatSessionsByWorldview(worldview: string): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.worldview, worldview))
      .orderBy(desc(chatSessions.createdAt));
  }
  
  async getAllChatSessions(): Promise<ChatSession[]> {
    return await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.createdAt));
  }
  
  async deleteChatSession(id: string): Promise<void> {
    // Delete all messages in the session first
    await this.deleteChatMessagesBySessionId(id);
    
    // Then delete the session
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.id, id));
  }
  
  // Chat messages
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }
  
  async getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }
  
  async deleteChatMessagesBySessionId(sessionId: string): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();
