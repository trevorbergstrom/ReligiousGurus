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

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private topics: Map<number, Topic>;
  private responses: Map<number, Response>;
  private topicIdCounter: number;
  private responseIdCounter: number;

  constructor() {
    this.topics = new Map();
    this.responses = new Map();
    this.topicIdCounter = 1;
    this.responseIdCounter = 1;
  }

  // Topic operations
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.topicIdCounter++;
    const now = new Date();
    const topic: Topic = { 
      id, 
      ...insertTopic, 
      createdAt: now 
    };
    this.topics.set(id, topic);
    return topic;
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }

  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Response operations
  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = this.responseIdCounter++;
    const now = new Date();
    const response: Response = {
      id,
      ...insertResponse,
      createdAt: now
    };
    this.responses.set(id, response);
    return response;
  }

  async getResponseByTopicId(topicId: number): Promise<Response | undefined> {
    const responses = Array.from(this.responses.values());
    return responses.find(response => response.topicId === topicId);
  }
}

// Export memory storage instance
export const storage = new MemStorage();
