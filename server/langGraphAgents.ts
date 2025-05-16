import { ChartData, WorldView, WorldViewComparison, AIModel, ModelProvider } from "@shared/schema";
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
import { generateTextWithHuggingFace, HuggingFaceModels } from "./huggingface";

// Default OpenAI model
const DEFAULT_OPENAI_MODEL = AIModel.GPT_4_O;

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
  modelName: DEFAULT_OPENAI_MODEL,
  temperature: 0,
});

// Define the state interface with more robust typing
interface AgentState {
  topic: string;
  model: string;
  provider: string;
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

  return (state: AgentState) => {
    if (state.provider === ModelProvider.HUGGINGFACE) {
      // For Hugging Face models, return a function that directly calls the HF API
      return async (input: { topic: string }): Promise<string> => {
        const systemPrompt = `You are an expert in ${worldview}. Provide a neutral, educational response about the given topic from the perspective of ${worldview}. Use 1-2 concise sentences.`;
        const userPrompt = `Given the topic "${input.topic}", describe the ${worldview} worldview's stance in 1-2 sentences, using neutral and educational language. Avoid bias or judgment.`;
        
        try {
          const response = await generateTextWithHuggingFace(
            state.model as HuggingFaceModels,
            userPrompt,
            systemPrompt
          );
          return response;
        } catch (error) {
          console.error(`Error with Hugging Face model for ${worldview}:`, error);
          return `Error: Failed to get response from ${worldview} perspective using Hugging Face.`;
        }
      };
    } else {
      // For OpenAI, use LangChain
      const customModel = new ChatOpenAI({
        modelName: state.model,
        temperature: 0,
      });
      
      return RunnableSequence.from([
        expertPrompt,
        customModel,
        new StringOutputParser(),
      ]);
    }
  };
};

// Create a summary generator that uses the selected model
const createSummaryGenerator = (state: AgentState) => {
  // Common system prompt
  const systemPromptText = "You are a neutral comparative religion expert. Synthesize the provided worldview responses into a coherent summary paragraph that highlights similarities and differences without bias.";
  
  if (state.provider === ModelProvider.HUGGINGFACE) {
    // For Hugging Face models - return a function that directly calls the HF API
    return async (input: { topic: string, expertResponsesText: string }): Promise<string> => {
      const userPromptText = `Topic: "${input.topic}"\n\nWorldview responses:\n${input.expertResponsesText}\n\nCreate a neutral summary paragraph highlighting the similarities and differences between these worldviews on this topic.`;
      
      try {
        const response = await generateTextWithHuggingFace(
          state.model as HuggingFaceModels,
          userPromptText,
          systemPromptText
        );
        return response;
      } catch (error) {
        console.error("Error generating summary with Hugging Face:", error);
        return "Error: Failed to generate a comparative summary using Hugging Face.";
      }
    };
  } else {
    // For OpenAI - use LangChain runnable
    const summaryPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemPromptText],
      ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nCreate a neutral summary paragraph highlighting the similarities and differences between these worldviews on this topic.`],
    ]);
    
    const customModel = new ChatOpenAI({
      modelName: state.model,
      temperature: 0,
    });
    
    return RunnableSequence.from([
      summaryPrompt,
      customModel,
      new StringOutputParser(),
    ]);
  }
};

// Create a chart data generator that uses the selected model
const createChartDataGenerator = (state: AgentState) => {
  const chartPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a comparative religion scholar analyzing theological overlap between different religions and worldviews."],
    ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nIdentify exactly 4 fundamental religious concepts that are either shared or contested across these worldviews (such as monotheism, scripture-based authority, soul/afterlife, moral absolutes, etc.). For each concept, score each worldview from 0 to 100 based on how central or important this concept is to that religion or worldview.\n\nReturn valid JSON data containing metrics (array of concept names) and scores (object mapping each worldview to an array of scores).`],
  ]);

  if (state.provider === ModelProvider.HUGGINGFACE) {
    // For Hugging Face models
    return async (input: { topic: string, expertResponsesText: string }) => {
      const systemPrompt = "You are a comparative religion scholar analyzing theological overlap between different religions and worldviews.";
      const userPrompt = `Topic: "${input.topic}"\n\nWorldview responses:\n${input.expertResponsesText}\n\nIdentify exactly 4 fundamental religious concepts that are either shared or contested across these worldviews (such as monotheism, scripture-based authority, soul/afterlife, moral absolutes, etc.). For each concept, score each worldview from 0 to 100 based on how central or important this concept is to that religion or worldview.\n\nReturn valid JSON data containing metrics (array of concept names) and scores (object mapping each worldview to an array of scores).`;
      
      try {
        const response = await generateTextWithHuggingFace(
          state.model as HuggingFaceModels,
          userPrompt,
          systemPrompt
        );
        
        // Attempt to parse the JSON response
        try {
          return JSON.parse(response);
        } catch (parseError) {
          console.error("Error parsing Hugging Face JSON response:", parseError);
          return { metrics: ["error"], scores: {} };
        }
      } catch (error) {
        console.error("Error generating chart data with Hugging Face:", error);
        return { metrics: ["error"], scores: {} };
      }
    };
  } else {
    // For OpenAI
    const customModel = new ChatOpenAI({
      modelName: state.model,
      temperature: 0,
    });
    
    return RunnableSequence.from([
      chartPrompt,
      customModel.bind({ response_format: { type: "json_object" } }),
      new JsonOutputParser(),
    ]);
  }
};

