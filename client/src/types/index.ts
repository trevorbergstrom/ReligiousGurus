import { ChartData, WorldViewComparison } from "@shared/schema";

export interface TopicData {
  id: number;
  content: string;
  model?: string;
  provider?: string;
  createdAt: string; // ISO date string
}

export interface ResponseData {
  id: number;
  topicId: number;
  summary: string;
  chartData: ChartData;
  comparisons: WorldViewComparison[];
  createdAt: string; // ISO date string
}

export interface TopicResponsePair {
  topic: TopicData;
  response: ResponseData;
}

export type { ChartData, WorldViewComparison };
