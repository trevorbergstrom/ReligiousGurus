import { ChartData, WorldView, WorldViewComparison, AIModel, ModelProvider } from "@shared/schema";
import { ChatOpenAI } from "@langchain/openai";
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

// Default models
const DEFAULT_MODEL = AIModel.GPT_4_O;

// Initialize the OpenAI model
const model = new ChatOpenAI({
  modelName: DEFAULT_MODEL,
  temperature: 0.7,
});

// For JSON output, use a stricter model with lower temperature
const jsonModel = new ChatOpenAI({
  modelName: DEFAULT_MODEL,
  temperature: 0.2,
});

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

type ExpertAgentReturn = RunnableSequence<any, string>;

const createExpertAgent = (worldview: WorldView): RunnableSequence<any, string> => {
  // Always use OpenAI for reliability
  const expertPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert in ${worldview}. Provide a comprehensive response about this topic from the perspective of ${worldview}. 
    Be accurate, educational, and neutral while representing the core beliefs and perspectives of this worldview faithfully.
    Write 3-4 paragraphs that cover the main points relevant to this topic from the ${worldview} perspective.
    Avoid using first person language. Cite scholarly sources or religious texts where appropriate.`],
    ["user", "{topic}"],
  ]);

  return RunnableSequence.from([
    expertPrompt,
    model,
    new StringOutputParser(),
  ]);
};

type SummaryGeneratorReturn = 
  | ((input: { topic: string, expertResponsesText: string }) => Promise<string>) 
  | RunnableSequence<any, string>;

const createSummaryGenerator = (state: AgentState): SummaryGeneratorReturn => {
  const summaryPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a comparative religion and philosophy expert. 
    Analyze the responses from different worldviews on the same topic and create a balanced, educational summary.
    
    Focus on key similarities and differences between the worldviews. Do not favor any particular perspective.
    Present a neutral, academic synthesis that highlights the diverse approaches to this topic.
    
    Write a concise summary (3-4 paragraphs) that a general audience can understand.`],
    ["user", `Topic: {topic}
    
    Worldview Expert Responses:
    {expertResponsesText}
    
    Please provide a balanced comparative summary that highlights similarities and differences between these worldviews on this topic.`],
  ]);
  
  return RunnableSequence.from([
    summaryPrompt,
    model,
    new StringOutputParser(),
  ]);
};

type ChartDataGeneratorReturn = 
  | ((input: { topic: string, expertResponsesText: string }) => Promise<ChartDataResponse>) 
  | RunnableSequence<any, ChartDataResponse>;

const createChartDataGenerator = (state: AgentState): ChartDataGeneratorReturn => {
  const chartDataPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a data analyst specializing in comparative religious and philosophical worldviews.
    
    Your task is to extract key metrics from worldview responses and generate normalized scores for visualization.
    
    Follow these rules:
    1. Identify 4-6 key concepts, principles, or values mentioned across the worldview responses
    2. For each worldview, assign a score (1-10) that reflects how important each concept is to that worldview's perspective on this topic
    3. Output ONLY valid JSON (no text, explanations, or markdown)
    
    Output format should be exactly:
    {
      "metrics": ["concept1", "concept2", "concept3", "concept4"],
      "scores": {
        "atheism": [score1, score2, score3, score4],
        "christianity": [score1, score2, score3, score4],
        etc. for each worldview
      }
    }`],
    ["user", `Topic: {topic}
    
    Worldview Expert Responses:
    {expertResponsesText}
    
    Generate chart data showing the importance of key concepts across worldviews.`]
  ]);
  
  return RunnableSequence.from([
    chartDataPrompt,
    jsonModel,
    new JsonOutputParser<ChartDataResponse>(),
  ]);
};

type ComparisonsGeneratorReturn = 
  | ((input: { topic: string, expertResponsesText: string }) => Promise<ComparisonDataResponse>) 
  | RunnableSequence<any, ComparisonDataResponse>;

const createComparisonsGenerator = (state: AgentState): ComparisonsGeneratorReturn => {
  const comparisonPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a comparative religion and philosophy expert.
    
    For each worldview represented in the responses, extract:
    1. A concise one-paragraph summary of their position on this topic
    2. 3-5 key concepts central to this worldview's approach to the topic
    3. The afterlife view category that best matches this worldview (e.g., "reincarnation", "heaven/hell", "none/cessation", "uncertain/agnostic", "nirvana/liberation", etc.)
    
    Output ONLY valid JSON with no additional text, explanations, or markdown:
    {
      "worldview1": {
        "summary": "Concise position summary...",
        "keyConcepts": ["concept1", "concept2", "concept3"],
        "afterlifeType": "category"
      },
      "worldview2": {
        ...etc for each worldview
      }
    }`],
    ["user", `Topic: {topic}
    
    Worldview Expert Responses:
    {expertResponsesText}
    
    Generate structured comparison data for each worldview.`],
  ]);
  
  return RunnableSequence.from([
    comparisonPrompt,
    jsonModel,
    new JsonOutputParser<ComparisonDataResponse>(),
  ]);
};

