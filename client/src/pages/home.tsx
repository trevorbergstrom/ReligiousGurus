import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopicData, TopicResponsePair } from "@/types";
import TopicForm from "@/components/topic-form";
import HistoryPanel from "@/components/history-panel";
import ResultsPanel from "@/components/results-panel";
import MediaGallery from "@/components/media-gallery";
import { fetchTopics, submitTopic, fetchResponse, deleteTopic } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WorldView } from "@shared/schema";
import { WorldViewIcon, getWorldViewName, getWorldViewColor } from "@/components/world-view-icons";

export default function Home() {
  const [currentTopicResponse, setCurrentTopicResponse] = useState<TopicResponsePair | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch topics
  const { data: topics = [], refetch } = useQuery({
    queryKey: ["/api/topics", searchQuery],
    queryFn: async () => {
      try {
        return await fetchTopics(searchQuery);
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
      // Clear search query and invalidate queries
      setSearchQuery(undefined);
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
  
  // Delete a topic
  const { mutate: deleteSpecificTopic, isPending: isDeleting } = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      // Clear current topic response if it was the deleted one
      if (currentTopicResponse && topicToDelete === currentTopicResponse.topic.id) {
        setCurrentTopicResponse(null);
      }
      // Invalidate queries to refresh the topics list
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: "Success",
        description: "Topic deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete topic. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Track the topic being deleted for UI purposes
  const [topicToDelete, setTopicToDelete] = useState<number | null>(null);
  
  const handleTopicSubmit = (content: string) => {
    // Clear any search when submitting a new topic
    setSearchQuery(undefined);
    submitNewTopic(content);
  };
  
  const handleSelectTopic = (topicId: number) => {
    fetchSpecificResponse(topicId);
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const isLoading = isSubmitting || isFetching;
  
  const handleDeleteTopic = (topicId: number) => {
    setTopicToDelete(topicId);
    deleteSpecificTopic(topicId);
  };
  
  return (
    <div>
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to Religious Gurus</h1>
        <p className="text-center text-lg mb-6 max-w-3xl mx-auto">
          Enter a topic or question to explore how different worldviews interpret it.
        </p>
        
        {/* Mobile Form (Visible only on mobile) */}
        <div className="block lg:hidden mb-6">
          <TopicForm
            topics={topics}
            onSubmit={handleTopicSubmit}
            onSelectTopic={handleSelectTopic}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Input and History) - Only visible on desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4"> {/* Make the left sidebar sticky on desktop */}
              <TopicForm
                topics={topics}
                onSubmit={handleTopicSubmit}
                onSelectTopic={handleSelectTopic}
                isLoading={isLoading}
              />
              
              <div className="mt-6"> {/* History panel for desktop */}
                <HistoryPanel
                  topics={topics}
                  onSelectTopic={handleSelectTopic}
                  onSearch={handleSearch}
                  onDeleteTopic={handleDeleteTopic}
                />
              </div>
            </div>
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
        
        {/* Mobile History Panel (Visible only on mobile, below results) */}
        <div className="block lg:hidden mt-6">
          <HistoryPanel
            topics={topics}
            onSelectTopic={handleSelectTopic}
            onSearch={handleSearch}
            onDeleteTopic={handleDeleteTopic}
          />
        </div>
      </main>
    </div>
  );
}