// Create a comparisons generator that uses the selected model
const createComparisonsGenerator = (state: AgentState) => {
  const comparisonPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a comparative religion expert. Generate structured comparison data for each worldview."],
    ["user", `Topic: "{topic}"\n\nWorldview responses:\n{expertResponsesText}\n\nGenerate a JSON object with data for each worldview. For each worldview, create an entry with summary (1-2 sentences), keyConcepts (array of 2-3 key terms), and afterlifeType (single term). Return valid JSON.`],
  ]);

  if (state.provider === ModelProvider.HUGGINGFACE) {
    // For Hugging Face models
    return async (input: { topic: string, expertResponsesText: string }) => {
      const systemPrompt = "You are a comparative religion expert. Generate structured comparison data for each worldview.";
      const userPrompt = `Topic: "${input.topic}"\n\nWorldview responses:\n${input.expertResponsesText}\n\nGenerate a JSON object with data for each worldview. For each worldview, create an entry with summary (1-2 sentences), keyConcepts (array of 2-3 key terms), and afterlifeType (single term). Return valid JSON.`;
      
      try {
        const response = await generateTextWithHuggingFace(
          state.model as HuggingFaceModels,
          userPrompt,
          systemPrompt
        );
        
        // Attempt to parse the JSON response
        try {
          return JSON.parse(response);
        } catch (parseError) {
          console.error("Error parsing Hugging Face JSON response for comparisons:", parseError);
          return {};
        }
      } catch (error) {
        console.error("Error generating comparisons with Hugging Face:", error);
        return {};
      }
    };
  } else {
    // For OpenAI
    const customModel = new ChatOpenAI({
      modelName: state.model,
      temperature: 0,
    });
    
    return RunnableSequence.from([
      comparisonPrompt,
      customModel.bind({ response_format: { type: "json_object" } }),
      new JsonOutputParser(),
    ]);
  }
};

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
      const expertAgents: Record<WorldView, any> = {} as any;
      for (const worldview of Object.values(WorldView)) {
        const expertAgentFn = createExpertAgent(worldview)(state);
        expertAgents[worldview] = expertAgentFn;
      }
      
      // Run all expert agents in parallel
      const expertPromises = Object.entries(expertAgents).map(async ([worldview, agentFn]) => {
        try {
          let response;
          if (state.provider === ModelProvider.HUGGINGFACE) {
            // Direct function call for Hugging Face
            response = await agentFn({ topic: state.topic });
          } else {
            // RunnableSequence invoke for OpenAI
            response = await agentFn.invoke({ topic: state.topic });
          }
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
      
      // Create a summary generator with the selected model
      const summaryGen = createSummaryGenerator(state);
      let summary = "";
      
      if (state.provider === ModelProvider.HUGGINGFACE) {
        // Direct function call for Hugging Face
        summary = await summaryGen({
          topic: state.topic,
          expertResponsesText
        }) as string;
      } else {
        // RunnableSequence invoke for OpenAI
        const runnable = summaryGen as RunnableSequence<any, any>;
        summary = await runnable.invoke({
          topic: state.topic,
          expertResponsesText
        });
      }
      
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
      
      // Create a chart data generator with the selected model
      const chartDataGen = createChartDataGenerator(state);
      let chartJson: ChartDataResponse;
      
      if (state.provider === ModelProvider.HUGGINGFACE) {
        // Direct function call for Hugging Face
        chartJson = await chartDataGen({
          topic: state.topic,
          expertResponsesText
        }) as ChartDataResponse;
      } else {
        // RunnableSequence invoke for OpenAI
        const runnable = chartDataGen as RunnableSequence<any, any>;
        chartJson = await runnable.invoke({
          topic: state.topic,
          expertResponsesText
        }) as ChartDataResponse;
      }
      
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
      let scores: Record<string, number[]> = {};
      
      // Handle different possible formats of scores in the response
      if (chartJson.scores) {
        if (typeof chartJson.scores === 'object') {
          scores = chartJson.scores;
        }
      }
      
      console.log("Original scores:", JSON.stringify(scores, null, 2));
      
      // For safety, ensure every worldview has corresponding scores
      const safeScores: Record<string, number[]> = { ...scores };
      for (const worldview of labels) {
        const wv = worldview.toString();
        
        // Initialize array for this worldview if it doesn't exist
        if (!safeScores[wv] || !Array.isArray(safeScores[wv])) {
          // Create default scores (different for each worldview for visual clarity)
          const defaultValue = labels.indexOf(worldview) * 10 + 30; // From 30 to 100
          safeScores[wv] = metrics.map(() => defaultValue);
        }
        
        // Ensure array is complete for all metrics
        if (safeScores[wv] && safeScores[wv].length < metrics.length) {
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
      
      // Create a comparisons generator with the selected model
      const comparisonsGen = createComparisonsGenerator(state);
      let comparisonData: ComparisonDataResponse;
      
      if (state.provider === ModelProvider.HUGGINGFACE) {
        // Direct function call for Hugging Face
        comparisonData = await comparisonsGen({
          topic: state.topic,
          expertResponsesText
        }) as ComparisonDataResponse;
      } else {
        // RunnableSequence invoke for OpenAI
        const runnable = comparisonsGen as RunnableSequence<any, any>;
        comparisonData = await runnable.invoke({
          topic: state.topic,
          expertResponsesText
        }) as ComparisonDataResponse;
      }
      
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
// with detailed process logging
export class LangGraphCoordinator {
  // Track process details for transparency
  private processDetails: {
    topic?: string;
    model?: string;
    provider?: string;
    expertPrompts?: Record<string, string>;
    expertResponses?: Record<string, string>;
    summaryPrompt?: string;
    chartDataPrompt?: string;
    comparisonsPrompt?: string;
    processingTimeMs?: Record<string, number>;
  };
  
  constructor() {
    this.processDetails = {};
  }
  
  // Get the detailed process information
  getProcessDetails() {
    return this.processDetails;
  }
  
  // Reset process details for a new request
  private resetProcessDetails() {
    this.processDetails = {
      expertPrompts: {},
      expertResponses: {},
      processingTimeMs: {},
      model: DEFAULT_OPENAI_MODEL,
      provider: ModelProvider.OPENAI,
    };
  }
  
  // Format prompt for logging
  private formatPrompt(systemPrompt: string, userPrompt: string): string {
    return `SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}`;
  }
  
  async processTopic(
    topic: string, 
    modelId: string = AIModel.GPT_4_O, 
    provider: string = ModelProvider.OPENAI
  ): Promise<{
    summary: string;
    chartData: ChartData;
    comparisons: WorldViewComparison[];
    processDetails?: any; // Optional processing details
  }> {
    try {
      // Reset and initialize the process details
      this.resetProcessDetails();
      this.processDetails.topic = topic;
      this.processDetails.model = modelId;
      this.processDetails.provider = provider;
      
      // Initialize the state
      let state: AgentState = {
        topic,
        model: modelId,
        provider: provider,
        expertResponses: {},
      };
      
      // Execute the nodes sequentially with detailed logging
      console.log("Processing topic:", topic);
      console.log("=== RELIGIOUS GURUS PROCESS INITIATED ===");
      
      // Step 1: Collect expert responses
      console.log("STEP 1: Collecting expert responses from all worldviews");
      const expertStartTime = Date.now();
      
      // Store the expert prompts for transparency
      Object.values(WorldView).forEach(worldview => {
        const systemPrompt = `You are an expert in ${worldview}. Provide a neutral, educational response about the given topic from the perspective of ${worldview}. Use 1-2 concise sentences.`;
        const userPrompt = `Given the topic "${topic}", describe the ${worldview} worldview's stance in 1-2 sentences, using neutral and educational language. Avoid bias or judgment.`;
        this.processDetails.expertPrompts![worldview.toString()] = this.formatPrompt(systemPrompt, userPrompt);
      });
      
      state = await nodes.collectExpertResponses(state);
      
      // Log expert responses
      console.log("Expert responses received:");
      Object.entries(state.expertResponses).forEach(([worldview, response]) => {
        console.log(`- ${worldview}: "${response}"`);
        this.processDetails.expertResponses![worldview] = response;
      });
      this.processDetails.processingTimeMs!["expertResponses"] = Date.now() - expertStartTime;
      
      // Step 2: Generate summary
      console.log("\nSTEP 2: Generating comparative summary");
      const summaryStartTime = Date.now();
      
      // Store the summary prompt
      const expertResponsesText = formatExpertResponses(state.expertResponses);
      const summarySystemPrompt = "You are a neutral comparative religion expert. Synthesize the provided worldview responses into a coherent summary paragraph that highlights similarities and differences without bias.";
      const summaryUserPrompt = `Topic: "${topic}"\n\nWorldview responses:\n${expertResponsesText}\n\nCreate a neutral summary paragraph highlighting the similarities and differences between these worldviews on this topic.`;
      this.processDetails.summaryPrompt = this.formatPrompt(summarySystemPrompt, summaryUserPrompt);
      
      state = await nodes.generateSummary(state);
      console.log("Summary generated:", state.summary?.substring(0, 100) + "...");
      this.processDetails.processingTimeMs!["summary"] = Date.now() - summaryStartTime;
      
      // Step 3: Generate chart data
      console.log("\nSTEP 3: Generating comparative visualization data");
      const chartStartTime = Date.now();
      
      // Store the chart data prompt
      const chartSystemPrompt = "You are a comparative religion scholar analyzing theological overlap between different religions and worldviews.";
      const chartUserPrompt = `Topic: "${topic}"\n\nWorldview responses:\n${expertResponsesText}\n\nIdentify exactly 4 fundamental religious concepts that are either shared or contested across these worldviews (such as monotheism, scripture-based authority, soul/afterlife, moral absolutes, etc.). For each concept, score each worldview from 0 to 100 based on how central or important this concept is to that religion or worldview.\n\nReturn valid JSON data containing metrics (array of concept names) and scores (object mapping each worldview to an array of scores).`;
      this.processDetails.chartDataPrompt = this.formatPrompt(chartSystemPrompt, chartUserPrompt);
      
      state = await nodes.generateChartData(state);
      console.log("Chart data generated with metrics:", state.chartData?.datasets.map(d => d.label).join(", "));
      this.processDetails.processingTimeMs!["chartData"] = Date.now() - chartStartTime;
      
      // Step 4: Generate comparisons
      console.log("\nSTEP 4: Generating detailed worldview comparisons");
      const comparisonsStartTime = Date.now();
      
      // Store the comparisons prompt
      const comparisonSystemPrompt = "You are a comparative religion expert. Generate structured comparison data for each worldview.";
      const comparisonUserPrompt = `Topic: "${topic}"\n\nWorldview responses:\n${expertResponsesText}\n\nGenerate a JSON object with data for each worldview. For each worldview, create an entry with summary (1-2 sentences), keyConcepts (array of 2-3 key terms), and afterlifeType (single term). Return valid JSON.`;
      this.processDetails.comparisonsPrompt = this.formatPrompt(comparisonSystemPrompt, comparisonUserPrompt);
      
      state = await nodes.generateComparisons(state);
      console.log("Detailed comparisons generated for worldviews:", Object.values(WorldView).join(", "));
      this.processDetails.processingTimeMs!["comparisons"] = Date.now() - comparisonsStartTime;
      
      console.log("=== RELIGIOUS GURUS PROCESS COMPLETED ===");
      
      // Return the final result with process details
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
        })),
        processDetails: this.processDetails // Include the detailed process information
      };
    } catch (error) {
      console.error("Error in LangGraph coordinator agent:", error);
      throw new Error("Failed to process topic. Please try again.");
    }
  }
}

// Export a singleton coordinator agent
export const langGraphCoordinator = new LangGraphCoordinator();