// LangGraph-inspired agent functions
const agentFunctions = {
  collectExpertResponses: async (state: AgentState): Promise<AgentState> => {
    console.log("Starting collectExpertResponses for topic:", state.topic);
    const worldviews = Object.values(WorldView);
    const expertResponses: Partial<Record<WorldView, string>> = {};
    const errors: string[] = [];
    
    // Process worldviews in parallel for efficiency
    await Promise.all(
      worldviews.map(async (worldview) => {
        try {
          const expertAgent = createExpertAgent(worldview as WorldView); // remove (state)
          const response = await expertAgent.invoke({ topic: state.topic }); // use invoke here
          expertResponses[worldview as WorldView] = response;
        } catch (error) {
          console.error(`Error getting ${worldview} expert response:`, error);
          errors.push(`${worldview} expert error: ${error}`);
          // Create a fallback response
          expertResponses[worldview as WorldView] = 
            `The ${worldview} perspective is currently unavailable. This worldview would typically provide insights on ${state.topic} relating to its core beliefs and principles.`;
        }
      })
    );
    
    return {
      ...state,
      expertResponses,
      errors: errors.length > 0 ? errors : undefined,
      allResponded: Object.keys(expertResponses).length === worldviews.length
    };
  },
  
  generateSummary: async (state: AgentState): Promise<AgentState> => {
    console.log("Generating summary...");
    try {
      // Format expert responses as a single text for the summary generator
      const expertResponsesText = Object.entries(state.expertResponses)
        .map(([worldview, response]) => `--- ${worldview.toUpperCase()} PERSPECTIVE ---\n${response}\n`)
        .join("\n\n");
      
      const summaryGenerator = createSummaryGenerator(state);
      const summary = await summaryGenerator({
        topic: state.topic,
        expertResponsesText
      });
      
      return { ...state, summary };
    } catch (error) {
      console.error("Error generating summary:", error);
      // Create a fallback summary
      return {
        ...state,
        summary: `We analyzed perspectives from multiple worldviews on "${state.topic}" but encountered an issue creating a comprehensive summary. Each worldview offers unique insights on this topic based on their core beliefs and principles.`
      };
    }
  },
  
  generateChartData: async (state: AgentState): Promise<AgentState> => {
    console.log("Generating chart data...");
    try {
      // Format expert responses as a single text
      const expertResponsesText = Object.entries(state.expertResponses)
        .map(([worldview, response]) => `--- ${worldview.toUpperCase()} PERSPECTIVE ---\n${response}\n`)
        .join("\n\n");
      
      // Generate chart data
      try {
        const chartDataGenerator = createChartDataGenerator(state);
        let chartJson: ChartDataResponse = await chartDataGenerator({
          topic: state.topic,
          expertResponsesText
        });
        
        // Convert to chart data format
        const chartData: ChartData = sanitizeChartData(chartJson);
        return { ...state, chartData };
      } catch (innerError) {
        console.error("Error in chart data JSON generation:", innerError);
        // Fallback to default chart data
        const chartData: ChartData = {
          labels: ["Spirituality", "Rationality", "Community", "Authority", "Ethics"],
          datasets: Object.entries(state.expertResponses).map(([worldview, _]) => ({
            label: worldview,
            data: [
              Math.floor(Math.random() * 10) + 1,
              Math.floor(Math.random() * 10) + 1,
              Math.floor(Math.random() * 10) + 1,
              Math.floor(Math.random() * 10) + 1,
              Math.floor(Math.random() * 10) + 1
            ],
            backgroundColor: getColorForWorldview(worldview),
            borderColor: getColorForWorldview(worldview),
            borderWidth: 1
          }))
        };
        return { ...state, chartData };
      }
    } catch (error) {
      console.error("Overall error generating chart data:", error);
      return { ...state, chartData: generateDefaultChartData() };
    }
  },
  
  generateComparisons: async (state: AgentState): Promise<AgentState> => {
    console.log("Generating detailed comparisons...");
    try {
      // Format expert responses
      const expertResponsesText = Object.entries(state.expertResponses)
        .map(([worldview, response]) => `--- ${worldview.toUpperCase()} PERSPECTIVE ---\n${response}\n`)
        .join("\n\n");
      
      try {
        const comparisonsGenerator = createComparisonsGenerator(state);
        let comparisonData: ComparisonDataResponse = await comparisonsGenerator({
          topic: state.topic,
          expertResponsesText
        });
        
        // Convert to our expected format
        const comparisons: WorldViewComparison[] = Object.entries(comparisonData).map(([worldview, data]) => ({
          worldview: worldview as WorldView,
          summary: data.summary,
          keyConcepts: data.keyConcepts,
          afterlifeType: data.afterlifeType
        }));
        
        return { ...state, comparisons };
      } catch (innerError) {
        console.error("Error in comparisons JSON generation:", innerError);
        // Create fallback comparisons
        const comparisons: WorldViewComparison[] = Object.keys(state.expertResponses).map(worldview => ({
          worldview: worldview as WorldView,
          summary: `The ${worldview} perspective on ${state.topic} reflects its core principles and beliefs.`,
          keyConcepts: ["belief", "ethics", "practice", "tradition"],
          afterlifeType: getDefaultAfterlifeType(worldview)
        }));
        
        return { ...state, comparisons };
      }
    } catch (error) {
      console.error("Overall error generating comparisons:", error);
      // Even more basic fallback if something goes wrong at the top level
      const comparisons: WorldViewComparison[] = Object.keys(state.expertResponses).map(worldview => ({
        worldview: worldview as WorldView,
        summary: `${worldview} perspective`,
        keyConcepts: ["belief"],
        afterlifeType: "unknown"
      }));
      
      return { ...state, comparisons };
    }
  }
};

