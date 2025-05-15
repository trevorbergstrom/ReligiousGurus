import { TopicData } from "@/types";
import { formatRelative } from "date-fns";

type HistoryPanelProps = {
  topics: TopicData[];
  onSelectTopic: (topicId: number) => void;
};

export default function HistoryPanel({ topics, onSelectTopic }: HistoryPanelProps) {
  // Show at most 5 topics in the history panel
  const recentTopics = topics.slice(0, 5);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="text-lg font-semibold mb-4">Recent Topics</h2>
      
      {recentTopics.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No topics explored yet</p>
          <p className="text-sm mt-2">Enter a topic above to get started</p>
        </div>
      ) : (
        <>
          {recentTopics.map((topic) => (
            <div 
              key={topic.id} 
              className="mb-3 border border-slate-100 rounded-lg hover:border-primary-100 hover:bg-slate-50 transition-colors"
            >
              <button 
                className="w-full text-left p-3"
                onClick={() => onSelectTopic(topic.id)}
              >
                <h3 className="font-medium mb-1">{topic.content}</h3>
                <p className="text-sm text-slate-500">
                  Explored {formatRelative(new Date(topic.createdAt), new Date())}
                </p>
              </button>
            </div>
          ))}
          
          {topics.length > 5 && (
            <div className="text-center mt-4">
              <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                View all topics
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
