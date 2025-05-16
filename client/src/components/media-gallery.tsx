import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorldViewIcon, getWorldViewName } from "./world-view-icons";
import { WorldView } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";

export default function MediaGallery() {
  const [activeTab, setActiveTab] = useState<string>("comparisons");
  
  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <Tabs defaultValue="comparisons" onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Key Information</h3>
            <TabsList>
              <TabsTrigger value="comparisons">Worldview Comparisons</TabsTrigger>
              <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="comparisons" className="mt-0">
            <div className="space-y-4">
              <p className="text-slate-600">Compare these eight worldviews across multiple dimensions:</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                {Object.values(WorldView).map((worldview) => (
                  <div key={worldview} className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${getWorldviewBgColor(worldview)}`}>
                      <WorldViewIcon worldview={worldview} size={32} className="text-white" />
                    </div>
                    <span className="text-sm font-medium text-center">{getWorldViewName(worldview)}</span>
                    <span className="text-xs text-center text-slate-500 mt-1">
                      {getWorldviewDescription(worldview)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-6">
                <Link href="/about">
                  <Button variant="outline">Learn more about our approach</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="how-it-works" className="mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">1</div>
                    <h4 className="font-medium">Submit Your Topic</h4>
                  </div>
                  <p className="text-sm text-slate-600 pl-11">
                    Enter any philosophical, ethical, or spiritual question you want to explore from different perspectives.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">2</div>
                    <h4 className="font-medium">AI Experts Analyze</h4>
                  </div>
                  <p className="text-sm text-slate-600 pl-11">
                    Eight AI agents, each specialized in a different worldview, analyze your question in detail.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">3</div>
                    <h4 className="font-medium">Comparative Analysis</h4>
                  </div>
                  <p className="text-sm text-slate-600 pl-11">
                    Our system compiles the responses and generates comparative visualizations and summaries.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">4</div>
                    <h4 className="font-medium">Explore & Learn</h4>
                  </div>
                  <p className="text-sm text-slate-600 pl-11">
                    Review detailed comparisons showing similarities and differences between worldviews on your topic.
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <p className="text-sm text-slate-500 italic">All responses are AI-generated for educational purposes only.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to get background color for worldview icons
function getWorldviewBgColor(worldview: string): string {
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
}

// Helper function to get brief descriptions
function getWorldviewDescription(worldview: string): string {
  switch(worldview) {
    case WorldView.ATHEISM: return "Absence of belief in deities";
    case WorldView.AGNOSTICISM: return "Knowledge of divine is unknowable";
    case WorldView.CHRISTIANITY: return "Following teachings of Jesus Christ";
    case WorldView.ISLAM: return "Submission to Allah's will";
    case WorldView.HINDUISM: return "Diverse traditions originating in India";
    case WorldView.BUDDHISM: return "Path to enlightenment";
    case WorldView.JUDAISM: return "Covenant with God";
    case WorldView.SIKHISM: return "Devotion to one formless God";
    default: return "";
  }
}
