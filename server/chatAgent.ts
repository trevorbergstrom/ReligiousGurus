/**
 * Religious Gurus - Comparative Worldview Explorer
 * Copyright (c) 2025 Religious Gurus Project
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WorldView, AIModel, ModelProvider } from "@shared/schema";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const DEFAULT_MODEL = "gpt-4o";

// Initialize the OpenAI model
const defaultModel = new ChatOpenAI({
  modelName: DEFAULT_MODEL,
  temperature: 0.7, // Slightly higher temperature for more varied responses in chat
});

// Response type for the chat agent to indicate which model was actually used
interface ChatResponse {
  content: string;
  actualModel: string;
  actualProvider: string;
}

// Create a chat agent for each worldview
export class WorldviewChatAgent {
  private worldview: WorldView;
  private chat: ReturnType<typeof createChatAgent>;
  private context: string = ""; // Basic context for now, can be expanded later
  
  constructor(worldview: WorldView) {
    this.worldview = worldview;
    this.chat = createChatAgent(worldview);
    this.setDefaultContext();
  }
  
  // Set default context based on worldview
  private setDefaultContext() {
    this.context = `You are an expert in ${this.worldview}, responding to questions with accurate, educational information about this worldview. Your responses should be neutral and factual, but written in a conversational style. If asked about topics outside of ${this.worldview}, you should redirect the conversation back to ${this.worldview} perspectives.`;
  }
  
  // Update context with past messages if needed
  public updateContext(newContext: string) {
    if (newContext) {
      this.context += "\n" + newContext;
    }
  }
  
  // Process a user message and return a response with model information
  public async processMessage(
    userMessage: string, 
    model: string = AIModel.GPT_4_O
  ): Promise<ChatResponse> {
    try {
      console.log(`Processing message with OpenAI model: ${model}`);
      
      // Use a specific OpenAI model if requested
      if (model !== AIModel.GPT_4_O) {
        try {
          // Create a new OpenAI instance with the specific model
          const openaiModel = new ChatOpenAI({
            modelName: model,
            temperature: 0.7,
          });
          
          const chatPrompt = ChatPromptTemplate.fromMessages([
            ["system", `You are an educational expert on ${this.worldview}. 
              Always provide factual, balanced, and educational responses about ${this.worldview}.
              
              Context information about this conversation:
              ${this.context}
              
              Respond conversationally while staying true to ${this.worldview} perspectives.`],
            ["user", "{userMessage}"],
          ]);
          
          const chain = RunnableSequence.from([
            chatPrompt,
            openaiModel,
            new StringOutputParser(),
          ]);
          
          const content = await chain.invoke({
            userMessage
          });
          
          return {
            content,
            actualModel: model,
            actualProvider: ModelProvider.OPENAI
          };
        } catch (error) {
          console.error(`OpenAI specific model error: ${error}`);
          
          // Fall back to default OpenAI model
          const content = await this.chat.invoke({
            context: this.context,
            history: "",
            userMessage
          });
          
          return {
            content,
            actualModel: AIModel.GPT_4_O,
            actualProvider: ModelProvider.OPENAI
          };
        }
      }
      
      // Default: Use the default chat agent (OpenAI gpt-4o)
      const content = await this.chat.invoke({
        context: this.context,
        history: "",
        userMessage
      });
      
      return {
        content,
        actualModel: AIModel.GPT_4_O,
        actualProvider: ModelProvider.OPENAI
      };
    } catch (error) {
      console.error(`Error in ${this.worldview} chat agent:`, error);
      return {
        content: `I apologize, but I'm having trouble processing your request about ${this.worldview}. Could you try asking in a different way?`,
        actualModel: AIModel.GPT_4_O,
        actualProvider: ModelProvider.OPENAI
      };
    }
  }
}

// Create a chat agent for a specific worldview
function createChatAgent(worldview: WorldView) {
  // Configure worldview-specific instructions
  let worldviewSpecificInstructions = "";
  
  switch (worldview) {
    case WorldView.ATHEISM:
      worldviewSpecificInstructions = "As an atheist perspective expert, focus on naturalistic, science-based explanations. Don't suggest supernatural causes or religious interpretations. Emphasize skepticism, critical thinking, and evidence-based reasoning.";
      break;
    case WorldView.AGNOSTICISM:
      worldviewSpecificInstructions = "As an agnostic perspective expert, emphasize the limitations of human knowledge about ultimate questions. Present both religious and secular perspectives, while maintaining that definitive answers may be unknowable.";
      break;
    case WorldView.BUDDHISM:
      worldviewSpecificInstructions = "As a Buddhist perspective expert, focus on teachings about impermanence, non-self, suffering, and the path to liberation. Reference concepts like karma, rebirth, meditation, and the Four Noble Truths when relevant.";
      break;
    case WorldView.CHRISTIANITY:
      worldviewSpecificInstructions = "As a Christian perspective expert, reference biblical teachings, Jesus Christ's life and teachings, and Christian theological concepts. Present mainstream Christian views while acknowledging denominational differences when relevant.";
      break;
    case WorldView.HINDUISM:
      worldviewSpecificInstructions = "As a Hindu perspective expert, draw on the diversity of Hindu traditions, referencing concepts like dharma, karma, reincarnation, and moksha. Acknowledge the multiple approaches and philosophies within Hinduism.";
      break;
    case WorldView.ISLAM:
      worldviewSpecificInstructions = "As an Islamic perspective expert, reference Quranic teachings, hadith, and Islamic theological concepts. Present mainstream Islamic views while acknowledging differences between major traditions (Sunni, Shia, etc.) when relevant.";
      break;
    case WorldView.JUDAISM:
      worldviewSpecificInstructions = "As a Jewish perspective expert, reference Torah teachings, rabbinic literature, and Jewish theological concepts. Present mainstream Jewish views while acknowledging differences between major movements (Orthodox, Conservative, Reform, etc.) when relevant.";
      break;
    case WorldView.SIKHISM:
      worldviewSpecificInstructions = "As a Sikh perspective expert, reference teachings from the Guru Granth Sahib, the Sikh Gurus, and key Sikh theological concepts like Waheguru, Mukti, and Seva. Emphasize Sikh principles of equality, justice, honest work, and service to humanity.";
      break;
  }
  
  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an educational expert on ${worldview}. ${worldviewSpecificInstructions} Always provide factual, balanced, and educational responses about ${worldview}. 
    
Context information about this conversation:
{context}

Conversation history:
{history}

Respond conversationally while staying true to ${worldview} perspectives. Keep responses concise (1-3 paragraphs) and avoid unnecessarily formal academic language.`],
    ["user", "{userMessage}"],
  ]);
  
  return RunnableSequence.from([
    chatPrompt,
    defaultModel,
    new StringOutputParser(),
  ]);
}

// Factory for creating chat agents
export class ChatAgentFactory {
  private static agents: Record<WorldView, WorldviewChatAgent> = {} as Record<WorldView, WorldviewChatAgent>;
  
  static getAgent(worldview: WorldView): WorldviewChatAgent {
    if (!this.agents[worldview]) {
      this.agents[worldview] = new WorldviewChatAgent(worldview);
    }
    
    return this.agents[worldview];
  }
}