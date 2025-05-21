/**
 * Religious Gurus - Comparative Worldview Explorer
 * Copyright (c) 2025 Religious Gurus Project
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorldView } from "@shared/schema";

/**
 * A simple implementation of a copilot assistant for the Religious Gurus application
 * that will be enhanced with CopilotKit in future iterations.
 */
export function ReligiousCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<{ 
    role: "user" | "assistant", 
    content: string 
  }[]>([
    { 
      role: "assistant", 
      content: "Welcome to Religious Gurus! I'm your spiritual exploration assistant. How can I help you learn about different worldviews today?" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to conversation
    const userMessage = { role: "user" as const, content: message };
    const updatedConversation = [
      ...conversation,
      userMessage
    ];
    
    setConversation(updatedConversation);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Format conversation for the API - only send the last few messages for context
      const messagesForApi = updatedConversation.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call the Copilot API
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForApi,
          context: [
            { 
              name: "worldviews", 
              text: "The available worldviews include: Atheism, Agnosticism, Christianity, Islam, Hinduism, Buddhism, Judaism, Sikhism" 
            },
            {
              name: "app_description",
              text: "Religious Gurus is an educational AI application that provides neutral, comparative insights on religious and non-religious worldviews across user-submitted topics."
            }
          ]
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const assistantMessage = { 
        role: "assistant" as const, 
        content: data.content || "Sorry, I couldn't process your request."
      };
      
      setConversation([
        ...updatedConversation,
        assistantMessage
      ]);
    } catch (error) {
      console.error('Error calling Copilot API:', error);
      // Fallback to local response in case of API error
      const copilotResponse = generateCopilotResponse(message);
      const assistantMessage = { 
        role: "assistant" as const, 
        content: `I'm having trouble connecting to the server. Here's a basic response: ${copilotResponse}`
      };
      setConversation([
        ...updatedConversation,
        assistantMessage
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple response generator that will be replaced with the real CopilotKit API
  const generateCopilotResponse = (userMessage: string): string => {
    const userMessageLower = userMessage.toLowerCase();
    
    // Check for worldview-related questions
    const worldviews = Object.values(WorldView);
    for (const worldview of worldviews) {
      if (userMessageLower.includes(worldview.toLowerCase())) {
        return `To explore ${worldview}, I recommend trying the chat feature with that specific worldview selected. You can also compare multiple worldviews by creating a group chat!`;
      }
    }
    
    // Default responses
    if (userMessageLower.includes("help")) {
      return "I can help you navigate the Religious Gurus app! You can ask me about different worldviews, how to use the comparison tool, or how to start a group chat with multiple religious perspectives.";
    }
    
    if (userMessageLower.includes("comparison") || userMessageLower.includes("compare")) {
      return "To compare worldviews, go to the home page and enter a topic like 'meaning of life' or 'concept of soul'. You'll receive a neutral summary and visualization comparing how different worldviews approach that topic.";
    }
    
    if (userMessageLower.includes("group chat")) {
      return "To start a group chat with multiple religious perspectives, go to the Chat page and click 'New Chat'. Then select the 'Group Chat' tab and choose which worldviews you want to include in your conversation.";
    }
    
    return "To learn more about different worldviews, you can either use our comparison tool on the home page or chat with individual worldview experts in the Chat section. Is there something specific you'd like to explore?";
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 flex items-center justify-center bg-teal-600 hover:bg-teal-700 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <path d="M12 17h.01"></path>
        </svg>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 flex flex-col shadow-lg">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-sm flex justify-between items-center">
          <span>Religious Gurus Assistant</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-3 space-y-4">
        {conversation.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-2 ${
                msg.role === "user" 
                  ? "bg-blue-100 text-blue-900" 
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <div 
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      ? msg.content
                          .replace(/\n\n/g, '<br/><br/>')
                          .replace(/\n/g, '<br/>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      : ''
                  }}
                />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-lg p-2">
              <div className="flex space-x-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-2 border-t">
        <form 
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about worldviews..."
            className="flex-grow text-sm"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!message.trim() || isLoading}
          >
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}