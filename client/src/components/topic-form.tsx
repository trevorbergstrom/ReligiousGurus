import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { TopicData } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModelSelector from "@/components/model-selector";
import { AIModel, ModelProvider } from "@shared/schema";

const topicSchema = z.object({
  content: z.string().min(1, "Please enter a topic"),
  model: z.string().default(AIModel.GPT_4_O),
  provider: z.string().default(ModelProvider.OPENAI),
});

type TopicFormProps = {
  topics: TopicData[];
  onSubmit: (content: string, model: string, provider: string) => void;
  onSelectTopic: (topicId: number) => void;
  isLoading: boolean;
};

export default function TopicForm({ topics, onSubmit, onSelectTopic, isLoading }: TopicFormProps) {
  const [selectedPreviousTopic, setSelectedPreviousTopic] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(AIModel.GPT_4_O);
  const [selectedProvider, setSelectedProvider] = useState<string>(ModelProvider.OPENAI);

  const form = useForm<z.infer<typeof topicSchema>>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      content: "",
      model: selectedModel,
      provider: selectedProvider,
    },
  });
  
  const handleModelChange = (model: string, provider: string) => {
    setSelectedModel(model);
    setSelectedProvider(provider);
    form.setValue("model", model);
    form.setValue("provider", provider);
  };
  
  const handleSubmit = (values: z.infer<typeof topicSchema>) => {
    onSubmit(values.content, values.model, values.provider);
  };
  
  const handlePreviousTopicSelect = (value: string) => {
    if (value) {
      const selectedTopic = topics.find(t => t.id.toString() === value);
      if (selectedTopic) {
        setSelectedPreviousTopic(value);
        onSelectTopic(selectedTopic.id);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md mb-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5 rounded-t-xl">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Ask the Gurus
        </h2>
        <p className="text-primary-100 text-sm mt-1">
          Enter a topic to explore interpretations across 8 worldviews
        </p>
      </div>
      
      <div className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Enter a topic or question</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., What happens after death?"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mb-1">
              <FormLabel className="text-sm font-medium text-slate-700">Or select a previous topic</FormLabel>
              <Select value={selectedPreviousTopic} onValueChange={handlePreviousTopicSelect}>
                <SelectTrigger className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <SelectValue placeholder="-- Select Previous Topic --" />
                </SelectTrigger>
                <SelectContent>
                  {topics.length === 0 ? (
                    <SelectItem value="no-topics" disabled>No previous topics yet</SelectItem>
                  ) : (
                    topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.content}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Model Selector */}
            <div className="mt-4">
              <ModelSelector
                selectedModel={selectedModel}
                onChange={handleModelChange}
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3 px-4 rounded-lg transition-colors text-lg shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Get Comparative Insights
                </>
              )}
            </Button>
            
            <div className="text-center text-xs text-slate-500 pt-2">
              Try topics like "The meaning of suffering" or "Free will vs. destiny"
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
