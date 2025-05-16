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
        <p className="text-center text-lg mb-4 max-w-3xl mx-auto">
          Enter a topic or question to explore how different worldviews interpret it.
        </p>
        
        {/* Worldview Comparison Examples */}
        <div className="bg-slate-50 rounded-xl p-5 mb-6 max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-3">Key Worldview Differences</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-medium text-teal-600 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 19V5"></path><path d="M5 12h14"></path>
                </svg>
                Afterlife Beliefs
              </h3>
              <ul className="text-sm space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="text-blue-700 font-medium min-w-[90px] mr-1">Christianity:</span>
                  <span>Heaven, hell, resurrection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 font-medium min-w-[90px] mr-1">Hinduism:</span>
                  <span>Reincarnation based on karma</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-600 font-medium min-w-[90px] mr-1">Atheism:</span>
                  <span>No afterlife</span>
                </li>
              </ul>
              <button 
                onClick={() => handleTopicSubmit("What happens after death?")}
                className="mt-3 text-xs text-teal-600 hover:text-teal-800 font-medium"
                disabled={isLoading}
              >
                Explore this topic →
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-medium text-teal-600 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="10" r="3"></circle>
                  <path d="M7 16.3c0-1 1-2 2.5-2.5C11 13.3 12 13 12 13s1-.3 2.5.8c1.5.5 2.5 1.5 2.5 2.5"></path>
                </svg>
                Human Nature
              </h3>
              <ul className="text-sm space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="text-teal-500 font-medium min-w-[90px] mr-1">Islam:</span>
                  <span>Born pure, capable of both good and evil</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-700 font-medium min-w-[90px] mr-1">Buddhism:</span>
                  <span>No permanent self, suffering from attachment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 font-medium min-w-[90px] mr-1">Judaism:</span>
                  <span>Free will to choose good</span>
                </li>
              </ul>
              <button 
                onClick={() => handleTopicSubmit("What is human nature?")}
                className="mt-3 text-xs text-teal-600 hover:text-teal-800 font-medium"
                disabled={isLoading}
              >
                Explore this topic →
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-medium text-teal-600 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="m2 12 5.25 5 2.625-5L14.5 17l2.625-5 4.875 5"></path>
                  <path d="M3 4h18"></path>
                  <path d="M3 20h18"></path>
                </svg>
                Meaning of Suffering
              </h3>
              <ul className="text-sm space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="text-blue-700 font-medium min-w-[90px] mr-1">Christianity:</span>
                  <span>Test of faith, redemptive</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-700 font-medium min-w-[90px] mr-1">Buddhism:</span>
                  <span>Result of attachment and desire</span>
                </li>
                <li className="flex items-start">
                  <span className="text-rose-800 font-medium min-w-[90px] mr-1">Sikhism:</span>
                  <span>Part of God's will, opportunity for growth</span>
                </li>
              </ul>
              <button 
                onClick={() => handleTopicSubmit("Why do we suffer?")}
                className="mt-3 text-xs text-teal-600 hover:text-teal-800 font-medium"
                disabled={isLoading}
              >
                Explore this topic →
              </button>
            </div>
          </div>
        </div>
        
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