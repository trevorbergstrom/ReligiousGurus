import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIModel, ModelProvider } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
}

const MODELS: ModelInfo[] = [
  {
    id: AIModel.GPT_4_O,
    name: "GPT-4o",
    description: "Most capable OpenAI model",
    provider: ModelProvider.OPENAI
  },
  {
    id: AIModel.GEMMA_7B,
    name: "Gemma (7B)",
    description: "Google's instruction model",
    provider: ModelProvider.HUGGINGFACE
  },
  {
    id: AIModel.ZEPHYR,
    name: "Zephyr (7B)",
    description: "Fine-tuned instruction model",
    provider: ModelProvider.HUGGINGFACE
  },
  {
    id: AIModel.FLAN_T5,
    name: "Flan-T5",
    description: "Google's T5 instruction model",
    provider: ModelProvider.HUGGINGFACE
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string, provider: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ 
  selectedModel, 
  onChange, 
  disabled = false 
}: ModelSelectorProps) {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(MODELS);
  
  // Find the selected model's info
  const selectedModelInfo = availableModels.find(model => model.id === selectedModel) || availableModels[0];

  const handleModelChange = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      onChange(model.id, model.provider);
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-slate-700">Model</label>
      <Select 
        value={selectedModel} 
        onValueChange={handleModelChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span>{model.name}</span>
                <Badge 
                  variant="outline" 
                  className={`ml-2 ${
                    model.provider === ModelProvider.OPENAI 
                      ? "text-blue-600 bg-blue-50 border-blue-200" 
                      : "text-green-600 bg-green-50 border-green-200"
                  }`}
                >
                  {model.provider === ModelProvider.OPENAI ? "OpenAI" : "HF"}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-slate-500">{selectedModelInfo.description}</p>
    </div>
  );
}