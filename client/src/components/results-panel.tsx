import { useEffect, useRef, useState } from "react";
import { Share, Bookmark, Download, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldViewIcon, getWorldViewName } from "./world-view-icons";
import { TopicResponsePair } from "@/types";
import { WorldView } from "@shared/schema";
import Chart from "chart.js/auto";
import ProcessDetailsPanel from "./process-details-panel";

type ResultsPanelProps = {
  data: TopicResponsePair | null;
  isLoading: boolean;
};

export default function ResultsPanel({ data, isLoading }: ResultsPanelProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart<"radar"> | null>(null);
  
  // Initialize chart when data changes
  useEffect(() => {
    if (data && chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // Create new chart
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "radar",
          data: data.response.chartData,
          options: {
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            },
            plugins: {
              legend: {
                position: "bottom"
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
    
    // Cleanup chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Processing your topic...</p>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 min-h-[600px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Welcome to Religious Gurus</h2>
          <p className="text-slate-600 mb-4">
            Enter a topic or question to explore how different worldviews interpret it.
          </p>
          <p className="text-slate-500 text-sm">
            Example topics: "What happens after death?", "What is the purpose of life?", "How should humans treat animals?"
          </p>
        </div>
      </div>
    );
  }
  
  const { topic, response } = data;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{topic.content}</h2>
          <p className="text-sm text-slate-500">Comparing 7 worldviews</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
          >
            <Share className="h-5 w-5" />
            <span className="sr-only">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
          >
            <Bookmark className="h-5 w-5" />
            <span className="sr-only">Bookmark</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-lg"
          >
            <Download className="h-5 w-5" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Summary</h3>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 shadow-inner">
          <p className="font-serif text-lg leading-relaxed text-slate-800 first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-primary-600">
            {response.summary}
          </p>
        </div>
      </div>

      {/* Worldview Symbols */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Worldviews Compared</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-4 mb-4">
          {Object.values(WorldView).map((worldview) => {
            // Use the icon color specific to each worldview
            const bgColorClass = (() => {
              switch(worldview) {
                case WorldView.ATHEISM: return "bg-slate-600";
                case WorldView.AGNOSTICISM: return "bg-zinc-500";
                case WorldView.CHRISTIANITY: return "bg-blue-700";
                case WorldView.ISLAM: return "bg-teal-500";
                case WorldView.HINDUISM: return "bg-purple-600";
                case WorldView.BUDDHISM: return "bg-amber-700";
                case WorldView.JUDAISM: return "bg-indigo-600";
                case WorldView.SIKHISM: return "bg-rose-800";
                default: return "bg-slate-600";
              }
            })();
            
            return (
              <div key={worldview} className="flex flex-col items-center transform transition-transform hover:scale-110">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${bgColorClass} flex items-center justify-center mb-2 shadow-md touch-target`}>
                  <WorldViewIcon worldview={worldview} size={24} className="text-white" />
                </div>
                <span className="text-xs md:text-sm font-medium text-center">
                  {getWorldViewName(worldview)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Comparative Visualization</h3>
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md overflow-hidden">
          <div className="h-[400px] max-w-3xl mx-auto">
            <canvas ref={chartRef} height={400}></canvas>
          </div>
          <p className="text-slate-500 text-sm mt-4 text-center italic">
            This chart visualizes key metrics across different worldviews on this topic
          </p>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Detailed Comparison</h3>
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-md">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                <th className="py-3 md:py-4 px-3 md:px-5 text-left font-semibold text-slate-700 border-b border-slate-200">
                  Worldview
                </th>
                <th className="py-3 md:py-4 px-3 md:px-5 text-left font-semibold text-slate-700 border-b border-slate-200 hidden md:table-cell">
                  Summary
                </th>
                <th className="py-3 md:py-4 px-3 md:px-5 text-left font-semibold text-slate-700 border-b border-slate-200 hidden md:table-cell">
                  Key Concepts
                </th>
                <th className="py-3 md:py-4 px-3 md:px-5 text-left font-semibold text-slate-700 border-b border-slate-200 hidden md:table-cell">
                  Afterlife Type
                </th>
              </tr>
            </thead>
            <tbody>
              {response.comparisons.map((comparison) => {
                // Get the appropriate color for the worldview
                const worldviewColor = (() => {
                  switch(comparison.worldview) {
                    case WorldView.ATHEISM: return "text-slate-600";
                    case WorldView.AGNOSTICISM: return "text-zinc-500";
                    case WorldView.CHRISTIANITY: return "text-blue-700";
                    case WorldView.ISLAM: return "text-teal-500";
                    case WorldView.HINDUISM: return "text-purple-600";
                    case WorldView.BUDDHISM: return "text-amber-700";
                    case WorldView.JUDAISM: return "text-indigo-600";
                    case WorldView.SIKHISM: return "text-rose-800";
                    default: return "text-slate-600";
                  }
                })();
                
                return (
                  <React.Fragment key={comparison.worldview}>
                    {/* Desktop row */}
                    <tr className="hover:bg-slate-50 transition-colors hidden md:table-row">
                      <td className="py-4 px-5 border-b border-slate-100">
                        <div className="flex items-center">
                          <div className="mr-3">
                            <WorldViewIcon worldview={comparison.worldview} className={worldviewColor} size={20} />
                          </div>
                          <span className={`font-medium ${worldviewColor}`}>
                            {getWorldViewName(comparison.worldview)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 border-b border-slate-100 font-serif">
                        {comparison.summary}
                      </td>
                      <td className="py-4 px-5 border-b border-slate-100">
                        <div className="flex flex-wrap gap-2">
                          {comparison.keyConcepts.map((concept, idx) => (
                            <span 
                              key={idx} 
                              className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5 border-b border-slate-100 font-medium">
                        {comparison.afterlifeType}
                      </td>
                    </tr>
                    
                    {/* Mobile row - collapsed with expandable details */}
                    <tr className="md:hidden hover:bg-slate-50 transition-colors block border-b border-slate-100">
                      <td className="py-3 px-4 block">
                        <details className="w-full">
                          <summary className="flex items-center cursor-pointer focus:outline-none">
                            <div className="mr-3">
                              <WorldViewIcon worldview={comparison.worldview} className={worldviewColor} size={20} />
                            </div>
                            <span className={`font-medium ${worldviewColor}`}>
                              {getWorldViewName(comparison.worldview)}
                            </span>
                          </summary>
                          
                          <div className="mt-3 space-y-3 pl-8">
                            <div>
                              <div className="text-xs font-medium text-slate-500 mb-1">Summary:</div>
                              <div className="text-sm font-serif">{comparison.summary}</div>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-slate-500 mb-1">Key Concepts:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {comparison.keyConcepts.map((concept, idx) => (
                                  <span 
                                    key={idx} 
                                    className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-slate-500 mb-1">Afterlife Type:</div>
                              <div className="text-sm font-medium">{comparison.afterlifeType}</div>
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>Information is AI-generated and intended for educational use only. Always consult authoritative sources for theological guidance.</p>
        </div>
      </div>
    </div>
  );
}
