import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Use the new LangGraph coordinator instead of the old one
import { langGraphCoordinator } from "./langGraphAgents";
import { insertTopicSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // API routes
  
  // Get all topics or search topics
  app.get("/api/topics", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;
      
      if (query) {
        // Search topics by query
        const topics = await storage.searchTopics(query);
        res.json(topics);
      } else {
        // Get all topics
        const topics = await storage.getAllTopics();
        res.json(topics);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  // Submit a new topic
  app.post("/api/topics", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertTopicSchema.parse(req.body);
      
      // Check if the topic is not empty
      if (!validatedData.content.trim()) {
        return res.status(400).json({ message: "Topic cannot be empty" });
      }

      // Create the topic
      const topic = await storage.createTopic(validatedData);
      
      // Process the topic with the LangGraph coordinator agent
      const processedResponse = await langGraphCoordinator.processTopic(topic.content);
      
      // Store the response
      const response = await storage.createResponse({
        topicId: topic.id,
        summary: processedResponse.summary,
        chartData: processedResponse.chartData,
        comparisons: processedResponse.comparisons
      });
      
      // Return the combined data
      res.status(201).json({ 
        topic,
        response
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      
      console.error("Error processing topic:", error);
      res.status(500).json({ message: "Failed to process topic" });
    }
  });

  // Get the response for a specific topic
  app.get("/api/topics/:topicId/response", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Get the topic
      const topic = await storage.getTopic(topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Get the response
      const response = await storage.getResponseByTopicId(topicId);
      
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      res.json({
        topic,
        response
      });
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({ message: "Failed to fetch response" });
    }
  });

  return httpServer;
}
