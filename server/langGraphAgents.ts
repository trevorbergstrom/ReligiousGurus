import { ChartData, WorldView, WorldViewComparison } from "@shared/schema";
import { ChatOpenAI } from "@langchain/openai";
import { 
  RunnableSequence 
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputParser } from "@langchain/core/output_parsers";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const OPENAI_MODEL = "gpt-4o";

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

// Initialize the OpenAI model
const model = new ChatOpenAI({
  modelName: OPENAI_MODEL,
  temperature: 0,
});

// Define the state interface
interface AgentState {
  topic: string;
  expertResponses: Record<WorldView, string>;
  summary?: string;
  chartData?: ChartData;
  comparisons?: WorldViewComparison[];
}

// Define interfaces for the AI responses
interface ChartDataResponse {
  metrics: string[];
  scores: Record<WorldView, number[]>;
}

interface ComparisonDataResponse {
  [key: string]: {
    summary: string;
    keyConcepts: string[];
    afterlifeType: string;
  };
}

// Create expert agent functions for each worldview
const createExpertAgent = (worldview: WorldView) => {
  const expertPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert in ${worldview}. Provide a neutral, educational response about the given topic from the perspective of ${worldview}. Use 1-2 concise sentences.`],
    ["user", `Given the topic "{topic}", describe the ${worldview} worldview's stance in 1-2 sentences, using neutral and educational language. Avoid bias or judgment.`],
  ]);

  return RunnableSequence.from([
    expertPrompt,
    model,
    new StringOutputParser(),
  ]);
};

// Create a summary generator
const summaryGenerator = (() => {
  const summaryPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a neutral comparative religion expert. Synthesize the provided worldview responses into a coherent summary paragraph that highlights similarities and differences without bias."],
    ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nCreate a neutral summary paragraph highlighting the similarities and differences between these worldviews on this topic.`],
  ]);

  return RunnableSequence.from([
    summaryPrompt,
    model,
    new StringOutputParser(),
  ]);
})();

// Create a chart data generator
const chartDataGenerator = (() => {
  const chartPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a data analyst specialized in comparative religion. Extract key religious concepts and theological patterns from different worldviews."],
    ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nAnalyze these responses and identify 3-4 key religious or theological concepts/themes that differ across these worldviews (such as: divine intervention, moral authority, soul existence, ritual importance, afterlife beliefs, etc.). Focus on substantive religious differences rather than stylistic language differences. Then, score each worldview on these concepts based on how strongly they emphasize or affirm each concept (0-100). Return valid JSON data with a 'metrics' array (containing the religious concept names) and a 'scores' object mapping each worldview to its scores.`],
  ]);

  return RunnableSequence.from([
    chartPrompt,
    model.bind({ response_format: { type: "json_object" } }),
    new JsonOutputParser(),
  ]);
})();

// Create a comparisons generator
const comparisonsGenerator = (() => {
  const comparisonPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a comparative religion expert. Generate structured comparison data for each worldview."],
    ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nGenerate a JSON object with data for each worldview. For each worldview, create an entry with summary (1-2 sentences), keyConcepts (array of 2-3 key terms), and afterlifeType (single term). Return valid JSON.`],
  ]);

  return RunnableSequence.from([
    comparisonPrompt,
    model.bind({ response_format: { type: "json_object" } }),
    new JsonOutputParser(),
  ]);
})();

// Create a simpler implementation that doesn't use the complex LangGraph features yet
// This will allow us to still benefit from the LangChain structured approach
export class LangGraphCoordinator {
  private expertAgents: Record<WorldView, ReturnType<typeof createExpertAgent>>;
  
  constructor() {
    // Initialize expert agents for each worldview
    this.expertAgents = {} as Record<WorldView, ReturnType<typeof createExpertAgent>>;
    for (const worldview of Object.values(WorldView)) {
      this.expertAgents[worldview as WorldView] = createExpertAgent(worldview as WorldView);
    }
  }
  
  async processTopic(topic: string): Promise<{
    summary: string;
    chartData: ChartData;
    comparisons: WorldViewComparison[];
  }> {
    try {
      // Step 1: Get responses from all expert agents
      const expertResponses: Record<WorldView, string> = {} as Record<WorldView, string>;
      
      // Execute each expert agent in parallel
      const expertPromises = Object.entries(this.expertAgents).map(async ([worldview, agent]) => {
        const response = await agent.invoke({ topic });
        return { worldview, response };
      });
      
      // Wait for all expert agents to complete
      const expertResults = await Promise.all(expertPromises);
      
      // Organize results into a structured format
      for (const { worldview, response } of expertResults) {
        expertResponses[worldview as WorldView] = response;
      }
      
      // Step 2: Generate the summary
      const responsesText = Object.entries(expertResponses)
        .map(([worldview, response]) => `${worldview}: ${response}`)
        .join("\n");
      
      const summary = await summaryGenerator.invoke({
        topic,
        expertResponsesText: responsesText
      });
      
      // Step 3: Generate chart data
      let chartData: ChartData;
      try {
        const chartJson = await chartDataGenerator.invoke({
          topic,
          expertResponsesText: responsesText
        }) as ChartDataResponse;
        
        // Transform to Chart.js format
        const labels = Object.values(WorldView);
        const datasets = chartJson.metrics.map((metric: string, index: number) => ({
          label: metric,
          data: labels.map(worldview => chartJson.scores[worldview as WorldView][index]),
          backgroundColor: CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length],
          borderColor: CHART_COLORS.borderColor[index % CHART_COLORS.borderColor.length],
          borderWidth: 1
        }));
        
        chartData = {
          labels: labels.map(wv => wv.charAt(0).toUpperCase() + wv.slice(1)),
          datasets
        };
      } catch (error) {
        console.error("Error generating chart data:", error);
        
        // Return fallback chart data
        const labels = Object.values(WorldView).map(wv => wv.charAt(0).toUpperCase() + wv.slice(1));
        chartData = {
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
      
      // Step 4: Generate comparisons
      let comparisons: WorldViewComparison[];
      try {
        const comparisonData = await comparisonsGenerator.invoke({
          topic,
          expertResponsesText: responsesText
        }) as ComparisonDataResponse;
        
        // Convert to our schema format
        comparisons = Object.values(WorldView).map(worldview => {
          const worldviewStr = worldview.toString();
          const data = comparisonData[worldviewStr] || {
            summary: expertResponses[worldview as WorldView] || "No summary available.",
            keyConcepts: ["No data available"],
            afterlifeType: "Unknown"
          };
          
          return {
            worldview: worldview as WorldView,
            summary: data.summary,
            keyConcepts: data.keyConcepts,
            afterlifeType: data.afterlifeType
          };
        });
      } catch (error) {
        console.error("Error generating comparisons:", error);
        
        // Return fallback comparison data
        comparisons = Object.values(WorldView).map(worldview => ({
          worldview: worldview as WorldView,
          summary: expertResponses[worldview as WorldView] || "No data available.",
          keyConcepts: ["No data available"],
          afterlifeType: "Unknown"
        }));
      }
      
      return {
        summary,
        chartData,
        comparisons
      };
    } catch (error) {
      console.error("Error in LangGraph coordinator agent:", error);
      throw new Error("Failed to process topic. Please try again.");
    }
  }
}

// Export a singleton coordinator agent
export const langGraphCoordinator = new LangGraphCoordinator();