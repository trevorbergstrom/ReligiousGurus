import Header from "@/components/header";
import Footer from "@/components/footer";
import { WorldViewIcon, getWorldViewName } from "@/components/world-view-icons";
import { WorldView } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, Brain, Compass, Lightbulb, Scale, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="flex items-center text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Explore
              </Button>
            </Link>
          </div>
          
          {/* Main Content */}
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">About Religious Gurus</h1>
              <p className="text-lg md:text-xl max-w-3xl">
                An educational AI application providing neutral, comparative insights on religious and non-religious worldviews.
              </p>
            </div>
            
            <div className="p-8">
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">Our Mission</h2>
                <p className="text-slate-700 leading-relaxed mb-6">
                  Religious Gurus aims to provide users with neutral, comparative insights on various religious and non-religious worldviews across different topics of interest. By leveraging AI technology, we present multiple perspectives side by side, helping users understand the diversity of human thought on fundamental questions.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Our goal is educational, not persuasive. We strive to present each worldview in its most accurate and fair representation, without promoting any particular perspective over others.
                </p>
              </section>
              
              <Separator className="my-8" />
              
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-slate-900">Key Features</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <Compass className="h-5 w-5 mr-2 text-primary-600" />
                        Multi-Perspective Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">
                        Explore how eight different worldviews interpret the same topic, presented side by side for easy comparison.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-primary-600" />
                        AI Expert Agents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">
                        Each worldview is represented by a dedicated AI agent trained to provide accurate, educational responses from that perspective.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2 text-primary-600" />
                        Educational Focus
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">
                        Learn about different worldviews in a neutral, educational context without bias or persuasion.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <Scale className="h-5 w-5 mr-2 text-primary-600" />
                        Comparative Visualizations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">
                        Visual charts and detailed comparison tables help highlight similarities and differences across worldviews.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
              
              <Separator className="my-8" />
              
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-slate-900">Worldviews Represented</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {Object.values(WorldView).map((worldview) => (
                    <div key={worldview} className="flex flex-col items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3">
                        <WorldViewIcon worldview={worldview} size={32} />
                      </div>
                      <span className="text-center font-medium">
                        {getWorldViewName(worldview)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              
              <Separator className="my-8" />
              
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">How It Works</h2>
                
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                  <h3 className="font-semibold text-lg mb-3 text-slate-800">1. You Submit a Topic</h3>
                  <p className="text-slate-600 mb-4">
                    Enter any topic of interest, such as "What happens after death?" or "The meaning of suffering."
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3 text-slate-800">2. AI Agents Process Your Query</h3>
                  <p className="text-slate-600 mb-4">
                    Eight expert AI agents, each representing a different worldview, analyze your topic and generate responses from their respective perspectives.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3 text-slate-800">3. Results Are Synthesized</h3>
                  <p className="text-slate-600 mb-4">
                    A coordinator agent compiles all responses, generating a summary, comparative visualizations, and detailed analysis.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3 text-slate-800">4. You Explore Multiple Perspectives</h3>
                  <p className="text-slate-600">
                    Review the complete analysis showing how different worldviews approach your topic, highlighting similarities and differences.
                  </p>
                </div>
              </section>
              
              <Separator className="my-8" />
              
              <section>
                <h2 className="text-2xl font-bold mb-4 text-slate-900">Important Disclaimer</h2>
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                  <p className="text-slate-700 leading-relaxed mb-4">
                    Religious Gurus is an educational tool using AI to generate content. While we strive for accuracy and fairness, the information provided should not be considered authoritative on theological matters.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Always consult dedicated texts, scholars, or practitioners of specific religious or philosophical traditions for authoritative guidance. Our application aims to present comparative information neutrally without promoting any particular worldview.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
}