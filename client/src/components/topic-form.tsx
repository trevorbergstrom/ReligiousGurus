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

const topicSchema = z.object({
  content: z.string().min(1, "Please enter a topic"),
});

type TopicFormProps = {
  topics: TopicData[];
  onSubmit: (content: string) => void;
  onSelectTopic: (topicId: number) => void;
  isLoading: boolean;
};

export default function TopicForm({ topics, onSubmit, onSelectTopic, isLoading }: TopicFormProps) {
  const [selectedPreviousTopic, setSelectedPreviousTopic] = useState<string>("");

  const form = useForm<z.infer<typeof topicSchema>>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      content: "",
    },
  });
  
  const handleSubmit = (values: z.infer<typeof topicSchema>) => {
    onSubmit(values.content);
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
    <div className="bg-white rounded-xl shadow-sm mb-6 p-5">
      <h2 className="text-lg font-semibold mb-4">Ask the Gurus</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Enter a topic or question</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., What happens after death?"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
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
              <SelectTrigger className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <SelectValue placeholder="-- Select Previous Topic --" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    {topic.content}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Processing..." : "Get Comparative Insights"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
