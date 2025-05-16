import { HfInference } from '@huggingface/inference';

if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn("HUGGINGFACE_API_KEY environment variable is not set. Hugging Face functionality will be unavailable.");
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Supported models - using publicly available models on Hugging Face
// Note: Some models require special access or Pro subscription
export enum HuggingFaceModels {
  // Free tier models more likely to work
  DISTILGPT2 = "distilgpt2",
  GPT2 = "gpt2",
  BLOOM = "bigscience/bloom-560m",
  FLAN_T5 = "google/flan-t5-base",
  FALCON = "tiiuae/falcon-7b-instruct",
  
  // These models may require special access
  LLAMA_3_1B = "meta-llama/Llama-3.2-1B-Instruct",
  GEMMA_3_1B = "google/gemma-3-1b-it",
  QWEN_7B = "Qwen/Qwen2.5-7B-Instruct",
  MISTRAL_7B = "mistralai/Mistral-7B-Instruct-v0.2", 
  PHI_2 = "microsoft/phi-2",
  LLAMA_2_7B = "meta-llama/Llama-2-7b-chat-hf"
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: "openai" | "huggingface";
  apiKey: "OPENAI_API_KEY" | "HUGGINGFACE_API_KEY";
}

export const MODELS: ModelConfig[] = [
  // OpenAI model
  {
    id: "gpt-4o",
    name: "GPT-4o (OpenAI)",
    description: "Most capable OpenAI model for complex tasks",
    provider: "openai",
    apiKey: "OPENAI_API_KEY"
  },
  
  // Free-tier Hugging Face models (more likely to work with free API key)
  {
    id: HuggingFaceModels.DISTILGPT2,
    name: "DistilGPT-2",
    description: "Lightweight language model, fast responses",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.GPT2,
    name: "GPT-2",
    description: "Classic language model for text generation",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.BLOOM,
    name: "BLOOM (560M)",
    description: "Efficient multilingual language model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.FLAN_T5,
    name: "Flan-T5",
    description: "Google's instruction-tuned text model",
    provider: "huggingface", 
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.FALCON,
    name: "Falcon (7B)",
    description: "Open access instruction model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  
  // Premium models (may require special access)
  {
    id: HuggingFaceModels.LLAMA_3_1B,
    name: "Llama 3.2 (1B)",
    description: "Meta's latest compact instruction model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.GEMMA_3_1B,
    name: "Gemma 3 (1B)",
    description: "Google's compact instruction model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.QWEN_7B,
    name: "Qwen 2.5 (7B)",
    description: "Efficient instruction-following model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.MISTRAL_7B,
    name: "Mistral (7B)",
    description: "Advanced instruction-tuned model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.PHI_2,
    name: "Phi-2",
    description: "Microsoft's compact reasoning model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.LLAMA_2_7B,
    name: "Llama 2 (7B)",
    description: "Meta's widely-used open model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  }
];

// Basic text generation using Hugging Face
export async function generateTextWithHuggingFace(
  model: HuggingFaceModels,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY environment variable is not set");
    }

    console.log(`Attempting to use Hugging Face model: ${model}`);
    // Format the prompt differently based on if it's an instruction model or not
    let fullPrompt: string;
    
    // If it's one of the premium instruction models that might not be available
    if (model.includes("Llama") || model.includes("gemma") || 
        model.includes("mistral") || model.includes("Qwen")) {
      fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    } 
    // For simpler models like GPT-2, just use a basic prompt format
    else {
      fullPrompt = systemPrompt ? 
        `${systemPrompt}\n\nQuestion: ${prompt}\n\nAnswer:` : 
        `Question: ${prompt}\n\nAnswer:`;
    }

    // Try the requested model first
    try {
      const response = await hf.textGeneration({
        model: model,
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.2,
          do_sample: true,
        }
      });
      
      console.log(`Successfully generated text with ${model}`);
      return response.generated_text || "No response generated";
    } catch (innerError) {
      console.error(`Error with specific model ${model}:`, innerError);
      
      // Try a series of free-tier models as fallbacks
      const freeTierModels = [
        HuggingFaceModels.GPT2,
        HuggingFaceModels.DISTILGPT2,
        HuggingFaceModels.BLOOM,
        HuggingFaceModels.FLAN_T5
      ];
      
      // Try each fallback model in sequence
      for (const fallbackModel of freeTierModels) {
        console.log(`Trying fallback model: ${fallbackModel}`);
        try {
          const fallbackResponse = await hf.textGeneration({
            model: fallbackModel,
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 512,
              temperature: 0.7,
              top_p: 0.95,
            }
          });
          
          console.log(`Successfully generated text with fallback model ${fallbackModel}`);
          return fallbackResponse.generated_text || "No response generated";
        } catch (fallbackError) {
          console.error(`Error with fallback model ${fallbackModel}:`, fallbackError);
          // Continue to the next fallback model
        }
      }
      
      // If all fallbacks fail, throw an error to trigger OpenAI fallback
      throw new Error("All Hugging Face models failed");
    }
  } catch (error) {
    console.error("Error generating text with Hugging Face:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate text with Hugging Face: ${errorMessage}`);
  }
}

// Get available models based on environment
export function getAvailableModels(): ModelConfig[] {
  const available = [];
  
  // Check OpenAI models
  if (process.env.OPENAI_API_KEY) {
    available.push(...MODELS.filter(model => model.provider === "openai"));
  }
  
  // Check Hugging Face models
  if (process.env.HUGGINGFACE_API_KEY) {
    available.push(...MODELS.filter(model => model.provider === "huggingface"));
  }
  
  return available.length > 0 ? available : [MODELS[0]]; // Default to first model if none available
}