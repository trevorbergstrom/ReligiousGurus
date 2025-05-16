import { apiRequest } from "./queryClient";
import { TopicData, ResponseData, TopicResponsePair } from "@/types";
import { ChatSession, ChatMessage, WorldView, AIModel, ModelProvider } from "@shared/schema";

// API functions for interacting with the backend

// Fetch all topics or search topics
export const fetchTopics = async (query?: string): Promise<TopicData[]> => {
  const url = query ? `/api/topics?q=${encodeURIComponent(query)}` : "/api/topics";
  const response = await apiRequest("GET", url);
  return await response.json();
};

// Submit a new topic
export const submitTopic = async (data: { 
  content: string, 
  model?: string, 
  provider?: string 
}): Promise<TopicResponsePair> => {
  // Apply defaults if not provided
  const payload = {
    content: data.content,
    model: data.model || AIModel.GPT_4_O,
    provider: data.provider || ModelProvider.OPENAI
  };
  
  const response = await apiRequest("POST", "/api/topics", payload);
  return await response.json();
};

// Fetch a response for a specific topic
export const fetchResponse = async (topicId: number): Promise<TopicResponsePair> => {
  const response = await apiRequest("GET", `/api/topics/${topicId}/response`);
  return await response.json();
};

// Delete a topic
export const deleteTopic = async (topicId: number): Promise<void> => {
  await apiRequest("DELETE", `/api/topics/${topicId}`);
};

// Chat API functions

// Fetch all chat sessions
export const fetchChatSessions = async (worldview?: string): Promise<ChatSession[]> => {
  const url = worldview ? `/api/chat/sessions?worldview=${encodeURIComponent(worldview)}` : "/api/chat/sessions";
  const response = await apiRequest("GET", url);
  return await response.json();
};

// Fetch a specific chat session
export const fetchChatSession = async (sessionId: string): Promise<ChatSession> => {
  const response = await apiRequest("GET", `/api/chat/sessions/${sessionId}`);
  return await response.json();
};

// Create a new chat session
export const createChatSession = async (data: { worldview: string; title: string }): Promise<ChatSession> => {
  const response = await apiRequest("POST", `/api/chat/sessions`, data);
  return await response.json();
};

// Delete a chat session
export const deleteChatSession = async (sessionId: string): Promise<void> => {
  await apiRequest("DELETE", `/api/chat/sessions/${sessionId}`);
};

// Fetch messages for a chat session
export const fetchChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await apiRequest("GET", `/api/chat/sessions/${sessionId}/messages`);
  return await response.json();
};

// Send a message in a chat session
export const sendChatMessage = async (
  sessionId: string, 
  content: string, 
  model?: string, 
  provider?: string
): Promise<{
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}> => {
  const response = await apiRequest(
    "POST", 
    `/api/chat/sessions/${sessionId}/messages`, 
    { content, model, provider }
  );
  return await response.json();
};

// Fetch the detailed process information for how a response was generated
export const fetchProcessDetails = async (topicId: number): Promise<any> => {
  const response = await apiRequest("GET", `/api/topics/${topicId}/process-details`);
  return await response.json();
};
