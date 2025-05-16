import { ChartData, WorldView, WorldViewComparison } from "@shared/schema";
import { ChatOpenAI } from "@langchain/openai";
// import { 
//  StateGraph, 
//  END
// } from "@langchain/langgraph";
import { 
  RunnableSequence, 
  RunnableMap
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { StructuredTool } from "@langchain/core/tools";
import { Tool } from "@langchain/core/tools";
import { sanitizeChartData, generateDefaultChartData } from "./chartHelper";

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

// Define the state interface with more robust typing
interface AgentState {
  topic: string;
  expertResponses: Partial<Record<WorldView, string>>;
  summary?: string;
  chartData?: ChartData;
  comparisons?: WorldViewComparison[];
  errors?: string[];
  allResponded?: boolean;
}

// Define interfaces for the AI responses
interface ChartDataResponse {
  metrics: string[];
  scores: Record<string, number[]>;
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
    ["system", "You are a comparative religion scholar analyzing theological overlap between different religions and worldviews."],
    ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nIdentify exactly 4 fundamental religious concepts that are either shared or contested across these worldviews (such as monotheism, scripture-based authority, soul/afterlife, moral absolutes, etc.). For each concept, score each worldview from 0 to 100 based on how central or important this concept is to that religion or worldview.\n\nReturn valid JSON data containing metrics (array of concept names) and scores (object mapping each worldview to an array of scores).`],
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

// Helper function to format worldview name
const formatWorldviewName = (worldview: string): string => {
  return worldview.charAt(0).toUpperCase() + worldview.slice(1);
};

// Helper function to convert expert responses to text format
const formatExpertResponses = (responses: Partial<Record<WorldView, string>>): string => {
  return Object.entries(responses)
    .map(([worldview, response]) => `${worldview}: ${response}`)
    .join('\n');
};

// Define nodes for the LangGraph
const nodes = {
  // Node to collect expert responses
  collectExpertResponses: async (state: AgentState): Promise<AgentState> => {
    try {
      // Create a map of expert agents for each worldview
      const expertAgents: Record<WorldView, ReturnType<typeof createExpertAgent>> = {} as any;
      for (const worldview of Object.values(WorldView)) {
        expertAgents[worldview] = createExpertAgent(worldview);
      }
      
      // Run all expert agents in parallel
      const expertPromises = Object.entries(expertAgents).map(async ([worldview, agent]) => {
        try {
          const response = await agent.invoke({ topic: state.topic });
          return { worldview, response, error: null };
        } catch (error) {
          console.error(`Error with ${worldview} expert:`, error);
          return { 
            worldview, 
            response: `The ${worldview} perspective could not be retrieved at this time.`, 
            error: error instanceof Error ? error.message : String(error) 
          };
        }
      });
      
      // Await all promises
      const results = await Promise.all(expertPromises);
      
      // Collect responses and errors
      const expertResponses: Partial<Record<WorldView, string>> = {};
      const errors: string[] = [];
      
      for (const { worldview, response, error } of results) {
        expertResponses[worldview as WorldView] = response;
        if (error) {
          errors.push(`${worldview}: ${error}`);
        }
      }
      
      return {
        ...state,
        expertResponses,
        errors: errors.length > 0 ? errors : undefined,
        allResponded: true
      };
    } catch (error) {
      console.error("Error collecting expert responses:", error);
      return {
        ...state,
        errors: [...(state.errors || []), `Failed to collect expert responses: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },
  
  // Node to generate summary
  generateSummary: async (state: AgentState): Promise<AgentState> => {
    try {
      const expertResponsesText = formatExpertResponses(state.expertResponses);
      
      const summary = await summaryGenerator.invoke({
        topic: state.topic,
        expertResponsesText
      });
      
      return {
        ...state,
        summary
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      return {
        ...state,
        summary: "We were unable to generate a summary for this topic at this time.",
        errors: [...(state.errors || []), `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },
  
  // Node to generate chart data
  generateChartData: async (state: AgentState): Promise<AgentState> => {
    try {
      const expertResponsesText = formatExpertResponses(state.expertResponses);
      
      // Get chart data from AI model
      const chartJson = await chartDataGenerator.invoke({
        topic: state.topic,
        expertResponsesText
      }) as ChartDataResponse;
      
      // Add extensive logging to debug chart issues
      console.log("============= CHART DEBUG ===============");
      console.log("Topic:", state.topic);
      console.log("Chart JSON Response:", JSON.stringify(chartJson, null, 2));
      
      // Transform to Chart.js format with safety checks
      const labels = Object.values(WorldView);
      console.log("Worldview Labels:", labels);
      
      // Ensure metrics exist or provide defaults
      const metrics = chartJson.metrics || ['Divine/Supernatural View', 'Moral Authority', 'Afterlife Beliefs', 'Sacred Texts'];
      console.log("Metrics:", metrics);
      
      // Extract scores with careful handling of object structure
      let scores = {};
      
      // Handle different possible formats of scores in the response
      if (chartJson.scores) {
        if (typeof chartJson.scores === 'object') {
          scores = chartJson.scores;
        }
      }
      
      console.log("Original scores:", JSON.stringify(scores, null, 2));
      
      // For safety, ensure every worldview has corresponding scores
      const safeScores = { ...scores };
      for (const worldview of labels) {
        const wv = worldview.toString();
        
        // Initialize array for this worldview if it doesn't exist
        if (!safeScores[wv] || !Array.isArray(safeScores[wv])) {
          // Create default scores (different for each worldview for visual clarity)
          const defaultValue = labels.indexOf(worldview) * 10 + 30; // From 30 to 100
          safeScores[wv] = metrics.map(() => defaultValue);
        }
        
        // Ensure array is complete for all metrics
        if (safeScores[wv].length < metrics.length) {
          const missingCount = metrics.length - safeScores[wv].length;
          safeScores[wv] = [...safeScores[wv], ...Array(missingCount).fill(50)];
        }
      }
      
      // Add more debugging for the safe scores
      console.log("Safe scores after processing:", JSON.stringify(safeScores, null, 2));
      
      // Create datasets with improved error handling
      const datasets = metrics.map((metric, index) => {
        // Extract data for this metric across all worldviews
        const data = labels.map(worldview => {
          const wv = worldview.toString();
          try {
            // Access scores safely using string keys
            return (safeScores[wv] && safeScores[wv][index] !== undefined) 
              ? Number(safeScores[wv][index])  // Ensure it's a number
              : 50;                            // Default to 50 if missing
          } catch (err) {
            console.log(`Error accessing score for ${wv}, metric ${index}:`, err);
            return 50; // Default on error
          }
        });
        
        console.log(`Dataset for ${metric}:`, data);
        
        return {
          label: metric,
          data,
          backgroundColor: CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length],
          borderColor: CHART_COLORS.borderColor[index % CHART_COLORS.borderColor.length],
          borderWidth: 1
        };
      });
      
      // Use our chart helper to sanitize and standardize the data
      const chartData: ChartData = sanitizeChartData(chartJson);
      
      return {
        ...state,
        chartData
      };
    } catch (error) {
      console.error("Error generating chart data:", error);
      
      // Return fallback chart data
      const labels = Object.values(WorldView).map(formatWorldviewName);
      const chartData: ChartData = {
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
      
      return {
        ...state,
        chartData,
        errors: [...(state.errors || []), `Failed to generate chart data: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  },
  
  // Node to generate comparisons
  generateComparisons: async (state: AgentState): Promise<AgentState> => {
    try {
      const expertResponsesText = formatExpertResponses(state.expertResponses);
      
      const comparisonData = await comparisonsGenerator.invoke({
        topic: state.topic,
        expertResponsesText
      }) as ComparisonDataResponse;
      
      // Convert to our schema format with safety checks
      const comparisons: WorldViewComparison[] = [];
      
      for (const worldview of Object.values(WorldView)) {
        const worldviewStr = worldview.toString();
        let data;
        
        if (comparisonData && comparisonData[worldviewStr]) {
          data = comparisonData[worldviewStr];
        } else {
          // Fallback data if missing
          data = {
            summary: state.expertResponses[worldview as WorldView] || "No summary available.",
            keyConcepts: ["No data available"],
            afterlifeType: "Unknown"
          };
        }
        
        comparisons.push({
          worldview: worldview as WorldView,
          summary: data.summary,
          keyConcepts: data.keyConcepts || ["No data available"],
          afterlifeType: data.afterlifeType || "Unknown"
        });
      }
      
      return {
        ...state,
        comparisons
      };
    } catch (error) {
      console.error("Error generating comparisons:", error);
      
      // Generate fallback comparison data
      const comparisons = Object.values(WorldView).map(worldview => ({
        worldview: worldview as WorldView,
        summary: state.expertResponses[worldview as WorldView] || "No data available.",
        keyConcepts: ["No data available"],
        afterlifeType: "Unknown"
      }));
      
      return {
        ...state,
        comparisons,
        errors: [...(state.errors || []), `Failed to generate comparisons: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
};

// NOTE: We've simplified the approach to not use StateGraph directly due to compatibility issues
// Instead, we'll use a simple sequential workflow that accomplishes the same tasks

// No graph creation needed - we'll use a simpler sequential approach
const worldviewGraph = null;

// Create a coordinator agent class that executes the nodes sequentially
export class LangGraphCoordinator {
  constructor() {
    // No initialization needed
  }
  
  async processTopic(topic: string): Promise<{
    summary: string;
    chartData: ChartData;
    comparisons: WorldViewComparison[];
  }> {
    try {
      // Initialize the state
      let state: AgentState = {
        topic,
        expertResponses: {},
      };
      
      // Execute the nodes sequentially
      console.log("Processing topic:", topic);
      
      // Step 1: Collect expert responses
      state = await nodes.collectExpertResponses(state);
      
      // Step 2: Generate summary
      state = await nodes.generateSummary(state);
      
      // Step 3: Generate chart data
      state = await nodes.generateChartData(state);
      
      // Step 4: Generate comparisons
      state = await nodes.generateComparisons(state);
      
      // Return the final result
      return {
        summary: state.summary || "Unable to generate summary.",
        chartData: state.chartData || {
          labels: Object.values(WorldView).map(formatWorldviewName),
          datasets: [{
            label: "Default",
            data: Array(Object.values(WorldView).length).fill(50),
            backgroundColor: CHART_COLORS.backgroundColor[0],
            borderColor: CHART_COLORS.borderColor[0],
            borderWidth: 1
          }]
        },
        comparisons: state.comparisons || Object.values(WorldView).map(worldview => ({
          worldview: worldview as WorldView,
          summary: "No data available.",
          keyConcepts: ["No data available"],
          afterlifeType: "Unknown"
        }))
      };
    } catch (error) {
      console.error("Error in LangGraph coordinator agent:", error);
      throw new Error("Failed to process topic. Please try again.");
    }
  }
}

// Export a singleton coordinator agent
export const langGraphCoordinator = new LangGraphCoordinator();