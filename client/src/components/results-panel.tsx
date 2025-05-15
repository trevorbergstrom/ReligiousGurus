import { useEffect, useRef } from "react";
import { Share, Bookmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorldViewIcon, getWorldViewName } from "./world-view-icons";
import { TopicResponsePair } from "@/types";
import { WorldView } from "@shared/schema";
import Chart from "chart.js/auto";

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
        <div className="bg-slate-50 p-4 rounded-lg font-serif leading-relaxed">
          <p>{response.summary}</p>
        </div>
      </div>

      {/* Worldview Symbols */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Worldviews Compared</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4 mb-4">
          {Object.values(WorldView).map((worldview) => (
            <div key={worldview} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <WorldViewIcon worldview={worldview} className="text-slate-700" />
              </div>
              <span className="text-sm text-center">
                {getWorldViewName(worldview)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Comparative Visualization</h3>
        <div className="bg-white border border-slate-100 rounded-lg p-4 overflow-hidden">
          <canvas ref={chartRef} height={300}></canvas>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-left font-semibold text-sm text-slate-700 border-b border-slate-200">Worldview</th>
                <th className="py-3 px-4 text-left font-semibold text-sm text-slate-700 border-b border-slate-200">Summary</th>
                <th className="py-3 px-4 text-left font-semibold text-sm text-slate-700 border-b border-slate-200">Key Concepts</th>
                <th className="py-3 px-4 text-left font-semibold text-sm text-slate-700 border-b border-slate-200">Afterlife Type</th>
              </tr>
            </thead>
            <tbody>
              {response.comparisons.map((comparison) => (
                <tr key={comparison.worldview} className="hover:bg-slate-50">
                  <td className="py-3 px-4 border-b border-slate-100 font-medium">
                    {getWorldViewName(comparison.worldview)}
                  </td>
                  <td className="py-3 px-4 border-b border-slate-100">
                    {comparison.summary}
                  </td>
                  <td className="py-3 px-4 border-b border-slate-100">
                    {comparison.keyConcepts.join(", ")}
                  </td>
                  <td className="py-3 px-4 border-b border-slate-100">
                    {comparison.afterlifeType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
