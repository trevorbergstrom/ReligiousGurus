/**
 * Religious Gurus - Comparative Worldview Explorer
 * Copyright (c) 2025 Religious Gurus Project
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AIModel } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

const MODELS: ModelInfo[] = [
  {
    id: AIModel.GPT_4_O,
    name: "GPT-4o",
    description: "Most advanced model with vision capabilities"
  },
  {
    id: AIModel.GPT_4,
    name: "GPT-4",
    description: "Good for complex reasoning"
  },
  {
    id: AIModel.GPT_3_5_TURBO,
    name: "GPT-3.5",
    description: "Faster, good for simple questions"
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string, provider?: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ 
  selectedModel, 
  onChange,
  disabled = false
}: ModelSelectorProps) {
  // Compact version - horizontal radio buttons
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700">Model:</label>
        <RadioGroup 
          defaultValue={selectedModel} 
          value={selectedModel}
          onValueChange={(value) => onChange(value, "openai")}
          className="flex items-center space-x-3"
          disabled={disabled}
        >
          {MODELS.map((model) => (
            <div key={model.id} className="flex items-center space-x-1">
              <RadioGroupItem value={model.id} id={model.id} className="h-3.5 w-3.5" />
              <Label 
                htmlFor={model.id} 
                className="text-xs cursor-pointer flex items-center"
                title={model.description}
              >
                {model.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}