// Helper function to get color for worldview
function getColorForWorldview(worldview: string): string {
  switch (worldview) {
    case WorldView.CHRISTIANITY:
      return 'rgba(59, 130, 246, 0.5)'; // blue
    case WorldView.ISLAM:
      return 'rgba(16, 185, 129, 0.5)'; // green
    case WorldView.HINDUISM:
      return 'rgba(249, 115, 22, 0.5)'; // orange
    case WorldView.BUDDHISM:
      return 'rgba(245, 158, 11, 0.5)'; // amber
    case WorldView.JUDAISM:
      return 'rgba(139, 92, 246, 0.5)'; // purple
    case WorldView.ATHEISM:
      return 'rgba(239, 68, 68, 0.5)'; // red
    case WorldView.AGNOSTICISM:
      return 'rgba(107, 114, 128, 0.5)'; // gray
    case WorldView.SIKHISM:
      return 'rgba(249, 115, 22, 0.5)'; // orange
    default:
      return 'rgba(107, 114, 128, 0.5)'; // gray
  }
}

// Helper function for fallback afterlife types
function getDefaultAfterlifeType(worldview: string): string {
  switch (worldview) {
    case WorldView.CHRISTIANITY:
    case WorldView.ISLAM:
    case WorldView.JUDAISM:
      return "heaven/hell";
    case WorldView.HINDUISM:
    case WorldView.SIKHISM:
      return "reincarnation";
    case WorldView.BUDDHISM:
      return "nirvana/liberation";
    case WorldView.ATHEISM:
      return "none/cessation";
    case WorldView.AGNOSTICISM:
      return "uncertain/agnostic";
    default:
      return "unknown";
  }
}

