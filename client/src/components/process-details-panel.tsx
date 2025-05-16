import React, { useState } from "react";
import { Lightbulb, CornerDownRight, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchProcessDetails } from "@/lib/api";
import { WorldViewIcon, getWorldViewName, getWorldViewColor } from "./world-view-icons";
import { WorldView } from "@shared/schema";

type ProcessDetailsPanelProps = {
  topicId: number;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProcessDetailsPanel({ topicId, isOpen, onClose }: ProcessDetailsPanelProps) {
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  console.log("Process details panel opened for topic:", topicId);
  
  // Fetch process details
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/topics/process-details", topicId],
    queryFn: async () => {
      console.log("Fetching process details for topic:", topicId);
      try {
        const result = await fetchProcessDetails(topicId);
        console.log("Process details result:", result);
        return result;
      } catch (error) {
        console.error("Error fetching process details:", error);
        toast({
          title: "Information",
          description: "Process details are only available for the most recently processed topic.",
          variant: "default",
        });
        throw error;
      }
    },
    enabled: isOpen, // Only fetch when panel is open
    retry: false,
    staleTime: 0, // Don't cache the result
  });

  if (!isOpen) return null;
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end overflow-hidden animate-in fade-in" onClick={(e) => {
        // Prevent clicks inside the panel from closing it
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-full overflow-y-auto shadow-xl animate-in slide-in-from-right">
        <div className="sticky top-0 bg-teal-700 text-white p-4 z-10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <h2 className="text-lg font-medium">Behind the Scenes: How This Was Generated</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="text-white hover:bg-teal-600"
          >
            Close
          </Button>
        </div>
        
        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <p className="ml-3 text-slate-600">Loading process details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4">
              <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">Process Details Not Available</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Process details are only available for the most recently processed topic.
                Try submitting a new topic to see how the system generates responses.
              </p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-medium text-slate-700 mb-2">How Your Topic Was Processed</h3>
                <div className="space-y-2 ml-2">
                  {data.explanation?.steps.map((step: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <CornerDownRight className="h-4 w-4 text-teal-500 mt-1 mr-2 flex-shrink-0" />
                      <p className="text-sm text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">{data.explanation?.note}</p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="experts">
                  <AccordionTrigger className="text-base text-teal-700 font-medium">
                    <div className="flex items-center">
                      <span className="font-medium">Step 1: Expert Responses</span>
                      <span className="ml-2 text-xs text-slate-500">
                        ({data.processDetails?.processingTimeMs?.expertResponses && formatTime(data.processDetails.processingTimeMs.expertResponses)})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {data.processDetails?.expertResponses && Object.entries(data.processDetails.expertResponses).map(([worldview, response]: [string, any]) => {
                        const color = getWorldViewColor(worldview as WorldView);
                        return (
                          <div key={worldview} className="bg-white p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center mb-2">
                              <WorldViewIcon worldview={worldview as WorldView} size={18} style={{ color }} />
                              <span className="ml-2 font-medium" style={{ color }}>
                                {getWorldViewName(worldview as WorldView)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 italic">"{response}"</p>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="summary">
                  <AccordionTrigger className="text-base text-teal-700 font-medium">
                    <div className="flex items-center">
                      <span className="font-medium">Step 2: Summary Generation</span>
                      <span className="ml-2 text-xs text-slate-500">
                        ({data.processDetails?.processingTimeMs?.summary && formatTime(data.processDetails.processingTimeMs.summary)})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3">
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium text-slate-700">Prompt used:</span>
                      </p>
                      <div className="bg-slate-50 p-3 rounded text-xs font-mono whitespace-pre-wrap text-slate-700 overflow-auto max-h-40">
                        {data.processDetails?.summaryPrompt}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="chart">
                  <AccordionTrigger className="text-base text-teal-700 font-medium">
                    <div className="flex items-center">
                      <span className="font-medium">Step 3: Chart Data Generation</span>
                      <span className="ml-2 text-xs text-slate-500">
                        ({data.processDetails?.processingTimeMs?.chartData && formatTime(data.processDetails.processingTimeMs.chartData)})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3">
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium text-slate-700">Prompt used:</span>
                      </p>
                      <div className="bg-slate-50 p-3 rounded text-xs font-mono whitespace-pre-wrap text-slate-700 overflow-auto max-h-40">
                        {data.processDetails?.chartDataPrompt}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="comparisons">
                  <AccordionTrigger className="text-base text-teal-700 font-medium">
                    <div className="flex items-center">
                      <span className="font-medium">Step 4: Detailed Comparisons</span>
                      <span className="ml-2 text-xs text-slate-500">
                        ({data.processDetails?.processingTimeMs?.comparisons && formatTime(data.processDetails.processingTimeMs.comparisons)})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3">
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium text-slate-700">Prompt used:</span>
                      </p>
                      <div className="bg-slate-50 p-3 rounded text-xs font-mono whitespace-pre-wrap text-slate-700 overflow-auto max-h-40">
                        {data.processDetails?.comparisonsPrompt}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  This transparency feature shows how different religious and philosophical perspectives 
                  are analyzed to provide a balanced comparative view.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}