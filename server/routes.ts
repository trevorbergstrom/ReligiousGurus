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
  WorldView,
  AIModel,
  ModelProvider
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // API routes
  
  // Topic related routes
  app.get("/api/topics", async (req, res) => {
    try {
      const query = req.query.q as string;
      const topics = query 
        ? await storage.searchTopics(query)
        : await storage.getAllTopics();
      
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });
  
  app.post("/api/topics", async (req, res) => {
    try {
      const { content, model, provider } = req.body;
      
      // Validate the topic data
      const topicData = { content };
      
      try {
        insertTopicSchema.parse(topicData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
        }
        throw error;
      }
      
      // Create the topic record
      const topic = await storage.createTopic({
        ...topicData, 
        model: model || AIModel.GPT_4_O,
        provider: provider || ModelProvider.OPENAI
      });
      
      // Process the topic with the coordinator (similar to GPT function calling)
      try {
        const result = await langGraphCoordinator.processTopic(
          topic.content, 
          model || AIModel.GPT_4_O,
          ModelProvider.OPENAI
        );
        
        // Store the generated response
        const response = await storage.createResponse({
          topicId: topic.id,
          summary: result.summary,
          chartData: result.chartData,
          comparisons: result.comparisons
        });
        
        // Return the topic with its response
        res.status(201).json({
          topic,
          response
        });
      } catch (error) {
        console.error("Error processing topic:", error);
        
        // Even if process fails, we still return the created topic
        res.status(201).json({
          topic,
          response: null,
          error: "Failed to process topic"
        });
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ message: "Failed to create topic" });
    }
  });
  
  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      const topic = await storage.getTopic(topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });
  
  app.delete("/api/topics/:id", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      const topic = await storage.getTopic(topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Delete associated response first
      await storage.deleteResponse(topicId);
      
      // Then delete the topic
      await storage.deleteTopic(topicId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting topic:", error);
      res.status(500).json({ message: "Failed to delete topic" });
    }
  });
  
  app.get("/api/topics/:id/response", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      const topic = await storage.getTopic(topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      const response = await storage.getResponseByTopicId(topicId);
      
      if (!response) {
        return res.status(404).json({ message: "Response not found for this topic" });
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
          ]
        }
      });
    } catch (error) {
      console.error("Error fetching process details:", error);
      res.status(500).json({ message: "Failed to fetch process details" });
    }
  });
  
  // Chat related routes
  
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
  
  // Create a new chat session
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const { worldview, worldviews, isGroupChat, title } = req.body;
      
      // Prepare the session data with support for group chats
      const sessionData = { 
        worldview, 
        worldviews: Array.isArray(worldviews) ? worldviews : [worldview],
        isGroupChat: isGroupChat === true,
        title 
      };
      
      try {
        insertChatSessionSchema.parse(sessionData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid session data", errors: error.errors });
        }
        throw error;
      }
      
      // Create the session
      const session = await storage.createChatSession(sessionData);
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });
  
  // Get a specific chat session
  app.get("/api/chat/sessions/:id", async (req, res) => {
    try {
      const sessionId = req.params.id;
      
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });
  
  // Delete a chat session
  app.delete("/api/chat/sessions/:id", async (req, res) => {
    try {
      const sessionId = req.params.id;
      
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      
      // Delete associated messages first
      await storage.deleteChatMessagesBySessionId(sessionId);
      
      // Then delete the session
      await storage.deleteChatSession(sessionId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });
  
  // Get messages for a chat session
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
      
      // Process with the appropriate worldview agent(s)
      try {
        // Get the model info from request
        const requestedModel = req.body.model || AIModel.GPT_4_O;
        
        // Check if this is a group chat with multiple worldviews
        if (session.isGroupChat && Array.isArray(session.worldviews) && session.worldviews.length > 0) {
          // Process messages from each worldview in the group chat
          let aiMessage = null;
          
          // Process each worldview in sequence
          for (const worldview of session.worldviews) {
            try {
              const worldviewEnum = worldview as WorldView;
              const chatAgent = ChatAgentFactory.getAgent(worldviewEnum);
              
              // Process the message using the chat agent
              const response = await chatAgent.processMessage(
                userMessage.content,
                requestedModel
              );
              
              // Create an AI message prefixed with the worldview name
              let viewName = '';
              
              // Simple mapping for worldview names
              switch (worldviewEnum) {
                case WorldView.CHRISTIANITY:
                  viewName = "Christianity";
                  break;
                case WorldView.ISLAM:
                  viewName = "Islam";
                  break;
                case WorldView.BUDDHISM:
                  viewName = "Buddhism";
                  break;
                case WorldView.HINDUISM:
                  viewName = "Hinduism";
                  break;
                case WorldView.JUDAISM:
                  viewName = "Judaism";
                  break;
                case WorldView.SIKHISM:
                  viewName = "Sikhism";
                  break;
                case WorldView.ATHEISM:
                  viewName = "Atheism";
                  break;
                case WorldView.AGNOSTICISM:
                  viewName = "Agnosticism";
                  break;
                default:
                  viewName = String(worldviewEnum);
              }
              
              const content = `**${viewName} perspective:**\n${response.content}`;
              
              // Save the AI response
              aiMessage = await storage.createChatMessage({
                sessionId: sessionId,
                content,
                isUser: false,
                model: response.actualModel,
                provider: response.actualProvider
              });
              
              console.log(`Group chat: ${viewName} response processed with ${response.actualProvider} model ${response.actualModel}`);
            } catch (worldviewError) {
              console.error(`Error processing ${worldview} in group chat:`, worldviewError);
            }
          }
          
          // If no AI messages were created, throw an error
          if (!aiMessage) {
            throw new Error("Failed to process message with any worldview in the group chat");
          }
          
          // Return the last AI message (we'll improve this later to combine multiple responses)
          res.status(201).json({
            userMessage,
            aiMessage
          });
          return;
        }
        
        // Regular single worldview chat
        const worldviewEnum = session.worldview as WorldView;
        const chatAgent = ChatAgentFactory.getAgent(worldviewEnum);
        
        // Process the message using the chat agent
        const response = await chatAgent.processMessage(
          userMessage.content,
          requestedModel
        );
        
        // Log the model that was actually used
        console.log(`Message processed with: ${response.actualProvider} model ${response.actualModel}`);
        
        // Save the AI response with the correct model information
        const aiMessage = await storage.createChatMessage({
          sessionId: sessionId,
          content: response.content,
          isUser: false,
          model: response.actualModel,
          provider: response.actualProvider
        });
        
        // Return both messages
        res.status(201).json({
          userMessage,
          aiMessage
        });
      } catch (processingError) {
        console.error("Error processing chat message:", processingError);
        
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