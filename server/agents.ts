import { ChartData, WorldView, WorldViewComparison } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "demo-key" });

// Color scheme for charts
const CHART_COLORS = {
  backgroundColor: [
    'rgba(99, 102, 241, 0.2)',
    'rgba(245, 158, 11, 0.2)',
    'rgba(16, 185, 129, 0.2)',
  ],
  borderColor: [
    'rgba(99, 102, 241, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(16, 185, 129, 1)',
  ]
};

// Interface for the expert agent
interface ExpertAgent {
  getResponse(topic: string): Promise<string>;
}

// Base expert agent implementation
class WorldViewExpert implements ExpertAgent {
  worldview: WorldView;
  
  constructor(worldview: WorldView) {
    this.worldview = worldview;
  }

  async getResponse(topic: string): Promise<string> {
    const prompt = this.createPrompt(topic);
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system", 
            content: `You are an expert in ${this.worldview}. Provide a neutral, educational response about the given topic from the perspective of ${this.worldview}. Use 1-2 concise sentences.`
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
      });
      return response.choices[0].message.content || "No response received.";
    } catch (error) {
      console.error(`Error getting response from ${this.worldview} expert:`, error);
      return `Unable to get a response from ${this.worldview} perspective due to an error.`;
    }
  }

  private createPrompt(topic: string): string {
    return `Given the topic "${topic}", describe the ${this.worldview} worldview's stance in 1-2 sentences, using neutral and educational language. Avoid bias or judgment.`;
  }
}

// Coordinator agent that orchestrates the responses from expert agents
export class CoordinatorAgent {
  private experts: Map<WorldView, ExpertAgent>;
  
  constructor() {
    this.experts = new Map();
    
    // Initialize all expert agents
    for (const worldview of Object.values(WorldView)) {
      this.experts.set(worldview, new WorldViewExpert(worldview));
    }
  }
  
  // Process a topic and return the synthesized response
  async processTopic(topic: string): Promise<{
    summary: string;
    chartData: ChartData;
    comparisons: WorldViewComparison[];
  }> {
    try {
      // Step 1: Get responses from all expert agents
      const expertResponses = new Map<WorldView, string>();
      
      for (const [worldview, expert] of this.experts.entries()) {
        const response = await expert.getResponse(topic);
        expertResponses.set(worldview, response);
      }
      
      // Step 2: Generate the summary
      const summary = await this.generateSummary(topic, expertResponses);
      
      // Step 3: Generate the chart data
      const chartData = await this.generateChartData(topic, expertResponses);
      
      // Step 4: Generate the comparisons
      const comparisons = await this.generateComparisons(topic, expertResponses);
      
      return {
        summary,
        chartData,
        comparisons
      };
    } catch (error) {
      console.error("Error in coordinator agent:", error);
      throw new Error("Failed to process topic. Please try again.");
    }
  }
  
  // Generate a summary paragraph comparing the different worldviews
  private async generateSummary(topic: string, expertResponses: Map<WorldView, string>): Promise<string> {
    const responsesText = Array.from(expertResponses.entries())
      .map(([worldview, response]) => `${worldview}: ${response}`)
      .join("\n");
    
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a neutral comparative religion expert. Synthesize the provided worldview responses into a coherent summary paragraph that highlights similarities and differences without bias."
          },
          {
            role: "user",
            content: `Topic: "${topic}"\n\nWorldview responses:\n${responsesText}\n\nCreate a neutral summary paragraph highlighting the similarities and differences between these worldviews on this topic.`
          }
        ],
        max_tokens: 300,
      });
      
      return response.choices[0].message.content || "Summary generation failed.";
    } catch (error) {
      console.error("Error generating summary:", error);
      return "Unable to generate a summary due to an error.";
    }
  }
  
  // Generate chart data comparing different aspects of the worldviews
  private async generateChartData(topic: string, expertResponses: Map<WorldView, string>): Promise<ChartData> {
    const responsesText = Array.from(expertResponses.entries())
      .map(([worldview, response]) => `${worldview}: ${response}`)
      .join("\n");
      
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a data analyst specialized in comparative religion. Generate numerical data for a radar chart comparing different aspects of worldviews on the given topic."
          },
          {
            role: "user",
            content: `Topic: "${topic}"\n\nWorldview responses:\n${responsesText}\n\nGenerate JSON data for a radar chart that compares these worldviews. Identify 3 relevant metrics for comparison (like certainty, emphasis, alignment with core doctrine, etc.) and score each worldview on these metrics from 0-100. Return only valid JSON in the format: { "metrics": ["metric1", "metric2", "metric3"], "scores": { "atheism": [score1, score2, score3], ... for all worldviews } }`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });
      
      const chartJson = JSON.parse(response.choices[0].message.content || "{}");
      
      // Transform the response into Chart.js format
      const labels = Object.values(WorldView);
      const datasets = chartJson.metrics.map((metric: string, index: number) => ({
        label: metric,
        data: labels.map(worldview => chartJson.scores[worldview][index]),
        backgroundColor: CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length],
        borderColor: CHART_COLORS.borderColor[index % CHART_COLORS.borderColor.length],
        borderWidth: 1
      }));
      
      return {
        labels: labels.map(wv => wv.charAt(0).toUpperCase() + wv.slice(1)),
        datasets
      };
    } catch (error) {
      console.error("Error generating chart data:", error);
      
      // Return fallback chart data
      const labels = Object.values(WorldView).map(wv => wv.charAt(0).toUpperCase() + wv.slice(1));
      return {
        labels,
        datasets: [
          {
            label: "Relevance",
            data: labels.map(() => Math.floor(Math.random() * 100)),
            backgroundColor: CHART_COLORS.backgroundColor[0],
            borderColor: CHART_COLORS.borderColor[0],
            borderWidth: 1
          }
        ]
      };
    }
  }
  
  // Generate structured comparison data for the table view
  private async generateComparisons(topic: string, expertResponses: Map<WorldView, string>): Promise<WorldViewComparison[]> {
    const comparisons: WorldViewComparison[] = [];
    
    const responsesText = Array.from(expertResponses.entries())
      .map(([worldview, response]) => `${worldview}: ${response}`)
      .join("\n");
    
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a comparative religion expert. Generate structured comparison data for each worldview."
          },
          {
            role: "user",
            content: `Topic: "${topic}"\n\nWorldview responses:\n${responsesText}\n\nFor each worldview, generate a JSON object with: summary (1-2 sentences), keyConcepts (array of 2-3 key terms), and afterlifeType (single term or short phrase that categorizes their view). Structure the response as a JSON array of worldview objects. Return only valid JSON.`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });
      
      const comparisonData = JSON.parse(response.choices[0].message.content || "[]");
      
      // Convert API response to our schema format
      for (const worldview of Object.values(WorldView)) {
        const data = comparisonData[worldview] || {
          summary: expertResponses.get(worldview) || "No summary available.",
          keyConcepts: ["No data available"],
          afterlifeType: "Unknown"
        };
        
        comparisons.push({
          worldview: worldview as WorldView,
          summary: data.summary,
          keyConcepts: data.keyConcepts,
          afterlifeType: data.afterlifeType
        });
      }
      
      return comparisons;
    } catch (error) {
      console.error("Error generating comparisons:", error);
      
      // Return fallback comparison data
      return Object.values(WorldView).map(worldview => ({
        worldview: worldview as WorldView,
        summary: expertResponses.get(worldview as WorldView) || "No data available.",
        keyConcepts: ["No data available"],
        afterlifeType: "Unknown"
      }));
    }
  }
}

// Export a singleton coordinator agent
export const coordinatorAgent = new CoordinatorAgent();
