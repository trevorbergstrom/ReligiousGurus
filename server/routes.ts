import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Use the LangGraph coordinator and Chat Agent
import { langGraphCoordinator } from "./langGraphAgents";
import { ChatAgentFactory } from "./chatAgent";
import { 
  insertTopicSchema, 
  insertChatSessionSchema, 
  insertChatMessageSchema,
  WorldView
} from "@shared/schema";
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
      
      // Process the topic with the LangGraph coordinator agent using the selected model
      const processedResponse = await langGraphCoordinator.processTopic(
        topic.content,
        topic.model,
        topic.provider
      );
      
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
        response,
        processDetails: processedResponse.processDetails // Include the processing details
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
      
      // Check if detailed process info was requested
      const includeDetails = req.query.details === 'true';
      
      res.json({
        topic,
        response
      });
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({ message: "Failed to fetch response" });
    }
  });
  
  // Delete a topic
  app.delete("/api/topics/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Check if the topic exists
      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Delete the topic (this will also delete the associated response)
      await storage.deleteTopic(topicId);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting topic:", error);
      res.status(500).json({ message: "Failed to delete topic" });
    }
  });

  // Get process details for how responses are generated
  app.get("/api/topics/:id/process-details", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // For now, we only have process details for the most recently processed topic
      // In the future, we could store these in the database
      const processDetails = langGraphCoordinator.getProcessDetails();
      
      if (!processDetails || Object.keys(processDetails).length === 0) {
        return res.status(404).json({ 
          message: "Process details not available for this topic. Only the most recently processed topic has details available."
        });
      }
      
      res.json({
        topicId,
        processDetails,
        explanation: {
          title: "How This Response Was Generated",
          steps: [
            "1. Expert agents for each worldview (Atheism, Christianity, Islam, etc.) analyzed your topic",
            "2. A summary was generated highlighting key similarities and differences",
            "3. Chart data was created to visualize concept importance across worldviews",
            "4. Detailed comparisons were generated for each worldview"
          ],
          note: "This transparency feature helps you understand how AI generated this comparative analysis"
        }
      });
    } catch (error) {
      console.error("Error fetching process details:", error);
      res.status(500).json({ message: "Failed to fetch process details" });
    }
  });
  
  // CHAT ROUTES
  // Get all chat sessions
  app.get("/api/chat/sessions", async (req, res) => {
    try {
      const worldview = req.query.worldview as string;
      const sessions = worldview
        ? await storage.getChatSessionsByWorldview(worldview)
        : await storage.getAllChatSessions();
        
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });
  
  // Get a specific chat session
  app.get("/api/chat/sessions/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      const session = await storage.getChatSession(id);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });
  
  // Create a new chat session
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertChatSessionSchema.parse(req.body);
      
      // Create the chat session
      const session = await storage.createChatSession(validatedData);
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat session data", errors: error.errors });
      }
      
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });
  
  // Delete a chat session
  app.delete("/api/chat/sessions/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Check if the session exists
      const session = await storage.getChatSession(id);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      // Delete the session (this will also delete all associated messages)
      await storage.deleteChatSession(id);
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });
  
  // Get all messages for a chat session
  app.get("/api/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      const messages = await storage.getChatMessagesBySessionId(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  // Send a message in a chat session
  app.post("/api/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      // Validate the session exists
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      // Validate the request body
      const messageData = {
        ...req.body,
        sessionId: sessionId,
        isUser: true
      };
      
      const validatedData = insertChatMessageSchema.parse(messageData);
      
      // Create the user message
      const userMessage = await storage.createChatMessage(validatedData);
      
      // Process with the appropriate worldview agent
      try {
        const worldviewEnum = session.worldview as WorldView;
        const chatAgent = ChatAgentFactory.getAgent(worldviewEnum);
        
        // Get the AI response with model info if provided
        const model = req.body.model;
        const provider = req.body.provider;
        const responseContent = await chatAgent.processMessage(
          userMessage.content,
          model,
          provider
        );
        
        // Save the AI response with model information
        const aiMessage = await storage.createChatMessage({
          sessionId: sessionId,
          content: responseContent,
          isUser: false,
          model: model || AIModel.LLAMA_3_1B,
          provider: provider || ModelProvider.HUGGINGFACE
        });
        
        // Return both messages
        res.status(201).json({
          userMessage,
          aiMessage
        });
      } catch (error) {
        console.error("Error processing chat message:", error);
        
        // Even if the AI response fails, we still return the user message
        res.status(201).json({
          userMessage,
          aiMessage: null,
          error: "Failed to generate AI response"
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  return httpServer;
}
