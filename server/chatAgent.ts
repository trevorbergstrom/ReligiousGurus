import { WorldView, AIModel, ModelProvider } from "@shared/schema";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { generateTextWithHuggingFace, HuggingFaceModels } from "./huggingface";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

// Initialize the OpenAI model
const model = new ChatOpenAI({
  modelName: OPENAI_MODEL,
  temperature: 0.7, // Slightly higher temperature for more varied responses in chat
});

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
  
  // Process a user message and return a response
  public async processMessage(
    userMessage: string, 
    model?: string, 
    provider?: string
  ): Promise<string> {
    try {
      // If Hugging Face is requested, try it
      if (provider === ModelProvider.HUGGINGFACE && model) {
        try {
          console.log(`Attempting to use Hugging Face model: ${model}`);
          
          // Create system prompt for Hugging Face
          const systemPrompt = `You are an educational expert on ${this.worldview}. 
          Always provide factual, balanced, and educational responses about ${this.worldview}.
          
          Context information about this conversation:
          ${this.context}
          
          Respond conversationally while staying true to ${this.worldview} perspectives.
          Keep responses concise (1-3 paragraphs) and avoid unnecessarily formal academic language.`;
          
          // Directly use Hugging Face
          return await generateTextWithHuggingFace(
            model as HuggingFaceModels,
            userMessage,
            systemPrompt
          );
        } catch (error) {
          // If Hugging Face fails, log it and fall back to OpenAI silently
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Hugging Face error: ${errorMessage}`);
          console.log("Falling back to OpenAI model");
          
          // Use default OpenAI fallback
          const result = await this.chat.invoke({
            context: this.context,
            history: "",
            userMessage
          });
          
          return result;
        }
      } 
      // If OpenAI is requested
      else if (provider === ModelProvider.OPENAI && model) {
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
          
          return await chain.invoke({
            userMessage
          });
        } catch (error) {
          console.error(`OpenAI specific model error: ${error}`);
          
          // Fall back to default OpenAI model
          const result = await this.chat.invoke({
            context: this.context,
            history: "",
            userMessage
          });
          
          return result;
        }
      }
      
      // Default: Use the default chat agent
      return await this.chat.invoke({
        context: this.context,
        history: "",
        userMessage
      });
    } catch (error) {
      console.error(`Error in ${this.worldview} chat agent:`, error);
      return `I apologize, but I'm having trouble processing your request about ${this.worldview}. Could you try asking in a different way?`;
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
    model,
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