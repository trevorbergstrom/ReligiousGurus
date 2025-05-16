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
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-700">Model</label>
      <RadioGroup 
        defaultValue={selectedModel} 
        value={selectedModel}
        onValueChange={(value) => onChange(value, "openai")}
        className="flex flex-col space-y-2"
        disabled={disabled}
      >
        {MODELS.map((model) => (
          <div key={model.id} className="flex items-center space-x-2 border border-slate-200 rounded-md p-2 bg-slate-50">
            <RadioGroupItem value={model.id} id={model.id} />
            <Label htmlFor={model.id} className="flex flex-col cursor-pointer w-full">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-slate-500">{model.description}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}