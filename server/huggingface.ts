import { HfInference } from '@huggingface/inference';

if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn("HUGGINGFACE_API_KEY environment variable is not set. Hugging Face functionality will be unavailable.");
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Supported models
export enum HuggingFaceModels {
  LLAMA_2_70B = "meta-llama/Llama-2-70b-chat-hf",
  MISTRAL_7B = "mistralai/Mistral-7B-Instruct-v0.2",
  FALCON_40B = "tiiuae/falcon-40b-instruct",
  MIXTRAL_8x7B = "mistralai/Mixtral-8x7B-Instruct-v0.1",
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: "openai" | "huggingface";
  apiKey: "OPENAI_API_KEY" | "HUGGINGFACE_API_KEY";
}

export const MODELS: ModelConfig[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o (OpenAI)",
    description: "Most capable OpenAI model for complex tasks",
    provider: "openai",
    apiKey: "OPENAI_API_KEY"
  },
  {
    id: HuggingFaceModels.LLAMA_2_70B,
    name: "Llama-2-70B (Hugging Face)",
    description: "Meta's most capable open model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.MISTRAL_7B,
    name: "Mistral-7B (Hugging Face)",
    description: "Efficient, high-quality instruction model",
    provider: "huggingface",
    apiKey: "HUGGINGFACE_API_KEY"
  },
  {
    id: HuggingFaceModels.MIXTRAL_8x7B,
    name: "Mixtral-8x7B (Hugging Face)",
    description: "Powerful mixture-of-experts model",
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

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

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

    return response.generated_text || "No response generated";
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