export class LangGraphCoordinator {
  private processDetails: {
    executionPath?: string[];
    timings?: Record<string, number>;
    expertResponses?: Record<string, string>;
    topicProcessed?: string;
  } = {};
  
  constructor() {
    // Initialize the coordinator
    this.resetProcessDetails();
  }
  
  getProcessDetails() {
    return this.processDetails;
  }
  
  private resetProcessDetails() {
    this.processDetails = {
      executionPath: [],
      timings: {},
      expertResponses: {},
      topicProcessed: undefined
    };
  }
  
  private formatPrompt(systemPrompt: string, userPrompt: string): string {
    return `System: ${systemPrompt}\n\nUser: ${userPrompt}`;
  }
  
  async processTopic(
    topic: string,
    model: string = DEFAULT_MODEL,
    provider: string = ModelProvider.OPENAI
  ): Promise<{
    summary: string;
    chartData: ChartData;
    comparisons: WorldViewComparison[];
  }> {
    try {
      console.log(`Processing topic: "${topic}" with model: ${model}, provider: ${provider}`);
      
      // Reset process details for new topic
      this.resetProcessDetails();
      this.processDetails.topicProcessed = topic;
      
      // Initialize the state
      let state: AgentState = {
        topic,
        model,
        provider,
        expertResponses: {}
      };
      
      // Execute steps sequentially, tracking timing
      const startTime = Date.now();
      
      // Step 1: Collect expert responses
      this.processDetails.executionPath?.push("collectExpertResponses");
      const stepStartTime = Date.now();
      state = await agentFunctions.collectExpertResponses(state);
      if (this.processDetails.timings) {
        this.processDetails.timings.collectExpertResponses = Date.now() - stepStartTime;
      }
      
      // Store expert responses for transparency
      if (state.expertResponses && this.processDetails.expertResponses) {
        Object.entries(state.expertResponses).forEach(([worldview, response]) => {
          if (this.processDetails.expertResponses) {
            this.processDetails.expertResponses[worldview] = response;
          }
        });
      }
      
      // Step 2: Generate summary
      this.processDetails.executionPath?.push("generateSummary");
      const summaryStartTime = Date.now();
      state = await agentFunctions.generateSummary(state);
      if (this.processDetails.timings) {
        this.processDetails.timings.generateSummary = Date.now() - summaryStartTime;
      }
      
      // Step 3: Generate chart data
      this.processDetails.executionPath?.push("generateChartData");
      const chartStartTime = Date.now();
      state = await agentFunctions.generateChartData(state);
      if (this.processDetails.timings) {
        this.processDetails.timings.generateChartData = Date.now() - chartStartTime;
      }
      
      // Step 4: Generate detailed comparisons
      this.processDetails.executionPath?.push("generateComparisons");
      const comparisonStartTime = Date.now();
      state = await agentFunctions.generateComparisons(state);
      if (this.processDetails.timings) {
        this.processDetails.timings.generateComparisons = Date.now() - comparisonStartTime;
      }
      
      // Add total execution time
      if (this.processDetails.timings) {
        this.processDetails.timings.total = Date.now() - startTime;
      }
      
      return {
        summary: state.summary || "Failed to generate summary.",
        chartData: state.chartData || generateDefaultChartData(),
        comparisons: state.comparisons || []
      };
    } catch (error) {
      console.error("Error in LangGraphCoordinator:", error);
      // Handle gracefully by returning default values
      return {
        summary: `We analyzed the topic "${topic}" from multiple worldview perspectives but encountered an error.`,
        chartData: generateDefaultChartData(),
        comparisons: []
      };
    }
  }
}

export const langGraphCoordinator = new LangGraphCoordinator();
