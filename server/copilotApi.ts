/**
 * Religious Gurus - Comparative Worldview Explorer
 * Copyright (c) 2025 Religious Gurus Project
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ChatAgentFactory } from "./chatAgent";
import { WorldView } from "@shared/schema";
import { ChatCompletionMessageParam } from "openai/resources";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface CopilotRequest {
  messages: ChatCompletionMessageParam[];
  context?: Array<{ name: string; text: string }>;
}

export class CopilotService {
  /**
   * Process a request from the Copilot interface
   */
  async processRequest(req: CopilotRequest): Promise<string> {
    try {
      // Extract context information
      const worldviewContext = req.context?.find(item => item.name === "worldviews")?.text || "";
      const appDescription = req.context?.find(item => item.name === "app_description")?.text || "";
      
      // Build a system message with context
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `You are a helpful assistant for the Religious Gurus application, which helps users explore different worldviews. 
        ${appDescription}
        
        Available worldviews: ${worldviewContext}
        
        Your job is to:
        1. Help users navigate the application
        2. Provide neutral information about different worldviews
        3. Guide users to the comparison and chat features
        4. Answer questions about the application functionality
        
        Never provide personal opinions on religious matters. Always direct users to use the app's features
        to explore perspectives from different worldviews.`
      };
      
      // Create messages array with system message and user messages
      const messagesWithSystem = [
        systemMessage,
        ...req.messages
      ];
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // using the newest OpenAI model
        messages: messagesWithSystem,
        temperature: 0.7,
        max_tokens: 500
      });
      
      return response.choices[0].message.content || "I'm not sure how to help with that. Try asking about the application features.";
      
    } catch (error) {
      console.error("Error in Copilot service:", error);
      return "I'm having trouble processing your request. Please try again later.";
    }
  }
  
  /**
   * Extract worldview mentions from user message to provide context
   */
  private extractWorldviewMentions(message: string): WorldView[] {
    const mentions: WorldView[] = [];
    const userMessageLower = message.toLowerCase();
    
    Object.values(WorldView).forEach(worldview => {
      if (userMessageLower.includes(worldview.toLowerCase())) {
        mentions.push(worldview);
      }
    });
    
    return mentions;
  }
}

export const copilotService = new CopilotService();