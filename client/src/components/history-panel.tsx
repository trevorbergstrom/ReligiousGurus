import { TopicData } from "@/types";
import { formatRelative } from "date-fns";
import { History, Clock, ArrowRight, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type HistoryPanelProps = {
  topics: TopicData[];
  onSelectTopic: (topicId: number) => void;
  onSearch?: (query: string) => void;
  onDeleteTopic?: (topicId: number) => void;
};

export default function HistoryPanel({ topics, onSelectTopic, onSearch, onDeleteTopic }: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<number | null>(null);
  
  // Show either 5 topics or all topics based on user preference
  const displayTopics = showAllTopics ? topics : topics.slice(0, 5);
  
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
  
  const handleDeleteClick = (e: React.MouseEvent, topicId: number) => {
    e.stopPropagation(); // Prevent the topic from being selected
    setTopicToDelete(topicId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (topicToDelete !== null && onDeleteTopic) {
      onDeleteTopic(topicToDelete);
      setDeleteConfirmOpen(false);
      setTopicToDelete(null);
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
        
        {topics.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium">No topics explored yet</p>
            <p className="text-sm mt-2 text-slate-400">Enter a topic above to get started</p>
          </div>
        ) : displayTopics.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium">No matching topics found</p>
            <p className="text-sm mt-2 text-slate-400">Try a different search term</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayTopics.map((topic) => (
                <div 
                  key={topic.id} 
                  className="border border-slate-200 rounded-lg hover:border-primary-200 hover:bg-slate-50 transition-all shadow-sm hover:shadow"
                >
                  <div className="p-4">
                    <button 
                      className="w-full text-left"
                      onClick={() => onSelectTopic(topic.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-slate-800">{topic.content}</h3>
                        <ArrowRight className="h-4 w-4 text-slate-400 mt-1 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="flex flex-wrap justify-between mt-2">
                        <p className="text-sm text-slate-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          {formatRelative(new Date(topic.createdAt), new Date())}
                        </p>
                        {topic.model && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {topic.model.includes('/') 
                              ? topic.model.split('/').pop() 
                              : topic.model}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    {onDeleteTopic && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDeleteClick(e, topic.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!showAllTopics && topics.length > 5 && !searchQuery && (
              <div className="text-center mt-5">
                <Button 
                  variant="outline"
                  className="text-primary-600 hover:text-primary-700 border-primary-200 hover:bg-primary-50"
                  onClick={() => setShowAllTopics(true)}
                >
                  View all topics
                </Button>
              </div>
            )}
            
            {showAllTopics && !searchQuery && (
              <div className="text-center mt-5">
                <Button 
                  variant="outline"
                  className="text-primary-600 hover:text-primary-700 border-primary-200 hover:bg-primary-50"
                  onClick={() => setShowAllTopics(false)}
                >
                  Show less
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this topic and its associated response.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
