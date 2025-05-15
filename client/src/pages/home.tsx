import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopicData, TopicResponsePair } from "@/types";
import Header from "@/components/header";
import TopicForm from "@/components/topic-form";
import HistoryPanel from "@/components/history-panel";
import ResultsPanel from "@/components/results-panel";
import MediaGallery from "@/components/media-gallery";
import Footer from "@/components/footer";
import { fetchTopics, submitTopic, fetchResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [currentTopicResponse, setCurrentTopicResponse] = useState<TopicResponsePair | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch topics
  const { data: topics = [] } = useQuery({
    queryKey: ["/api/topics"],
    queryFn: async () => {
      try {
        return await fetchTopics();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load topics. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });
  
  // Submit a new topic
  const { mutate: submitNewTopic, isPending: isSubmitting } = useMutation({
    mutationFn: submitTopic,
    onSuccess: (data) => {
      setCurrentTopicResponse(data);
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: "Success",
        description: "Topic processed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process topic. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Fetch a specific response
  const { mutate: fetchSpecificResponse, isPending: isFetching } = useMutation({
    mutationFn: fetchResponse,
    onSuccess: (data) => {
      setCurrentTopicResponse(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load response. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleTopicSubmit = (content: string) => {
    submitNewTopic(content);
  };
  
  const handleSelectTopic = (topicId: number) => {
    fetchSpecificResponse(topicId);
  };
  
  const isLoading = isSubmitting || isFetching;
  
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Input and History) */}
          <div className="lg:col-span-1">
            <TopicForm
              topics={topics}
              onSubmit={handleTopicSubmit}
              onSelectTopic={handleSelectTopic}
              isLoading={isLoading}
            />
            
            <HistoryPanel
              topics={topics}
              onSelectTopic={handleSelectTopic}
            />
          </div>
          
          {/* Right Column (Results) */}
          <div className="lg:col-span-2">
            <ResultsPanel
              data={currentTopicResponse}
              isLoading={isLoading}
            />
            
            <MediaGallery />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
