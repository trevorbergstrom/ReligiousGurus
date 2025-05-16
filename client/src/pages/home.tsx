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
  
  const handleTopicSubmit = (content: string, model: string, provider: string) => {
    // Clear any search when submitting a new topic
    setSearchQuery(undefined);
    submitNewTopic({ 
      content, 
      model
      // Provider is now handled server-side with OpenAI as default
    });
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
    <div className="bg-clean min-h-screen pb-8">
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-teal-600 to-blue-500 text-transparent bg-clip-text">Welcome to Religious Gurus</h1>
        <p className="text-center text-lg mb-8 max-w-3xl mx-auto text-slate-700">
          Enter a topic or question to explore how different worldviews interpret it.
        </p>
        
        {/* Mobile Form (Visible only on mobile) */}
        <div className="block lg:hidden mb-6 shadow-card rounded-lg overflow-hidden hover-scale transition-all-smooth">
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
              <div className="shadow-card rounded-lg overflow-hidden hover-scale transition-all-smooth">
                <TopicForm
                  topics={topics}
                  onSubmit={handleTopicSubmit}
                  onSelectTopic={handleSelectTopic}
                  isLoading={isLoading}
                />
              </div>
              
              <div className="mt-6 shadow-card rounded-lg overflow-hidden transition-all-smooth"> {/* History panel for desktop */}
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
            <div className="gradient-card shadow-card rounded-lg transition-all-smooth">
              <ResultsPanel
                data={currentTopicResponse}
                isLoading={isLoading}
              />
            </div>
            
            <div className="mt-6 shadow-card rounded-lg transition-all-smooth">
              <MediaGallery />
            </div>
          </div>
        </div>
        
        {/* Mobile History Panel (Visible only on mobile, below results) */}
        <div className="block lg:hidden mt-6 shadow-card rounded-lg overflow-hidden transition-all-smooth">
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