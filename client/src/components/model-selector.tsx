import { AIModel } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

const MODELS: ModelInfo[] = [
  {
    id: AIModel.GPT_4_O,
    name: "GPT-4o",
    description: "OpenAI's most advanced model with vision and reasoning capabilities"
  },
  {
    id: AIModel.GPT_4,
    name: "GPT-4",
    description: "Legacy GPT-4 model, slightly less advanced than GPT-4o"
  },
  {
    id: AIModel.GPT_3_5_TURBO,
    name: "GPT-3.5 Turbo",
    description: "Faster model, good for simpler queries and high throughput"
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
      <Select
        value={selectedModel}
        onValueChange={(value) => onChange(value, "openai")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <SelectValue className="truncate" placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="w-[250px] md:w-[300px]">
          {MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id} className="py-2">
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}