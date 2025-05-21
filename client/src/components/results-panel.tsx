import { useEffect, useRef, useState, Fragment } from "react";
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
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  
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
          <p className="text-sm text-slate-500">Comparing 8 worldviews</p>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowProcessDetails(true)}
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
            title="See how this was generated"
          >
            <Lightbulb className="h-5 w-5" />
            <span className="sr-only">View Process Details</span>
          </Button>
        </div>
      </div>
      
      {/* Process Details Panel */}
      {showProcessDetails && data && (
        <ProcessDetailsPanel 
          topicId={data.topic.id} 
          isOpen={showProcessDetails} 
          onClose={() => setShowProcessDetails(false)} 
        />
      )}

      {/* Summary Section */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Summary</span>
          <div className="h-px flex-grow bg-gradient-to-r from-teal-200 to-blue-200 ml-3"></div>
        </h3>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-blue-500"></div>
          <div className="relative z-10">
            <p className="font-serif text-lg leading-relaxed text-slate-800 first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-primary-600 first-letter:font-serif">
              {response.summary}
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-full bg-gradient-to-tr from-transparent to-slate-200/30 pointer-events-none"></div>
        </div>
        <div className="flex justify-center mt-3 gap-2">
          {Object.values(WorldView).slice(0, 6).map((worldview) => {
            // Use the icon color specific to each worldview
            const bgColorClass = (() => {
              switch(worldview) {
                case WorldView.ATHEISM: return "bg-slate-600";
                case WorldView.AGNOSTICISM: return "bg-zinc-500";
                case WorldView.CHRISTIANITY: return "bg-blue-700";
                case WorldView.ISLAM: return "bg-teal-500";
                case WorldView.HINDUISM: return "bg-purple-600";
                case WorldView.BUDDHISM: return "bg-amber-700";
                default: return "bg-slate-600";
              }
            })();
            
            return (
              <div key={`summary-icon-${worldview}`} className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{backgroundColor: bgColorClass}}>
                <WorldViewIcon worldview={worldview} size={12} className="text-white" />
              </div>
            );
          })}
          <div className="text-xs text-slate-500 ml-2 mt-1">Perspectives included</div>
        </div>
      </div>

      {/* Worldview Symbols */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Worldviews Compared</span>
          <div className="h-px flex-grow bg-gradient-to-r from-purple-200 to-indigo-200 ml-3"></div>
        </h3>
        <div className="relative p-4 md:p-6 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 shadow-sm">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 rounded-t-lg"></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3 md:gap-4 mb-2 mt-4">
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
              
              // Add a glow effect based on the worldview color
              const glowClass = (() => {
                switch(worldview) {
                  case WorldView.ATHEISM: return "hover:shadow-slate-400/50";
                  case WorldView.AGNOSTICISM: return "hover:shadow-zinc-400/50";
                  case WorldView.CHRISTIANITY: return "hover:shadow-blue-500/50";
                  case WorldView.ISLAM: return "hover:shadow-teal-400/50";
                  case WorldView.HINDUISM: return "hover:shadow-purple-500/50";
                  case WorldView.BUDDHISM: return "hover:shadow-amber-500/50";
                  case WorldView.JUDAISM: return "hover:shadow-indigo-500/50";
                  case WorldView.SIKHISM: return "hover:shadow-rose-500/50";
                  default: return "hover:shadow-slate-400/50";
                }
              })();
              
              return (
                <div key={worldview} className="flex flex-col items-center transform transition-all hover:scale-110 hover:-translate-y-1">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${bgColorClass} flex items-center justify-center mb-2 shadow-md hover:shadow-lg ${glowClass} transition-all touch-target`}>
                    <WorldViewIcon worldview={worldview} size={24} className="text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-center">
                    {getWorldViewName(worldview)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-center text-slate-500 mt-4">Hover or tap on each worldview to explore their perspective</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Comparative Visualization</span>
          <div className="h-px flex-grow bg-gradient-to-r from-blue-200 to-teal-200 ml-3"></div>
        </h3>
        <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 shadow-md overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-teal-400 rounded-t-lg"></div>
          <div className="h-[400px] max-w-3xl mx-auto">
            <canvas ref={chartRef} height={400}></canvas>
          </div>
          <div className="flex justify-center mt-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 flex items-center max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <p className="text-slate-700 text-sm">
                This radar chart visualizes the importance of key concepts across different worldviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <span className="bg-gradient-to-r from-indigo-600 to-rose-600 bg-clip-text text-transparent">Detailed Comparison</span>
          <div className="h-px flex-grow bg-gradient-to-r from-indigo-200 to-rose-200 ml-3"></div>
        </h3>
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-md relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-t-lg"></div>
          
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
              {/* Desktop table rows */}
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
                
                // Define gradient style for each row on hover
                const gradientHoverBg = (() => {
                  switch(comparison.worldview) {
                    case WorldView.ATHEISM: return "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100";
                    case WorldView.AGNOSTICISM: return "hover:bg-gradient-to-r hover:from-zinc-50 hover:to-zinc-100";
                    case WorldView.CHRISTIANITY: return "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/30";
                    case WorldView.ISLAM: return "hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-100/30";
                    case WorldView.HINDUISM: return "hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/30";
                    case WorldView.BUDDHISM: return "hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100/30";
                    case WorldView.JUDAISM: return "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100/30";
                    case WorldView.SIKHISM: return "hover:bg-gradient-to-r hover:from-rose-50 hover:to-rose-100/30";
                    default: return "hover:bg-slate-50";
                  }
                })();
                
                return (
                  <tr key={`desktop-${comparison.worldview}`} className={`transition-colors hidden md:table-row ${gradientHoverBg}`}>
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
                        {comparison.keyConcepts.map((concept, idx) => {
                          // Define concept tag color based on worldview
                          const conceptTagClass = (() => {
                            switch(comparison.worldview) {
                              case WorldView.ATHEISM: return "bg-slate-100 text-slate-700";
                              case WorldView.AGNOSTICISM: return "bg-zinc-100 text-zinc-700";
                              case WorldView.CHRISTIANITY: return "bg-blue-100 text-blue-800";
                              case WorldView.ISLAM: return "bg-teal-100 text-teal-800";
                              case WorldView.HINDUISM: return "bg-purple-100 text-purple-800";
                              case WorldView.BUDDHISM: return "bg-amber-100 text-amber-800";
                              case WorldView.JUDAISM: return "bg-indigo-100 text-indigo-800";
                              case WorldView.SIKHISM: return "bg-rose-100 text-rose-800";
                              default: return "bg-slate-100 text-slate-700";
                            }
                          })();
                          
                          return (
                            <span 
                              key={idx} 
                              className={`inline-block ${conceptTagClass} px-2 py-1 rounded-full text-xs font-medium`}
                            >
                              {concept}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-5 border-b border-slate-100 font-medium">
                      {comparison.afterlifeType}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Mobile comparison rows - separate container for mobile */}
          <div className="md:hidden">
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
              
              // Get a light background color for each worldview's accordion
              const summaryBgColor = (() => {
                switch(comparison.worldview) {
                  case WorldView.ATHEISM: return "bg-slate-50";
                  case WorldView.AGNOSTICISM: return "bg-zinc-50";
                  case WorldView.CHRISTIANITY: return "bg-blue-50";
                  case WorldView.ISLAM: return "bg-teal-50";
                  case WorldView.HINDUISM: return "bg-purple-50";
                  case WorldView.BUDDHISM: return "bg-amber-50";
                  case WorldView.JUDAISM: return "bg-indigo-50";
                  case WorldView.SIKHISM: return "bg-rose-50";
                  default: return "bg-slate-50";
                }
              })();
              
              // Define concept tag color based on worldview for mobile
              const mobileConceptClass = (() => {
                switch(comparison.worldview) {
                  case WorldView.ATHEISM: return "bg-slate-100 text-slate-700";
                  case WorldView.AGNOSTICISM: return "bg-zinc-100 text-zinc-700";
                  case WorldView.CHRISTIANITY: return "bg-blue-100 text-blue-800";
                  case WorldView.ISLAM: return "bg-teal-100 text-teal-800";
                  case WorldView.HINDUISM: return "bg-purple-100 text-purple-800";
                  case WorldView.BUDDHISM: return "bg-amber-100 text-amber-800";
                  case WorldView.JUDAISM: return "bg-indigo-100 text-indigo-800";
                  case WorldView.SIKHISM: return "bg-rose-100 text-rose-800";
                  default: return "bg-slate-100 text-slate-700";
                }
              })();
              
              return (
                <div key={`mobile-${comparison.worldview}`} className="border-b border-slate-100">
                  <details className="w-full group">
                    <summary className={`flex items-center justify-between cursor-pointer p-4 focus:outline-none ${summaryBgColor} hover:bg-opacity-75`}>
                      <div className="flex items-center">
                        <div className="mr-3">
                          <WorldViewIcon worldview={comparison.worldview} className={worldviewColor} size={20} />
                        </div>
                        <span className={`font-medium ${worldviewColor}`}>
                          {getWorldViewName(comparison.worldview)}
                        </span>
                      </div>
                      <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    
                    <div className="p-4 space-y-4 bg-white">
                      <div>
                        <div className={`text-xs font-medium ${worldviewColor} mb-2`}>Summary:</div>
                        <div className="text-sm font-serif leading-relaxed">{comparison.summary}</div>
                      </div>
                      
                      <div>
                        <div className={`text-xs font-medium ${worldviewColor} mb-2`}>Key Concepts:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {comparison.keyConcepts.map((concept, idx) => (
                            <span 
                              key={idx} 
                              className={`inline-block ${mobileConceptClass} px-2 py-0.5 rounded-full text-xs`}
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className={`text-xs font-medium ${worldviewColor} mb-2`}>Afterlife Type:</div>
                        <div className="text-sm font-medium">{comparison.afterlifeType}</div>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-center mt-6">
          <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 max-w-xl">
            <span className="font-medium">Note:</span> Information is AI-generated and intended for educational use only. Always consult authoritative sources for theological guidance.
          </div>
        </div>
      </div>
    </div>
  );
}
