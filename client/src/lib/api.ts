import { apiRequest } from "./queryClient";
import { TopicData, ResponseData, TopicResponsePair } from "@/types";
import { ChatSession, ChatMessage, WorldView } from "@shared/schema";

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

// Chat API functions

// Fetch all chat sessions
export const fetchChatSessions = async (worldview?: string): Promise<ChatSession[]> => {
  const url = worldview ? `/api/chat/sessions?worldview=${encodeURIComponent(worldview)}` : "/api/chat/sessions";
  const response = await apiRequest(url);
  return response;
};

// Fetch a specific chat session
export const fetchChatSession = async (sessionId: string): Promise<ChatSession> => {
  const response = await apiRequest(`/api/chat/sessions/${sessionId}`);
  return response;
};

// Create a new chat session
export const createChatSession = async (data: { worldview: string; title: string }): Promise<ChatSession> => {
  const response = await apiRequest(`/api/chat/sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
};

// Fetch messages for a chat session
export const fetchChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await apiRequest(`/api/chat/sessions/${sessionId}/messages`);
  return response;
};

// Send a message in a chat session
export const sendChatMessage = async (sessionId: string, content: string): Promise<{
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}> => {
  const response = await apiRequest(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response;
};
