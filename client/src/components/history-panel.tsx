import { TopicData } from "@/types";
import { formatRelative } from "date-fns";
import { History, Clock, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type HistoryPanelProps = {
  topics: TopicData[];
  onSelectTopic: (topicId: number) => void;
  onSearch?: (query: string) => void;
};

export default function HistoryPanel({ topics, onSelectTopic, onSearch }: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Show at most 5 topics in the history panel
  const recentTopics = topics.slice(0, 5);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-5 rounded-t-xl">
        <h2 className="text-lg font-bold text-white flex items-center">
          <History className="mr-2 h-5 w-5" />
          Recent Topics
        </h2>
        <p className="text-slate-300 text-sm mt-1">
          Your previously explored questions
        </p>
      </div>
      
      <div className="p-5">
        <form onSubmit={handleSearch} className="mb-4 flex">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search past topics..."
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-l-lg focus:ring-primary-500 focus:border-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            className="rounded-none"
          >
            Search
          </Button>
          {searchQuery && (
            <Button 
              type="button"
              variant="outline"
              className="rounded-l-none border-l-0"
              onClick={handleClearSearch}
            >
              Clear
            </Button>
          )}
        </form>
        
        {recentTopics.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium">No topics explored yet</p>
            <p className="text-sm mt-2 text-slate-400">Enter a topic above to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {recentTopics.map((topic) => (
                <div 
                  key={topic.id} 
                  className="border border-slate-200 rounded-lg hover:border-primary-200 hover:bg-slate-50 transition-all shadow-sm hover:shadow"
                >
                  <button 
                    className="w-full text-left p-4"
                    onClick={() => onSelectTopic(topic.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-slate-800">{topic.content}</h3>
                      <ArrowRight className="h-4 w-4 text-slate-400 mt-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm text-slate-500 mt-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1 inline" />
                      {formatRelative(new Date(topic.createdAt), new Date())}
                    </p>
                  </button>
                </div>
              ))}
            </div>
            
            {topics.length > 5 && (
              <div className="text-center mt-5">
                <Button 
                  variant="outline"
                  className="text-primary-600 hover:text-primary-700 border-primary-200 hover:bg-primary-50"
                >
                  View all topics
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
