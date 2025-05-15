import { apiRequest } from "./queryClient";
import { TopicData, ResponseData, TopicResponsePair } from "@/types";

// API functions for interacting with the backend

// Fetch all topics or search topics
export const fetchTopics = async (query?: string): Promise<TopicData[]> => {
  const url = query ? `/api/topics?q=${encodeURIComponent(query)}` : "/api/topics";
  const response = await apiRequest("GET", url);
  return await response.json();
};

// Submit a new topic
export const submitTopic = async (content: string): Promise<TopicResponsePair> => {
  const response = await apiRequest("POST", "/api/topics", { content });
  return await response.json();
};

// Fetch a response for a specific topic
export const fetchResponse = async (topicId: number): Promise<TopicResponsePair> => {
  const response = await apiRequest("GET", `/api/topics/${topicId}/response`);
  return await response.json();
};
